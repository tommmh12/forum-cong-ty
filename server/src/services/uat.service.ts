import * as uatRepo from '../repositories/uat.repository';
import {
  UATFeedback,
  ProjectSignoff,
  CreateUATFeedbackInput,
  CreateSignoffInput,
  SignoffType,
} from '../../../shared/types';

export interface SignoffValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate signoff input
 */
export function validateSignoffInput(input: CreateSignoffInput): SignoffValidationResult {
  const errors: string[] = [];
  
  if (!input.projectId) errors.push('Project ID is required');
  if (!input.signoffType) errors.push('Signoff type is required');
  if (!input.approverName || input.approverName.trim() === '') errors.push('Approver name is required');
  
  return { valid: errors.length === 0, errors };
}

/**
 * Check if UAT sign-off can be created
 * All feedback must be addressed first
 */
export async function canCreateUATSignoff(projectId: string): Promise<{
  canSignoff: boolean;
  reason?: string;
  pendingFeedbackCount: number;
}> {
  const pendingCount = await uatRepo.getPendingFeedbackCount(projectId);
  
  if (pendingCount > 0) {
    return {
      canSignoff: false,
      reason: `${pendingCount} feedback item(s) still pending`,
      pendingFeedbackCount: pendingCount,
    };
  }
  
  return { canSignoff: true, pendingFeedbackCount: 0 };
}

/**
 * Create UAT sign-off with validation
 */
export async function createUATSignoff(input: CreateSignoffInput): Promise<{
  success: boolean;
  signoff?: ProjectSignoff;
  error?: string;
}> {
  // Validate input
  const validation = validateSignoffInput(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('; ') };
  }
  
  // Check if can sign off
  const canSignoff = await canCreateUATSignoff(input.projectId);
  if (!canSignoff.canSignoff) {
    return { success: false, error: canSignoff.reason };
  }
  
  // Check if already signed off
  const existingSignoff = await uatRepo.hasSignoff(input.projectId, 'UAT');
  if (existingSignoff) {
    return { success: false, error: 'UAT sign-off already exists' };
  }
  
  const signoff = await uatRepo.createSignoff({ ...input, signoffType: 'UAT' });
  return { success: true, signoff };
}

/**
 * Create any type of sign-off
 */
export async function createSignoff(input: CreateSignoffInput): Promise<{
  success: boolean;
  signoff?: ProjectSignoff;
  error?: string;
}> {
  const validation = validateSignoffInput(input);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('; ') };
  }
  
  // For UAT signoff, check feedback completion
  if (input.signoffType === 'UAT') {
    return createUATSignoff(input);
  }
  
  const signoff = await uatRepo.createSignoff(input);
  return { success: true, signoff };
}

/**
 * Get UAT status summary
 */
export async function getUATStatus(projectId: string): Promise<{
  totalFeedback: number;
  pendingFeedback: number;
  addressedFeedback: number;
  hasUATSignoff: boolean;
  canSignoff: boolean;
}> {
  const feedback = await uatRepo.findUATFeedbackByProjectId(projectId);
  const pendingCount = feedback.filter(f => f.status === 'PENDING').length;
  const addressedCount = feedback.filter(f => f.status === 'ADDRESSED').length;
  const hasSignoff = await uatRepo.hasSignoff(projectId, 'UAT');
  
  return {
    totalFeedback: feedback.length,
    pendingFeedback: pendingCount,
    addressedFeedback: addressedCount,
    hasUATSignoff: hasSignoff,
    canSignoff: pendingCount === 0 && !hasSignoff,
  };
}

export default {
  validateSignoffInput,
  canCreateUATSignoff,
  createUATSignoff,
  createSignoff,
  getUATStatus,
};
