import * as projectRepo from '../repositories/project.repository';
import * as resourceRepo from '../repositories/resource.repository';
import * as phaseRepo from '../repositories/phase.repository';
import * as techStackRepo from '../repositories/tech-stack.repository';
import * as environmentRepo from '../repositories/environment.repository';
import * as bugReportRepo from '../repositories/bug-report.repository';
import * as uatRepo from '../repositories/uat.repository';
import { ProjectExport } from '../../../shared/types';

/**
 * Export project data as JSON
 */
export async function exportProjectAsJSON(projectId: string): Promise<ProjectExport | null> {
  const project = await projectRepo.findProjectById(projectId);
  if (!project) return null;

  const [phases, resources, techStack, environments, tasks, columns, bugReports, uatFeedback, signoffs] = await Promise.all([
    phaseRepo.findPhasesByProjectId(projectId),
    resourceRepo.findResourcesByProjectId(projectId),
    techStackRepo.findTechStackByProjectId(projectId),
    environmentRepo.findEnvironmentsByProjectId(projectId),
    projectRepo.findWebTasksByProjectId(projectId),
    projectRepo.findTaskColumnsByProjectId(projectId),
    bugReportRepo.findBugReportsByProjectId(projectId),
    uatRepo.findUATFeedbackByProjectId(projectId),
    uatRepo.findSignoffsByProjectId(projectId),
  ]);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    project,
    phases,
    resources,
    techStack,
    environments,
    tasks,
    columns,
    bugReports,
    uatFeedback,
    signoffs,
  };
}

/**
 * Validate import data
 */
export function validateImportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.version) errors.push('Missing version');
  if (!data.project) errors.push('Missing project data');
  if (!data.project?.name) errors.push('Missing project name');
  if (!Array.isArray(data.phases)) errors.push('Invalid phases data');
  if (!Array.isArray(data.tasks)) errors.push('Invalid tasks data');

  return { valid: errors.length === 0, errors };
}

/**
 * Export project as CSV (tasks only)
 */
export async function exportTasksAsCSV(projectId: string): Promise<string> {
  const tasks = await projectRepo.findWebTasksByProjectId(projectId);
  
  const headers = ['Code', 'Title', 'Type', 'Priority', 'Category', 'Status', 'Assignee', 'Due Date'];
  const rows = tasks.map(task => [
    task.code,
    `"${task.title.replace(/"/g, '""')}"`,
    task.type,
    task.priority,
    task.category || '',
    task.columnId,
    task.assigneeName || '',
    task.dueDate || '',
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Generate PDF report data (returns structured data for PDF generation)
 */
export async function generatePDFReportData(projectId: string): Promise<{
  project: any;
  summary: {
    totalTasks: number;
    completedTasks: number;
    totalBugs: number;
    resolvedBugs: number;
    currentPhase: string;
  };
  phases: any[];
  techStack: any[];
}> {
  const project = await projectRepo.findProjectById(projectId);
  const tasks = await projectRepo.findWebTasksByProjectId(projectId);
  const phases = await phaseRepo.findPhasesByProjectId(projectId);
  const techStack = await techStackRepo.findTechStackByProjectId(projectId);
  const bugStats = await bugReportRepo.getBugStats(projectId);

  const currentPhase = phases.find(p => p.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.columnId === 'done').length;

  return {
    project,
    summary: {
      totalTasks: tasks.length,
      completedTasks,
      totalBugs: bugStats.total,
      resolvedBugs: bugStats.resolved,
      currentPhase: currentPhase?.phaseType || 'N/A',
    },
    phases,
    techStack,
  };
}

export default {
  exportProjectAsJSON,
  validateImportData,
  exportTasksAsCSV,
  generatePDFReportData,
};
