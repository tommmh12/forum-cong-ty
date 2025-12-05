import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { TechStackItem, TechStackCategory } from '../../../shared/types';

// Row interface for database mapping
export interface TechStackRow {
  id: string;
  project_id: string;
  category: TechStackCategory;
  name: string;
  version: string | null;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
}

function mapRowToTechStackItem(row: TechStackRow): TechStackItem {
  return {
    id: row.id,
    projectId: row.project_id,
    category: row.category,
    name: row.name,
    version: row.version || undefined,
    isLocked: Boolean(row.is_locked),
    lockedAt: row.locked_at || undefined,
    lockedBy: row.locked_by || undefined,
    createdAt: row.created_at,
  };
}

// Input type for creating tech stack item
export interface CreateTechStackInput {
  projectId: string;
  category: TechStackCategory;
  name: string;
  version?: string;
}

/**
 * Create a new tech stack item
 */
export async function createTechStackItem(input: CreateTechStackInput): Promise<TechStackItem> {
  const id = uuidv4();
  
  await query(
    `INSERT INTO project_tech_stack (id, project_id, category, name, version)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.projectId, input.category, input.name, input.version || null]
  );
  
  return {
    id,
    projectId: input.projectId,
    category: input.category,
    name: input.name,
    version: input.version,
    isLocked: false,
    createdAt: new Date().toISOString(),
  };
}


/**
 * Find all tech stack items for a project
 */
export async function findTechStackByProjectId(projectId: string): Promise<TechStackItem[]> {
  const rows = await query<TechStackRow[]>(
    'SELECT * FROM project_tech_stack WHERE project_id = ? ORDER BY category, name',
    [projectId]
  );
  return rows.map(mapRowToTechStackItem);
}

/**
 * Find a single tech stack item by ID
 */
export async function findTechStackItemById(id: string): Promise<TechStackItem | null> {
  const rows = await query<TechStackRow[]>(
    'SELECT * FROM project_tech_stack WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return mapRowToTechStackItem(rows[0]);
}

/**
 * Find tech stack items by category
 */
export async function findTechStackByCategory(
  projectId: string,
  category: TechStackCategory
): Promise<TechStackItem[]> {
  const rows = await query<TechStackRow[]>(
    'SELECT * FROM project_tech_stack WHERE project_id = ? AND category = ?',
    [projectId, category]
  );
  return rows.map(mapRowToTechStackItem);
}

/**
 * Update a tech stack item
 */
export async function updateTechStackItem(
  id: string,
  updates: { name?: string; version?: string }
): Promise<TechStackItem | null> {
  // First check if item is locked
  const item = await findTechStackItemById(id);
  if (!item) return null;
  
  if (item.isLocked) {
    throw new Error('Cannot update locked tech stack item');
  }
  
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    values.push(updates.name);
  }
  if (updates.version !== undefined) {
    setClauses.push('version = ?');
    values.push(updates.version);
  }
  
  if (setClauses.length === 0) return item;
  
  values.push(id);
  
  await query(
    `UPDATE project_tech_stack SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
  
  return findTechStackItemById(id);
}

/**
 * Delete a tech stack item
 */
export async function deleteTechStackItem(id: string): Promise<boolean> {
  // First check if item is locked
  const item = await findTechStackItemById(id);
  if (!item) return false;
  
  if (item.isLocked) {
    throw new Error('Cannot delete locked tech stack item');
  }
  
  const result = await query<any>(
    'DELETE FROM project_tech_stack WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}


/**
 * Lock a single tech stack item
 */
export async function lockTechStackItem(
  id: string,
  lockedBy: string
): Promise<TechStackItem | null> {
  const item = await findTechStackItemById(id);
  if (!item) return null;
  
  if (item.isLocked) {
    return item; // Already locked
  }
  
  await query(
    `UPDATE project_tech_stack 
     SET is_locked = TRUE, locked_at = NOW(), locked_by = ?
     WHERE id = ?`,
    [lockedBy, id]
  );
  
  return findTechStackItemById(id);
}

/**
 * Lock all tech stack items for a project
 */
export async function lockProjectTechStack(
  projectId: string,
  lockedBy: string
): Promise<TechStackItem[]> {
  await query(
    `UPDATE project_tech_stack 
     SET is_locked = TRUE, locked_at = NOW(), locked_by = ?
     WHERE project_id = ? AND is_locked = FALSE`,
    [lockedBy, projectId]
  );
  
  return findTechStackByProjectId(projectId);
}

/**
 * Unlock a single tech stack item (requires Manager approval)
 */
export async function unlockTechStackItem(id: string): Promise<TechStackItem | null> {
  const item = await findTechStackItemById(id);
  if (!item) return null;
  
  await query(
    `UPDATE project_tech_stack 
     SET is_locked = FALSE, locked_at = NULL, locked_by = NULL
     WHERE id = ?`,
    [id]
  );
  
  return findTechStackItemById(id);
}

/**
 * Unlock all tech stack items for a project (requires Manager approval)
 */
export async function unlockProjectTechStack(projectId: string): Promise<TechStackItem[]> {
  await query(
    `UPDATE project_tech_stack 
     SET is_locked = FALSE, locked_at = NULL, locked_by = NULL
     WHERE project_id = ?`,
    [projectId]
  );
  
  return findTechStackByProjectId(projectId);
}

/**
 * Check if project tech stack is locked
 */
export async function isProjectTechStackLocked(projectId: string): Promise<boolean> {
  const items = await findTechStackByProjectId(projectId);
  return items.length > 0 && items.every(item => item.isLocked);
}

/**
 * Check if any tech stack item is locked
 */
export async function hasLockedItems(projectId: string): Promise<boolean> {
  const rows = await query<TechStackRow[]>(
    'SELECT id FROM project_tech_stack WHERE project_id = ? AND is_locked = TRUE LIMIT 1',
    [projectId]
  );
  return rows.length > 0;
}

/**
 * Delete all tech stack items for a project (used when deleting project)
 */
export async function deleteTechStackByProjectId(projectId: string): Promise<boolean> {
  const result = await query<any>(
    'DELETE FROM project_tech_stack WHERE project_id = ?',
    [projectId]
  );
  return result.affectedRows > 0;
}

/**
 * Get tech stack summary for a project
 */
export async function getTechStackSummary(projectId: string): Promise<{
  total: number;
  locked: number;
  byCategory: Record<TechStackCategory, number>;
}> {
  const items = await findTechStackByProjectId(projectId);
  
  const byCategory: Record<TechStackCategory, number> = {
    LANGUAGE: 0,
    FRAMEWORK: 0,
    DATABASE: 0,
    HOSTING: 0,
    OTHER: 0,
  };
  
  items.forEach(item => {
    byCategory[item.category]++;
  });
  
  return {
    total: items.length,
    locked: items.filter(item => item.isLocked).length,
    byCategory,
  };
}

export default {
  createTechStackItem,
  findTechStackByProjectId,
  findTechStackItemById,
  findTechStackByCategory,
  updateTechStackItem,
  deleteTechStackItem,
  lockTechStackItem,
  lockProjectTechStack,
  unlockTechStackItem,
  unlockProjectTechStack,
  isProjectTechStackLocked,
  hasLockedItems,
  deleteTechStackByProjectId,
  getTechStackSummary,
};
