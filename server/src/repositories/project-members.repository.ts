import { query } from '../config/database';
import { ProjectMember } from '../../../shared/types';

export interface ProjectMemberRow {
  project_id: string;
  user_id: string;
  role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER';
  created_at: string;
}

export interface ProjectMemberWithUser extends ProjectMember {
  userId: string;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  userPosition?: string;
  userDepartment?: string;
}

function mapRowToProjectMember(row: ProjectMemberRow): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role,
  };
}

/**
 * Find all members of a project with user details
 */
export async function findMembersByProjectId(projectId: string): Promise<ProjectMemberWithUser[]> {
  try {
    const rows = await query<ProjectMemberRow[]>(
      `SELECT pm.*, u.full_name, u.avatar_url, u.email, u.position, u.department
       FROM project_members pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?
       ORDER BY 
         CASE pm.role
           WHEN 'MANAGER' THEN 1
           WHEN 'LEADER' THEN 2
           WHEN 'MEMBER' THEN 3
           WHEN 'VIEWER' THEN 4
         END,
         u.full_name`,
      [projectId]
    );
    
    if (!rows || rows.length === 0) {
      return [];
    }
    
    return rows.map(row => ({
      projectId: row.project_id,
      userId: row.user_id,
      role: row.role,
      userName: (row as any).full_name || undefined,
      userAvatar: (row as any).avatar_url || undefined,
      userEmail: (row as any).email || undefined,
      userPosition: (row as any).position || undefined,
      userDepartment: (row as any).department || undefined,
    }));
  } catch (error) {
    console.error('Error in findMembersByProjectId:', error);
    throw error;
  }
}

/**
 * Find a specific project member
 */
export async function findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
  const rows = await query<ProjectMemberRow[]>(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  
  if (rows.length === 0) return null;
  return mapRowToProjectMember(rows[0]);
}

/**
 * Add a member to a project
 */
export async function addMember(
  projectId: string,
  userId: string,
  role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER' = 'MEMBER'
): Promise<ProjectMember> {
  // Check if member already exists
  const existing = await findMember(projectId, userId);
  if (existing) {
    throw new Error('User is already a member of this project');
  }
  
  await query(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
    [projectId, userId, role]
  );
  
  const member = await findMember(projectId, userId);
  if (!member) throw new Error('Failed to create project member');
  return member;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER'
): Promise<boolean> {
  const result = await query<any>(
    'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
    [role, projectId, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Remove a member from a project
 */
export async function removeMember(projectId: string, userId: string): Promise<boolean> {
  const result = await query<any>(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Check if user is a member of the project
 */
export async function isMember(projectId: string, userId: string): Promise<boolean> {
  try {
    const member = await findMember(projectId, userId);
    return member !== null;
  } catch (error) {
    // If table doesn't exist, return false
    console.error('Error in isMember:', error);
    throw error; // Re-throw to let caller handle
  }
}

/**
 * Get member count for a project
 */
export async function getMemberCount(projectId: string): Promise<number> {
  const rows = await query<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM project_members WHERE project_id = ?',
    [projectId]
  );
  return rows[0]?.count || 0;
}

export default {
  findMembersByProjectId,
  findMember,
  addMember,
  updateMemberRole,
  removeMember,
  isMember,
  getMemberCount,
};

