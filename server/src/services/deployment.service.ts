import * as environmentRepo from '../repositories/environment.repository';
import { query } from '../config/database';
import {
  ProjectEnvironment,
  DeploymentRecord,
  DeploymentInput,
  EnvironmentType,
  DeploymentStatus,
} from '../../../shared/types';

export interface DeploymentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DeploymentResult {
  success: boolean;
  deployment?: DeploymentRecord;
  environment?: ProjectEnvironment;
  error?: string;
}

/**
 * Validate deployment input has all required fields
 */
export function validateDeploymentInput(input: DeploymentInput): DeploymentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.environmentId) {
    errors.push('Environment ID is required');
  }
  if (!input.version || input.version.trim() === '') {
    errors.push('Version is required');
  }
  if (!input.deployedBy) {
    errors.push('Deployed by (user ID) is required');
  }

  // Warnings for optional but recommended fields
  if (!input.commitHash) {
    warnings.push('Commit hash is recommended for traceability');
  }
  if (!input.notes) {
    warnings.push('Deployment notes are recommended');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}


/**
 * Check if UAT sign-off exists for a project (required for Production deployment)
 */
export async function checkUATSignoff(projectId: string): Promise<boolean> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM project_signoffs 
     WHERE project_id = ? AND signoff_type = 'UAT'`,
    [projectId]
  );
  return rows[0]?.count > 0;
}

/**
 * Check if there are any unresolved critical bugs
 */
export async function checkNoCriticalBugs(projectId: string): Promise<boolean> {
  const rows = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM bug_reports 
     WHERE project_id = ? AND severity = 'CRITICAL' AND status NOT IN ('RESOLVED', 'CLOSED', 'WONT_FIX')`,
    [projectId]
  );
  return rows[0]?.count === 0;
}

/**
 * Validate Production deployment gate
 * Production deployment requires UAT sign-off
 */
export async function validateProductionDeployment(projectId: string): Promise<DeploymentValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check UAT sign-off
  const hasUATSignoff = await checkUATSignoff(projectId);
  if (!hasUATSignoff) {
    errors.push('UAT sign-off is required before Production deployment');
  }

  // Check for critical bugs (warning, not blocking)
  const noCriticalBugs = await checkNoCriticalBugs(projectId);
  if (!noCriticalBugs) {
    warnings.push('There are unresolved critical bugs');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Deploy to an environment
 */
export async function deploy(
  projectId: string,
  input: DeploymentInput
): Promise<DeploymentResult> {
  // Validate input
  const inputValidation = validateDeploymentInput(input);
  if (!inputValidation.valid) {
    return {
      success: false,
      error: inputValidation.errors.join('; '),
    };
  }

  // Get environment
  const environment = await environmentRepo.findEnvironmentById(input.environmentId);
  if (!environment) {
    return {
      success: false,
      error: 'Environment not found',
    };
  }

  // Verify environment belongs to project
  if (environment.projectId !== projectId) {
    return {
      success: false,
      error: 'Environment does not belong to this project',
    };
  }

  // Production deployment gate
  if (environment.envType === 'PRODUCTION') {
    const prodValidation = await validateProductionDeployment(projectId);
    if (!prodValidation.valid) {
      return {
        success: false,
        error: prodValidation.errors.join('; '),
      };
    }
  }

  // Create deployment record
  try {
    const deployment = await environmentRepo.createDeployment(input);
    const updatedEnv = await environmentRepo.findEnvironmentById(input.environmentId);

    return {
      success: true,
      deployment,
      environment: updatedEnv || undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deployment',
    };
  }
}


/**
 * Rollback to a previous deployment
 */
export async function rollback(
  environmentId: string,
  deploymentId: string,
  userId: string
): Promise<DeploymentResult> {
  // Get the deployment to rollback to
  const targetDeployment = await environmentRepo.findDeploymentById(deploymentId);
  if (!targetDeployment) {
    return {
      success: false,
      error: 'Target deployment not found',
    };
  }

  // Verify deployment belongs to environment
  if (targetDeployment.environmentId !== environmentId) {
    return {
      success: false,
      error: 'Deployment does not belong to this environment',
    };
  }

  // Create a new deployment record for the rollback
  const rollbackDeployment = await environmentRepo.createDeployment({
    environmentId,
    version: targetDeployment.version,
    deployedBy: userId,
    commitHash: targetDeployment.commitHash,
    notes: `Rollback to version ${targetDeployment.version}`,
  });

  // Mark it as rollback
  await environmentRepo.updateDeploymentStatus(rollbackDeployment.id, 'ROLLBACK');

  const updatedEnv = await environmentRepo.findEnvironmentById(environmentId);

  return {
    success: true,
    deployment: { ...rollbackDeployment, status: 'ROLLBACK' as DeploymentStatus },
    environment: updatedEnv || undefined,
  };
}

/**
 * Mark a deployment as failed
 */
export async function markDeploymentFailed(deploymentId: string): Promise<DeploymentRecord | null> {
  return environmentRepo.updateDeploymentStatus(deploymentId, 'FAILED');
}

/**
 * Get deployment readiness for each environment
 */
export async function getDeploymentReadiness(projectId: string): Promise<{
  local: { ready: boolean; blockers: string[] };
  staging: { ready: boolean; blockers: string[] };
  production: { ready: boolean; blockers: string[] };
}> {
  const result = {
    local: { ready: true, blockers: [] as string[] },
    staging: { ready: true, blockers: [] as string[] },
    production: { ready: true, blockers: [] as string[] },
  };

  // Production requires UAT sign-off
  const hasUATSignoff = await checkUATSignoff(projectId);
  if (!hasUATSignoff) {
    result.production.ready = false;
    result.production.blockers.push('UAT sign-off required');
  }

  // Check for critical bugs
  const noCriticalBugs = await checkNoCriticalBugs(projectId);
  if (!noCriticalBugs) {
    result.production.blockers.push('Unresolved critical bugs exist');
  }

  return result;
}

export default {
  validateDeploymentInput,
  checkUATSignoff,
  checkNoCriticalBugs,
  validateProductionDeployment,
  deploy,
  rollback,
  markDeploymentFailed,
  getDeploymentReadiness,
};
