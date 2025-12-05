import * as bugReportRepo from '../repositories/bug-report.repository';
import {
  BugReport,
  CreateBugReportInput,
  BugSeverity,
} from '../../../shared/types';

export interface BugReportValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate bug report has all required fields
 */
export function validateBugReport(input: CreateBugReportInput): BugReportValidationResult {
  const errors: string[] = [];

  if (!input.projectId) errors.push('Project ID is required');
  if (!input.title || input.title.trim() === '') errors.push('Title is required');
  if (!input.severity) errors.push('Severity is required');
  if (!input.environment) errors.push('Environment is required');
  if (!input.reproductionSteps || input.reproductionSteps.trim() === '') {
    errors.push('Reproduction steps are required');
  }
  if (!input.reportedBy) errors.push('Reporter ID is required');

  return { valid: errors.length === 0, errors };
}

/**
 * Create a bug report with validation
 */
export async function createBugReport(input: CreateBugReportInput): Promise<{
  success: boolean;
  bug?: BugReport;
  errors?: string[];
}> {
  const validation = validateBugReport(input);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const bug = await bugReportRepo.createBugReport(input);
  return { success: true, bug };
}

/**
 * Check if there are critical bugs blocking phase transition
 */
export async function checkCriticalBugsForPhaseTransition(projectId: string): Promise<{
  canTransition: boolean;
  criticalBugs: BugReport[];
  message?: string;
}> {
  const criticalBugs = await bugReportRepo.findCriticalBugs(projectId);
  
  if (criticalBugs.length > 0) {
    return {
      canTransition: false,
      criticalBugs,
      message: `Cannot transition phase: ${criticalBugs.length} unresolved critical bug(s)`,
    };
  }
  
  return { canTransition: true, criticalBugs: [] };
}

/**
 * Get test statistics for a project
 */
export async function getTestStatistics(projectId: string): Promise<{
  bugs: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    critical: number;
    high: number;
  };
  resolutionRate: number;
  criticalBugCount: number;
}> {
  const bugStats = await bugReportRepo.getBugStats(projectId);
  
  const resolutionRate = bugStats.total > 0 
    ? Math.round((bugStats.resolved / bugStats.total) * 100) 
    : 0;
  
  return {
    bugs: bugStats,
    resolutionRate,
    criticalBugCount: bugStats.critical,
  };
}

export default {
  validateBugReport,
  createBugReport,
  checkCriticalBugsForPhaseTransition,
  getTestStatistics,
};
