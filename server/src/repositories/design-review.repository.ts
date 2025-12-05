import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  DesignReview,
  DesignReviewStatus,
} from '../../../shared/types';

// Row interface for database mapping
interface DesignReviewRow {
  id: string;
  project_id: string;
  resource_id: string;
  status: DesignReviewStatus;
  reviewer_id: string | null;
  reviewed_at: string | null;
  comments: string | null;
  version_locked: number | null;
  created_at: string;
}

function mapRowToDesignReview(row: DesignReviewRow): DesignReview {
  return {
    id: row.id,
    projectId: row.project_id,
    resourceId: row.resource_id,
    status: row.status,
    reviewerId: row.reviewer_id || undefined,
    reviewedAt: row.reviewed_at || undefined,
    comments: row.comments || undefined,
    versionLocked: row.version_locked || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Find all design reviews for a project
 */
export async function findDesignReviewsByProjectId(projectId: string): Promise<DesignReview[]> {
  const rows = await query<DesignReviewRow[]>(
    'SELECT * FROM design_reviews WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return rows.map(mapRowToDesignReview);
}

/**
 * Find design review by ID
 */
export async function findDesignReviewById(id: string): Promise<DesignReview | null> {
  const rows = await query<DesignReviewRow[]>(
    'SELECT * FROM design_reviews WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return mapRowToDesignReview(rows[0]);
}


/**
 * Find design review by resource ID
 */
export async function findDesignReviewByResourceId(resourceId: string): Promise<DesignReview | null> {
  const rows = await query<DesignReviewRow[]>(
    'SELECT * FROM design_reviews WHERE resource_id = ? ORDER BY created_at DESC LIMIT 1',
    [resourceId]
  );
  if (rows.length === 0) return null;
  return mapRowToDesignReview(rows[0]);
}

/**
 * Create a new design review
 */
export async function createDesignReview(
  projectId: string,
  resourceId: string
): Promise<DesignReview> {
  const id = uuidv4();
  
  await query(
    `INSERT INTO design_reviews (id, project_id, resource_id, status)
     VALUES (?, ?, ?, 'PENDING')`,
    [id, projectId, resourceId]
  );
  
  const review = await findDesignReviewById(id);
  if (!review) throw new Error('Failed to create design review');
  return review;
}

/**
 * Approve a design review
 */
export async function approveDesignReview(
  id: string,
  reviewerId: string,
  versionLocked: number,
  comments?: string
): Promise<DesignReview | null> {
  await query(
    `UPDATE design_reviews 
     SET status = 'APPROVED', reviewer_id = ?, reviewed_at = NOW(), version_locked = ?, comments = ?
     WHERE id = ?`,
    [reviewerId, versionLocked, comments || null, id]
  );
  return findDesignReviewById(id);
}

/**
 * Reject a design review
 */
export async function rejectDesignReview(
  id: string,
  reviewerId: string,
  comments: string
): Promise<DesignReview | null> {
  await query(
    `UPDATE design_reviews 
     SET status = 'REJECTED', reviewer_id = ?, reviewed_at = NOW(), comments = ?
     WHERE id = ?`,
    [reviewerId, comments, id]
  );
  return findDesignReviewById(id);
}

/**
 * Request changes for a design review
 */
export async function requestChanges(
  id: string,
  reviewerId: string,
  comments: string
): Promise<DesignReview | null> {
  await query(
    `UPDATE design_reviews 
     SET status = 'CHANGE_REQUESTED', reviewer_id = ?, reviewed_at = NOW(), comments = ?
     WHERE id = ?`,
    [reviewerId, comments, id]
  );
  return findDesignReviewById(id);
}

/**
 * Check if design is approved for a project
 */
export async function isDesignApproved(projectId: string): Promise<boolean> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM design_reviews 
     WHERE project_id = ? AND status = 'APPROVED'`,
    [projectId]
  );
  return rows[0]?.count > 0;
}

/**
 * Get design review statistics for a project
 */
export async function getDesignReviewStats(projectId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  changeRequested: number;
}> {
  const rows = await query<{ status: DesignReviewStatus; count: number }[]>(
    `SELECT status, COUNT(*) as count 
     FROM design_reviews 
     WHERE project_id = ? 
     GROUP BY status`,
    [projectId]
  );
  
  const stats = { total: 0, pending: 0, approved: 0, rejected: 0, changeRequested: 0 };
  for (const row of rows) {
    switch (row.status) {
      case 'PENDING': stats.pending = row.count; break;
      case 'APPROVED': stats.approved = row.count; break;
      case 'REJECTED': stats.rejected = row.count; break;
      case 'CHANGE_REQUESTED': stats.changeRequested = row.count; break;
    }
    stats.total += row.count;
  }
  
  return stats;
}

export default {
  findDesignReviewsByProjectId,
  findDesignReviewById,
  findDesignReviewByResourceId,
  createDesignReview,
  approveDesignReview,
  rejectDesignReview,
  requestChanges,
  isDesignApproved,
  getDesignReviewStats,
};
