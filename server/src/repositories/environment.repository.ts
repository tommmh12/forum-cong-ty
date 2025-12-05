import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
  ProjectEnvironment,
  DeploymentRecord,
  EnvironmentType,
  DeploymentStatus,
  DeploymentInput,
} from '../../../shared/types';

// Row interfaces for database mapping
interface EnvironmentRow {
  id: string;
  project_id: string;
  env_type: EnvironmentType;
  url: string | null;
  current_version: string | null;
  last_deployed_at: string | null;
  last_deployed_by: string | null;
  ssl_enabled: number;
  created_at: string;
}

interface DeploymentRow {
  id: string;
  environment_id: string;
  version: string;
  deployed_by: string;
  deployed_at: string;
  commit_hash: string | null;
  notes: string | null;
  status: DeploymentStatus;
}

function mapRowToEnvironment(row: EnvironmentRow): ProjectEnvironment {
  return {
    id: row.id,
    projectId: row.project_id,
    envType: row.env_type,
    url: row.url || undefined,
    currentVersion: row.current_version || undefined,
    lastDeployedAt: row.last_deployed_at || undefined,
    lastDeployedBy: row.last_deployed_by || undefined,
    sslEnabled: Boolean(row.ssl_enabled),
    createdAt: row.created_at,
  };
}

function mapRowToDeployment(row: DeploymentRow): DeploymentRecord {
  return {
    id: row.id,
    environmentId: row.environment_id,
    version: row.version,
    deployedBy: row.deployed_by,
    deployedAt: row.deployed_at,
    commitHash: row.commit_hash || undefined,
    notes: row.notes || undefined,
    status: row.status,
  };
}


/**
 * Find all environments for a project
 */
export async function findEnvironmentsByProjectId(projectId: string): Promise<ProjectEnvironment[]> {
  const rows = await query<EnvironmentRow[]>(
    'SELECT * FROM project_environments WHERE project_id = ? ORDER BY FIELD(env_type, "LOCAL", "STAGING", "PRODUCTION")',
    [projectId]
  );
  
  const environments = rows.map(mapRowToEnvironment);
  
  // Load deployment history for each environment
  for (const env of environments) {
    env.deploymentHistory = await findDeploymentsByEnvironmentId(env.id);
  }
  
  return environments;
}

/**
 * Find a single environment by ID
 */
