import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  UATFeedback,
  UATFeedbackStatus,
  ProjectSignoff,
  SignoffType,
  CreateUATFeedbackInput,
  CreateSignoffInput,
} from '../../../shared/types';

// UAT Feedback
interface UATFeedbackRow {
  id: string;
  project_id: string;
  feature_name: string | null;
  page_url: string | null;
  feedback_text: string;
  status: UATFeedbackStatus;
  provided_by: string;
  addressed_at: string | null;
  created_at: string;
}

function mapRowToUATFeedback(row: UATFeedbackRow): UATFeedback {
  return {
    id: row.id,
    projectId: row.project_id,
    featureName: row.feature_name || undefined,
    pageUrl: row.page_url || undefined,
    feedbackText: row.feedback_text,
    status: row.status,
    providedBy: row.provided_by,
    addressedAt: row.addressed_at || undefined,
    createdAt: row.created_at,
  };
}

export async function findUATFeedbackByProjectId(projectId: string): Promise<UATFeedback[]> {
  const rows = await query<UATFeedbackRow[]>(
    'SELECT * FROM uat_feedback WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return rows.map(mapRowToUATFeedback);
}

export async function findUATFeedbackById(id: string): Promise<UATFeedback | null> {
  const rows = await query<UATFeedbackRow[]>('SELECT * FROM uat_feedback WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRowToUATFeedback(rows[0]);
}

export async function createUATFeedback(input: CreateUATFeedbackInput): Promise<UATFeedback> {
  const id = uuidv4();
  await query(
    `INSERT INTO uat_feedback (id, project_id, feature_name, page_url, feedback_text, provided_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.projectId, input.featureName || null, input.pageUrl || null, input.feedbackText, input.providedBy]
  );
  const feedback = await findUATFeedbackById(id);
  if (!feedback) throw new Error('Failed to create UAT feedback');
  return feedback;
}

export async function updateUATFeedbackStatus(id: string, status: UATFeedbackStatus): Promise<UATFeedback | null> {
  const addressedAt = status === 'ADDRESSED' ? 'NOW()' : 'NULL';
  await query(
    `UPDATE uat_feedback SET status = ?, addressed_at = ${addressedAt === 'NOW()' ? 'NOW()' : 'NULL'} WHERE id = ?`,
    [status, id]
  );
  return findUATFeedbackById(id);
}

export async function getPendingFeedbackCount(projectId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM uat_feedback WHERE project_id = ? AND status = 'PENDING'`,
    [projectId]
  );
  return rows[0]?.count || 0;
}

export async function isAllFeedbackAddressed(projectId: string): Promise<boolean> {
  const pendingCount = await getPendingFeedbackCount(projectId);
  return pendingCount === 0;
}


// Project Signoffs
interface SignoffRow {
  id: string;
  project_id: string;
  signoff_type: SignoffType;
  approver_name: string;
  approver_email: string | null;
  signature_data: string | null;
  signed_at: string;
  notes: string | null;
}

function mapRowToSignoff(row: SignoffRow): ProjectSignoff {
  return {
    id: row.id,
    projectId: row.project_id,
    signoffType: row.signoff_type,
    approverName: row.approver_name,
    approverEmail: row.approver_email || undefined,
    signatureData: row.signature_data || undefined,
    signedAt: row.signed_at,
    notes: row.notes || undefined,
  };
}

export async function findSignoffsByProjectId(projectId: string): Promise<ProjectSignoff[]> {
  const rows = await query<SignoffRow[]>(
    'SELECT * FROM project_signoffs WHERE project_id = ? ORDER BY signed_at DESC',
    [projectId]
  );
  return rows.map(mapRowToSignoff);
}

export async function findSignoffById(id: string): Promise<ProjectSignoff | null> {
  const rows = await query<SignoffRow[]>('SELECT * FROM project_signoffs WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRowToSignoff(rows[0]);
}

export async function findSignoffByType(projectId: string, signoffType: SignoffType): Promise<ProjectSignoff | null> {
  const rows = await query<SignoffRow[]>(
    'SELECT * FROM project_signoffs WHERE project_id = ? AND signoff_type = ? ORDER BY signed_at DESC LIMIT 1',
    [projectId, signoffType]
  );
  if (rows.length === 0) return null;
  return mapRowToSignoff(rows[0]);
}

export async function createSignoff(input: CreateSignoffInput): Promise<ProjectSignoff> {
  const id = uuidv4();
  await query(
    `INSERT INTO project_signoffs (id, project_id, signoff_type, approver_name, approver_email, signature_data, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.projectId, input.signoffType, input.approverName, input.approverEmail || null, input.signatureData || null, input.notes || null]
  );
  const signoff = await findSignoffById(id);
  if (!signoff) throw new Error('Failed to create signoff');
  return signoff;
}

export async function hasSignoff(projectId: string, signoffType: SignoffType): Promise<boolean> {
  const signoff = await findSignoffByType(projectId, signoffType);
  return signoff !== null;
}

export default {
  findUATFeedbackByProjectId,
  findUATFeedbackById,
  createUATFeedback,
  updateUATFeedbackStatus,
  getPendingFeedbackCount,
  isAllFeedbackAddressed,
  findSignoffsByProjectId,
  findSignoffById,
  findSignoffByType,
  createSignoff,
  hasSignoff,
};
