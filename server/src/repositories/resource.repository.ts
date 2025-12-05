import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  ProjectResource,
  ResourceType,
  ResourceStatus,
  CreateResourceInput,
} from '../../../shared/types';

// Row interface for database mapping
export interface ResourceRow {
  id: string;
  project_id: string;
  type: ResourceType;
  name: string;
  file_path: string | null;
  url: string | null;
  version: number;
  status: ResourceStatus;
  approved_by: string | null;
  approved_at: string | null;
  encrypted_data: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToResource(row: ResourceRow): ProjectResource {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    name: row.name,
    filePath: row.file_path || undefined,
    url: row.url || undefined,
    version: row.version,
    status: row.status,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    encryptedData: row.encrypted_data || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

/**
 * Find all resources for a project
 */
export async function findResourcesByProjectId(projectId: string): Promise<ProjectResource[]> {
  const rows = await query<ResourceRow[]>(
    'SELECT * FROM project_resources WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return rows.map(mapRowToResource);
}


/**
 * Find resources by type for a project
 */
export async function findResourcesByType(
  projectId: string,
  type: ResourceType
): Promise<ProjectResource[]> {
  const rows = await query<ResourceRow[]>(
    'SELECT * FROM project_resources WHERE project_id = ? AND type = ? ORDER BY version DESC',
    [projectId, type]
  );
  return rows.map(mapRowToResource);
}

/**
 * Find a single resource by ID
 */
export async function findResourceById(id: string): Promise<ProjectResource | null> {
  const rows = await query<ResourceRow[]>(
    'SELECT * FROM project_resources WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return mapRowToResource(rows[0]);
}

/**
 * Create a new resource
 */
export async function createResource(input: CreateResourceInput): Promise<ProjectResource> {
  const id = uuidv4();
  
  await query(
    `INSERT INTO project_resources (id, project_id, type, name, file_path, url, encrypted_data, version, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'PENDING')`,
    [id, input.projectId, input.type, input.name, input.filePath || null, input.url || null, input.encryptedData || null]
  );
  
  const resource = await findResourceById(id);
  if (!resource) throw new Error('Failed to create resource');
  return resource;
}

/**
 * Update a resource
 */
export async function updateResource(
  id: string,
  updates: Partial<Pick<ProjectResource, 'name' | 'filePath' | 'url' | 'encryptedData'>>
): Promise<ProjectResource | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.filePath !== undefined) {
    setClauses.push('file_path = ?');
    values.push(updates.filePath);
  }
  if (updates.url !== undefined) {
    setClauses.push('url = ?');
    values.push(updates.url);
  }
  if (updates.encryptedData !== undefined) {
    setClauses.push('encrypted_data = ?');
    values.push(updates.encryptedData);
  }
  
  if (setClauses.length === 0) return findResourceById(id);
  
  values.push(id);
  await query(
    `UPDATE project_resources SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
  
  return findResourceById(id);
}


/**
 * Increment version and create new version of resource
 */
export async function createNewVersion(
  id: string,
  updates: { filePath?: string; url?: string; encryptedData?: string }
): Promise<ProjectResource | null> {
  // Get current resource
  const current = await findResourceById(id);
  if (!current) return null;
  
  // Increment version and update
  await query(
    `UPDATE project_resources 
     SET version = version + 1, 
         file_path = COALESCE(?, file_path),
         url = COALESCE(?, url),
         encrypted_data = COALESCE(?, encrypted_data),
         status = 'PENDING',
         approved_by = NULL,
         approved_at = NULL
     WHERE id = ?`,
    [updates.filePath || null, updates.url || null, updates.encryptedData || null, id]
  );
  
  return findResourceById(id);
}

/**
 * Approve a resource
 */
export async function approveResource(
  id: string,
  approverId: string
): Promise<ProjectResource | null> {
  await query(
    `UPDATE project_resources 
     SET status = 'APPROVED', approved_by = ?, approved_at = NOW()
     WHERE id = ?`,
    [approverId, id]
  );
  return findResourceById(id);
}

/**
 * Reject a resource
 */
export async function rejectResource(id: string): Promise<ProjectResource | null> {
  await query(
    `UPDATE project_resources SET status = 'REJECTED' WHERE id = ?`,
    [id]
  );
  return findResourceById(id);
}

/**
 * Delete a resource
 */
export async function deleteResource(id: string): Promise<boolean> {
  const result = await query<any>(
    'DELETE FROM project_resources WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Check if all required resources exist for a project
 */
export async function checkRequiredResources(
  projectId: string,
  requiredTypes: ResourceType[]
): Promise<{ complete: boolean; missing: ResourceType[] }> {
  const resources = await findResourcesByProjectId(projectId);
  const approvedTypes = new Set(
    resources.filter(r => r.status === 'APPROVED').map(r => r.type)
  );
  
  const missing = requiredTypes.filter(type => !approvedTypes.has(type));
  
  return {
    complete: missing.length === 0,
    missing,
  };
}

/**
 * Get resource statistics for a project
 */
export async function getResourceStats(projectId: string): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const rows = await query<{ status: ResourceStatus; count: number }[]>(
    `SELECT status, COUNT(*) as count 
     FROM project_resources 
     WHERE project_id = ? 
     GROUP BY status`,
    [projectId]
  );
  
  const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) {
    stats[row.status.toLowerCase() as 'pending' | 'approved' | 'rejected'] = row.count;
    stats.total += row.count;
  }
  
  return stats;
}

export default {
  findResourcesByProjectId,
  findResourcesByType,
  findResourceById,
  createResource,
  updateResource,
  createNewVersion,
  approveResource,
  rejectResource,
  deleteResource,
  checkRequiredResources,
  getResourceStats,
};
