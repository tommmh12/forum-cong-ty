import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  steps: string; // JSON string
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

function mapRowToWorkflow(row: WorkflowRow): Workflow {
  let steps: string[] = [];
  try {
    steps = JSON.parse(row.steps);
  } catch {
    // If parsing fails, treat as comma-separated or single value
    steps = row.steps.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    steps,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

/**
 * Find all workflows
 */
export async function findAllWorkflows(): Promise<Workflow[]> {
  const rows = await query<WorkflowRow[]>('SELECT * FROM workflows ORDER BY is_default DESC, name');
  return rows.map(mapRowToWorkflow);
}

/**
 * Find workflow by ID
 */
export async function findWorkflowById(id: string): Promise<Workflow | null> {
  const rows = await query<WorkflowRow[]>('SELECT * FROM workflows WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRowToWorkflow(rows[0]);
}

/**
 * Find default workflow
 */
export async function findDefaultWorkflow(): Promise<Workflow | null> {
  const rows = await query<WorkflowRow[]>('SELECT * FROM workflows WHERE is_default = TRUE LIMIT 1');
  if (rows.length === 0) return null;
  return mapRowToWorkflow(rows[0]);
}

/**
 * Create a new workflow
 */
export async function createWorkflow(data: {
  name: string;
  description?: string;
  steps: string[];
  isDefault?: boolean;
}): Promise<Workflow> {
  const id = uuidv4();
  
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await query('UPDATE workflows SET is_default = FALSE WHERE is_default = TRUE');
  }
  
  await query(
    'INSERT INTO workflows (id, name, description, steps, is_default) VALUES (?, ?, ?, ?, ?)',
    [
      id,
      data.name,
      data.description || null,
      JSON.stringify(data.steps),
      data.isDefault || false,
    ]
  );
  
  const workflow = await findWorkflowById(id);
  if (!workflow) throw new Error('Failed to create workflow');
  return workflow;
}

/**
 * Update a workflow
 */
export async function updateWorkflow(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    steps: string[];
    isDefault: boolean;
  }>
): Promise<Workflow | null> {
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.steps !== undefined) {
    updates.push('steps = ?');
    params.push(JSON.stringify(data.steps));
  }
  if (data.isDefault !== undefined) {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await query('UPDATE workflows SET is_default = FALSE WHERE is_default = TRUE AND id != ?', [id]);
    }
    updates.push('is_default = ?');
    params.push(data.isDefault);
  }
  
  if (updates.length === 0) return findWorkflowById(id);
  
  params.push(id);
  await query(`UPDATE workflows SET ${updates.join(', ')} WHERE id = ?`, params);
  
  return findWorkflowById(id);
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  const result = await query<any>('DELETE FROM workflows WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Initialize default workflows
 */
export async function initializeDefaultWorkflows(): Promise<void> {
  const existing = await findAllWorkflows();
  if (existing.length > 0) return; // Already initialized
  
  const defaultWorkflows = [
    {
      name: 'Quy trình Tiêu chuẩn (Standard)',
      description: 'Quy trình đơn giản cho các phòng ban hành chính.',
      steps: ['To Do', 'In Progress', 'Done'],
      isDefault: true,
    },
    {
      name: 'Quy trình Phát triển (Software Dev)',
      description: 'Quy trình đầy đủ cho đội kỹ thuật (Engineering).',
      steps: ['Backlog', 'To Do', 'Coding', 'Code Review', 'Testing', 'Done'],
      isDefault: false,
    },
  ];
  
  for (const workflow of defaultWorkflows) {
    await createWorkflow(workflow);
  }
}

export default {
  findAllWorkflows,
  findWorkflowById,
  findDefaultWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  initializeDefaultWorkflows,
};

