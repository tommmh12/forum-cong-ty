import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  BugReport,
  BugSeverity,
  BugStatus,
  EnvironmentType,
  CreateBugReportInput,
} from '../../../shared/types';

interface BugReportRow {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  description: string | null;
  severity: BugSeverity;
  status: BugStatus;
  environment: EnvironmentType;
  reproduction_steps: string;
  reported_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
}

function mapRowToBugReport(row: BugReportRow): BugReport {
  return {
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id || undefined,
    title: row.title,
    description: row.description || undefined,
    severity: row.severity,
    status: row.status,
    environment: row.environment,
    reproductionSteps: row.reproduction_steps,
    reportedBy: row.reported_by,
    assignedTo: row.assigned_to || undefined,
    resolvedAt: row.resolved_at || undefined,
    createdAt: row.created_at,
  };
}

export async function findBugReportsByProjectId(projectId: string): Promise<BugReport[]> {
  const rows = await query<BugReportRow[]>(
    'SELECT * FROM bug_reports WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return rows.map(mapRowToBugReport);
}

export async function findBugReportById(id: string): Promise<BugReport | null> {
  const rows = await query<BugReportRow[]>('SELECT * FROM bug_reports WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRowToBugReport(rows[0]);
}

export async function findBugReportsBySeverity(projectId: string, severity: BugSeverity): Promise<BugReport[]> {
  const rows = await query<BugReportRow[]>(
    'SELECT * FROM bug_reports WHERE project_id = ? AND severity = ? ORDER BY created_at DESC',
    [projectId, severity]
  );
  return rows.map(mapRowToBugReport);
}

export async function findCriticalBugs(projectId: string): Promise<BugReport[]> {
  const rows = await query<BugReportRow[]>(
    `SELECT * FROM bug_reports WHERE project_id = ? AND severity = 'CRITICAL' AND status NOT IN ('RESOLVED', 'CLOSED', 'WONT_FIX') ORDER BY created_at DESC`,
    [projectId]
  );
  return rows.map(mapRowToBugReport);
}


export async function createBugReport(input: CreateBugReportInput): Promise<BugReport> {
  const id = uuidv4();
  
  await query(
    `INSERT INTO bug_reports (id, project_id, task_id, title, description, severity, environment, reproduction_steps, reported_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, input.projectId, input.taskId || null, input.title, input.description || null, input.severity, input.environment, input.reproductionSteps, input.reportedBy]
  );
  
  const bug = await findBugReportById(id);
  if (!bug) throw new Error('Failed to create bug report');
  return bug;
}

export async function updateBugReportStatus(id: string, status: BugStatus): Promise<BugReport | null> {
  // Determine resolved_at value in application code
  // Set to current timestamp when transitioning to RESOLVED or CLOSED, null otherwise
  const resolvedAt = ['RESOLVED', 'CLOSED'].includes(status) 
    ? new Date().toISOString().slice(0, 19).replace('T', ' ') 
    : null;
  
  await query(
    'UPDATE bug_reports SET status = ?, resolved_at = ? WHERE id = ?',
    [status, resolvedAt, id]
  );
  return findBugReportById(id);
}

export async function assignBugReport(id: string, assignedTo: string): Promise<BugReport | null> {
  await query('UPDATE bug_reports SET assigned_to = ?, status = "IN_PROGRESS" WHERE id = ?', [assignedTo, id]);
  return findBugReportById(id);
}

export async function getBugStats(projectId: string): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
  high: number;
}> {
  const statusRows = await query<{ status: BugStatus; count: number }[]>(
    'SELECT status, COUNT(*) as count FROM bug_reports WHERE project_id = ? GROUP BY status',
    [projectId]
  );
  
  const severityRows = await query<{ severity: BugSeverity; count: number }[]>(
    `SELECT severity, COUNT(*) as count FROM bug_reports WHERE project_id = ? AND status NOT IN ('RESOLVED', 'CLOSED', 'WONT_FIX') GROUP BY severity`,
    [projectId]
  );
  
  const stats = { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, high: 0 };
  
  for (const row of statusRows) {
    stats.total += row.count;
    if (row.status === 'OPEN') stats.open = row.count;
    if (row.status === 'IN_PROGRESS') stats.inProgress = row.count;
    if (['RESOLVED', 'CLOSED'].includes(row.status)) stats.resolved += row.count;
  }
  
  for (const row of severityRows) {
    if (row.severity === 'CRITICAL') stats.critical = row.count;
    if (row.severity === 'HIGH') stats.high = row.count;
  }
  
  return stats;
}

export default {
  findBugReportsByProjectId,
  findBugReportById,
  findBugReportsBySeverity,
  findCriticalBugs,
  createBugReport,
  updateBugReportStatus,
  assignBugReport,
  getBugStats,
};