export async function findEnvironmentById(id: string): Promise<ProjectEnvironment | null> {
  const rows = await query<EnvironmentRow[]>(
    'SELECT * FROM project_environments WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  
  const env = mapRowToEnvironment(rows[0]);
  env.deploymentHistory = await findDeploymentsByEnvironmentId(id);
  return env;
}

/**
 * Find environment by project and type
 */
export async function findEnvironmentByType(
  projectId: string,
  envType: EnvironmentType
): Promise<ProjectEnvironment | null> {
  const rows = await query<EnvironmentRow[]>(
    'SELECT * FROM project_environments WHERE project_id = ? AND env_type = ?',
    [projectId, envType]
  );
  if (rows.length === 0) return null;
  
  const env = mapRowToEnvironment(rows[0]);
  env.deploymentHistory = await findDeploymentsByEnvironmentId(env.id);
  return env;
}

/**
 * Initialize environments for a new project
 */
export async function initializeEnvironments(projectId: string): Promise<ProjectEnvironment[]> {
  const envTypes: EnvironmentType[] = ['LOCAL', 'STAGING', 'PRODUCTION'];
  
  for (const envType of envTypes) {
    const id = uuidv4();
    await query(
      'INSERT INTO project_environments (id, project_id, env_type) VALUES (?, ?, ?)',
      [id, projectId, envType]
    );
  }
  
  return findEnvironmentsByProjectId(projectId);
}

/**
 * Update environment settings
 */
export async function updateEnvironment(
  id: string,
  updates: Partial<Pick<ProjectEnvironment, 'url' | 'sslEnabled'>>
): Promise<ProjectEnvironment | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  
  if (updates.url !== undefined) {
    setClauses.push('url = ?');
    values.push(updates.url);
  }
  if (updates.sslEnabled !== undefined) {
    setClauses.push('ssl_enabled = ?');
    values.push(updates.sslEnabled ? 1 : 0);
  }
  
  if (setClauses.length === 0) return findEnvironmentById(id);
  
  values.push(id);
  await query(
    `UPDATE project_environments SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
  
  return findEnvironmentById(id);
}


/**
 * Find all deployments for an environment
 */
export async function findDeploymentsByEnvironmentId(environmentId: string): Promise<DeploymentRecord[]> {
  const rows = await query<DeploymentRow[]>(
    'SELECT * FROM deployment_history WHERE environment_id = ? ORDER BY deployed_at DESC',
    [environmentId]
  );
  return rows.map(mapRowToDeployment);
}

/**
 * Find a single deployment by ID
 */
export async function findDeploymentById(id: string): Promise<DeploymentRecord | null> {
  const rows = await query<DeploymentRow[]>(
    'SELECT * FROM deployment_history WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  return mapRowToDeployment(rows[0]);
}

/**
 * Create a new deployment record
 */
export async function createDeployment(input: DeploymentInput): Promise<DeploymentRecord> {
  const id = uuidv4();
  
  await query(
    `INSERT INTO deployment_history (id, environment_id, version, deployed_by, commit_hash, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS')`,
    [id, input.environmentId, input.version, input.deployedBy, input.commitHash || null, input.notes || null]
  );
  
  // Update environment with latest deployment info
  await query(
    `UPDATE project_environments 
     SET current_version = ?, last_deployed_at = NOW(), last_deployed_by = ?
     WHERE id = ?`,
    [input.version, input.deployedBy, input.environmentId]
  );
  
  const deployment = await findDeploymentById(id);
  if (!deployment) throw new Error('Failed to create deployment');
  return deployment;
}

/**
 * Update deployment status (for rollback or failure)
 */
export async function updateDeploymentStatus(
  id: string,
  status: DeploymentStatus
): Promise<DeploymentRecord | null> {
  await query(
    'UPDATE deployment_history SET status = ? WHERE id = ?',
    [status, id]
  );
  return findDeploymentById(id);
}

/**
 * Get latest deployment for an environment
 */
export async function getLatestDeployment(environmentId: string): Promise<DeploymentRecord | null> {
  const rows = await query<DeploymentRow[]>(
    'SELECT * FROM deployment_history WHERE environment_id = ? ORDER BY deployed_at DESC LIMIT 1',
    [environmentId]
  );
  if (rows.length === 0) return null;
  return mapRowToDeployment(rows[0]);
}

/**
 * Get deployment statistics for a project
 */
export async function getDeploymentStats(projectId: string): Promise<{
  total: number;
  success: number;
  failed: number;
  rollback: number;
}> {
  const rows = await query<{ status: DeploymentStatus; count: number }[]>(
    `SELECT dh.status, COUNT(*) as count 
     FROM deployment_history dh
     JOIN project_environments pe ON dh.environment_id = pe.id
     WHERE pe.project_id = ?
     GROUP BY dh.status`,
    [projectId]
  );
  
  const stats = { total: 0, success: 0, failed: 0, rollback: 0 };
  for (const row of rows) {
    const key = row.status.toLowerCase() as 'success' | 'failed' | 'rollback';
    stats[key] = row.count;
    stats.total += row.count;
  }
  
  return stats;
}

export default {
  findEnvironmentsByProjectId,
  findEnvironmentById,
  findEnvironmentByType,
  initializeEnvironments,
  updateEnvironment,
  findDeploymentsByEnvironmentId,
  findDeploymentById,
  createDeployment,
  updateDeploymentStatus,
  getLatestDeployment,
  getDeploymentStats,
};
