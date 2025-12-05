import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ProjectPhase, PhaseType, PhaseStatus, PHASE_ORDER } from '../../../shared/types';

// Row interface for database mapping
export interface PhaseRow {
  id: string;
  project_id: string;
  phase_type: PhaseType;
  position: number;
  status: PhaseStatus;
  started_at: string | null;
  completed_at: string | null;
  blocked_reason: string | null;
  created_at: string;
}

function mapRowToPhase(row: PhaseRow): ProjectPhase {
  return {
    id: row.id,
    projectId: row.project_id,
    phaseType: row.phase_type,
    position: row.position,
    status: row.status,
    startedAt: row.started_at || undefined,
    completedAt: row.completed_at || undefined,
    blockedReason: row.blocked_reason || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Initialize all 6 phases for a new project
 */
export async function initializePhases(projectId: string): Promise<ProjectPhase[]> {
  const phases: ProjectPhase[] = [];
  
  for (let i = 0; i < PHASE_ORDER.length; i++) {
    const id = uuidv4();
    const phaseType = PHASE_ORDER[i];
    const status: PhaseStatus = i === 0 ? 'IN_PROGRESS' : 'PENDING';
    const startedAt = i === 0 ? new Date().toISOString() : null;
    
    await query(
      `INSERT INTO project_phases (id, project_id, phase_type, position, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, phaseType, i, status, startedAt]
    );
    
    phases.push({
      id,
      projectId,
      phaseType,
      position: i,
      status,
      startedAt: startedAt || undefined,
      createdAt: new Date().toISOString(),
    });
  }
  
  return phases;
}


/**
 * Find all phases for a project
 */
export async function findPhasesByProjectId(projectId: string): Promise<ProjectPhase[]> {
  const rows = await query<PhaseRow[]>(
    'SELECT * FROM project_phases WHERE project_id = ? ORDER BY position',
    [projectId]
  );
  return rows.map(mapRowToPhase);
}

/**
 * Find a single phase by ID
 */
export async function findPhaseById(id: string): Promise<ProjectPhase | null> {
  const rows = await query<PhaseRow[]>(
    'SELECT * FROM project_phases WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return mapRowToPhase(rows[0]);
}

/**
 * Find current active phase for a project
 */
export async function findCurrentPhase(projectId: string): Promise<ProjectPhase | null> {
  const rows = await query<PhaseRow[]>(
    `SELECT * FROM project_phases 
     WHERE project_id = ? AND status = 'IN_PROGRESS'
     ORDER BY position LIMIT 1`,
    [projectId]
  );
  if (rows.length === 0) return null;
  return mapRowToPhase(rows[0]);
}

/**
 * Find phase by type for a project
 */
export async function findPhaseByType(
  projectId: string, 
  phaseType: PhaseType
): Promise<ProjectPhase | null> {
  const rows = await query<PhaseRow[]>(
    'SELECT * FROM project_phases WHERE project_id = ? AND phase_type = ?',
    [projectId, phaseType]
  );
  if (rows.length === 0) return null;
  return mapRowToPhase(rows[0]);
}

/**
 * Update phase status
 */
export async function updatePhaseStatus(
  id: string,
  status: PhaseStatus,
  blockedReason?: string
): Promise<ProjectPhase | null> {
  const updates: string[] = ['status = ?'];
  const values: any[] = [status];
  
  if (status === 'IN_PROGRESS') {
    updates.push('started_at = NOW()');
  } else if (status === 'COMPLETED') {
    updates.push('completed_at = NOW()');
  }
  
  if (status === 'BLOCKED' && blockedReason) {
    updates.push('blocked_reason = ?');
    values.push(blockedReason);
  } else if (status !== 'BLOCKED') {
    updates.push('blocked_reason = NULL');
  }
  
  values.push(id);
  
  await query(
    `UPDATE project_phases SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return findPhaseById(id);
}

/**
 * Complete current phase and start next
 */
export async function transitionToNextPhase(projectId: string): Promise<{
  completed: ProjectPhase | null;
  started: ProjectPhase | null;
} | null> {
  const phases = await findPhasesByProjectId(projectId);
  const currentPhase = phases.find(p => p.status === 'IN_PROGRESS');
  
  if (!currentPhase) return null;
  
  const currentIndex = PHASE_ORDER.indexOf(currentPhase.phaseType);
  if (currentIndex === PHASE_ORDER.length - 1) {
    // Already at last phase
    return null;
  }
  
  const nextPhase = phases.find(p => p.position === currentIndex + 1);
  if (!nextPhase) return null;
  
  // Complete current phase
  const completed = await updatePhaseStatus(currentPhase.id, 'COMPLETED');
  
  // Start next phase
  const started = await updatePhaseStatus(nextPhase.id, 'IN_PROGRESS');
  
  return { completed, started };
}


/**
 * Get phase progress summary
 */
export async function getPhaseProgress(projectId: string): Promise<{
  total: number;
  completed: number;
  current: PhaseType | null;
  percent: number;
}> {
  const phases = await findPhasesByProjectId(projectId);
  const completed = phases.filter(p => p.status === 'COMPLETED').length;
  const current = phases.find(p => p.status === 'IN_PROGRESS');
  
  return {
    total: phases.length,
    completed,
    current: current?.phaseType || null,
    percent: Math.round((completed / phases.length) * 100),
  };
}

/**
 * Check if a specific phase is completed
 */
export async function isPhaseCompleted(
  projectId: string, 
  phaseType: PhaseType
): Promise<boolean> {
  const phase = await findPhaseByType(projectId, phaseType);
  return phase?.status === 'COMPLETED';
}

/**
 * Block a phase with reason
 */
export async function blockPhase(
  id: string, 
  reason: string
): Promise<ProjectPhase | null> {
  return updatePhaseStatus(id, 'BLOCKED', reason);
}

/**
 * Unblock a phase
 */
export async function unblockPhase(id: string): Promise<ProjectPhase | null> {
  return updatePhaseStatus(id, 'IN_PROGRESS');
}

/**
 * Delete all phases for a project (used when deleting project)
 */
export async function deletePhasesByProjectId(projectId: string): Promise<boolean> {
  const result = await query<any>(
    'DELETE FROM project_phases WHERE project_id = ?',
    [projectId]
  );
  return result.affectedRows > 0;
}

export default {
  initializePhases,
  findPhasesByProjectId,
  findPhaseById,
  findCurrentPhase,
  findPhaseByType,
  updatePhaseStatus,
  transitionToNextPhase,
  getPhaseProgress,
  isPhaseCompleted,
  blockPhase,
  unblockPhase,
  deletePhasesByProjectId,
};
