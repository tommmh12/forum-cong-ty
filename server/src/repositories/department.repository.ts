import { query } from '../config/database';
import { Department } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface DepartmentRow {
  id: string;
  code: string;
  name: string;
  manager_name: string;
  manager_avatar: string;
  member_count: number;
  description: string;
  budget: string;
  kpi_status: string;
  parent_dept_id: string | null;
}

export interface CreateDepartmentInput {
  code: string;
  name: string;
  managerName: string;
  managerAvatar?: string;
  description?: string;
  kpiStatus?: string;
  parentDeptId?: string;
}

export interface UpdateDepartmentInput {
  code?: string;
  name?: string;
  managerName?: string;
  managerAvatar?: string;
  description?: string;
  kpiStatus?: string;
  parentDeptId?: string | null;
}

function mapRowToDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    managerName: row.manager_name,
    managerAvatar: row.manager_avatar,
    memberCount: row.member_count,
    description: row.description,
    budget: row.budget,
    kpiStatus: row.kpi_status,
    parentDeptId: row.parent_dept_id || undefined,
  };
}

export async function findAllDepartments(): Promise<Department[]> {
  const rows = await query<DepartmentRow[]>('SELECT * FROM departments ORDER BY name');
  return rows.map(mapRowToDepartment);
}

export async function findDepartmentById(id: string): Promise<Department | null> {
  const rows = await query<DepartmentRow[]>('SELECT * FROM departments WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRowToDepartment(rows[0]);
}

export async function findChildDepartments(parentId: string): Promise<Department[]> {
  const rows = await query<DepartmentRow[]>(
    'SELECT * FROM departments WHERE parent_dept_id = ?',
    [parentId]
  );
  return rows.map(mapRowToDepartment);
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const id = uuidv4();
  const defaultAvatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=100&h=100';
  
  await query(
    `INSERT INTO departments (id, code, name, manager_name, manager_avatar, member_count, description, budget, kpi_status, parent_dept_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.code,
      input.name,
      input.managerName,
      input.managerAvatar || defaultAvatar,
      0,
      input.description || '',
      '---',
      input.kpiStatus || 'On Track',
      input.parentDeptId || null,
    ]
  );
  
  const created = await findDepartmentById(id);
  if (!created) throw new Error('Failed to create department');
  return created;
}

export async function updateDepartment(id: string, input: UpdateDepartmentInput): Promise<Department | null> {
  const existing = await findDepartmentById(id);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.code !== undefined) {
    updates.push('code = ?');
    values.push(input.code);
  }
  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.managerName !== undefined) {
    updates.push('manager_name = ?');
    values.push(input.managerName);
  }
  if (input.managerAvatar !== undefined) {
    updates.push('manager_avatar = ?');
    values.push(input.managerAvatar);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }
  if (input.kpiStatus !== undefined) {
    updates.push('kpi_status = ?');
    values.push(input.kpiStatus);
  }
  if (input.parentDeptId !== undefined) {
    updates.push('parent_dept_id = ?');
    values.push(input.parentDeptId);
  }

  if (updates.length === 0) return existing;

  values.push(id);
  await query(`UPDATE departments SET ${updates.join(', ')} WHERE id = ?`, values);
  
  return findDepartmentById(id);
}

export async function deleteDepartment(id: string): Promise<boolean> {
  const existing = await findDepartmentById(id);
  if (!existing) return false;

  // Update child departments to remove parent reference
  await query('UPDATE departments SET parent_dept_id = NULL WHERE parent_dept_id = ?', [id]);
  
  await query('DELETE FROM departments WHERE id = ?', [id]);
  return true;
}

export default { 
  findAllDepartments, 
  findDepartmentById, 
  findChildDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
