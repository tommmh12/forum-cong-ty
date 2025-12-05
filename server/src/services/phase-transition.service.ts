import { 
  PhaseType, 
  PHASE_ORDER, 
  PHASE_REQUIREMENTS,
  ProjectPhase 
} from '../../../shared/types';
import * as phaseRepo from '../repositories/phase.repository';
import * as resourceRepo from '../repositories/resource.repository';
import * as techStackRepo from '../repositories/tech-stack.repository';
import * as environmentRepo from '../repositories/environment.repository';
import * as projectRepo from '../repositories/project.repository';
import * as bugReportRepo from '../repositories/bug-report.repository';

/**
 * Phase Transition Service
 * Handles validation and execution of phase transitions
 */

export interface TransitionValidation {
  canTransition: boolean;
  missingRequirements: string[];
  currentPhase: PhaseType;
  nextPhase: PhaseType | null;
}

export interface PhaseRequirementCheck {
  requirement: string;
  satisfied: boolean;
  details?: string;
}

/**
 * Get the next phase in sequence
 */
export function getNextPhase(currentPhase: PhaseType): PhaseType | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex === PHASE_ORDER.length - 1) {
    return null;
  }
  return PHASE_ORDER[currentIndex + 1];
}

/**
 * Get the previous phase in sequence
 */
export function getPreviousPhase(currentPhase: PhaseType): PhaseType | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  if (currentIndex <= 0) {
    return null;
  }
  return PHASE_ORDER[currentIndex - 1];
}

/**
 * Check if phase transition is valid (no skipping)
 */
export function isValidTransition(from: PhaseType, to: PhaseType): boolean {
  const fromIndex = PHASE_ORDER.indexOf(from);
  const toIndex = PHASE_ORDER.indexOf(to);
  
  // Can only move to next phase (no skipping)
  return toIndex === fromIndex + 1;
}


/**
 * Check requirements for transitioning to a specific phase
 */
export async function checkPhaseRequirements(
  projectId: string,
  targetPhase: PhaseType
): Promise<PhaseRequirementCheck[]> {
  const requirements = PHASE_REQUIREMENTS[targetPhase];
  const checks: PhaseRequirementCheck[] = [];
  
  for (const req of requirements) {
    let satisfied = false;
    let details: string | undefined;
    
    switch (req) {
      case 'SITEMAP':
      case 'SRS': {
        const resourceCheck = await resourceRepo.checkRequiredResources(
          projectId, 
          [req as any]
        );
        satisfied = resourceCheck.complete;
        if (!satisfied) {
          details = `${req} chưa được upload hoặc chưa được duyệt`;
        }
        break;
      }
      
      case 'TECH_STACK_SELECTED': {
        const techStack = await techStackRepo.findTechStackByProjectId(projectId);
        satisfied = techStack.length > 0;
        if (!satisfied) {
          details = 'Tech stack chưa được chọn';
        }
        break;
      }
      
      case 'DB_SCHEMA_APPROVED':
      case 'API_DOC_APPROVED': {
        // Check if SRS is approved (contains these docs)
        const srsCheck = await resourceRepo.checkRequiredResources(projectId, ['SRS']);
        satisfied = srsCheck.complete;
        if (!satisfied) {
          details = `${req.replace('_', ' ')} chưa được duyệt`;
        }
        break;
      }
      
      case 'DESIGN_APPROVED': {
        // Check if design resources are approved
        const designCheck = await resourceRepo.checkRequiredResources(
          projectId, 
          ['WIREFRAME', 'MOCKUP']
        );
        // At least one design resource should be approved
        const resources = await resourceRepo.findResourcesByProjectId(projectId);
        const hasApprovedDesign = resources.some(
          r => ['WIREFRAME', 'MOCKUP', 'FIGMA_LINK'].includes(r.type) && r.status === 'APPROVED'
        );
        satisfied = hasApprovedDesign;
        if (!satisfied) {
          details = 'Chưa có design nào được duyệt';
        }
        break;
      }
      
      case 'STAGING_DEPLOYED': {
        const stagingEnv = await environmentRepo.findEnvironmentByType(projectId, 'STAGING');
        if (stagingEnv && stagingEnv.url && stagingEnv.currentVersion) {
          const latestDeployment = await environmentRepo.getLatestDeployment(stagingEnv.id);
          satisfied = latestDeployment !== null && latestDeployment.status === 'SUCCESS';
        } else {
          satisfied = false;
        }
        if (!satisfied) {
          details = 'Staging environment chưa được deploy hoặc chưa có deployment thành công';
        }
        break;
      }
      
      case 'ALL_DEV_TASKS_COMPLETE': {
        const tasks = await projectRepo.findWebTasksByProjectId(projectId);
        // Check if all tasks are in "Done" column or have all checklist items completed
        const doneColumn = await projectRepo.findTaskColumnsByProjectId(projectId);
        const doneColumnId = doneColumn.find(col => col.name.toLowerCase() === 'done')?.id;
        
        if (doneColumnId) {
          // All tasks should be in Done column
          const allInDone = tasks.every(task => task.columnId === doneColumnId);
          if (allInDone) {
            satisfied = true;
          } else {
            // Alternatively, check if all checklist items are completed
            const allChecklistsComplete = tasks.every(task => 
              !task.checklist || task.checklist.length === 0 || 
              task.checklist.every(item => item.isCompleted)
            );
            satisfied = allChecklistsComplete;
          }
        } else {
          // Fallback: check if all checklist items are completed
          const allChecklistsComplete = tasks.every(task => 
            !task.checklist || task.checklist.length === 0 || 
            task.checklist.every(item => item.isCompleted)
          );
          satisfied = allChecklistsComplete;
        }
        
        if (!satisfied) {
          details = 'Chưa hoàn thành tất cả các task development';
        }
        break;
      }
      
      case 'NO_CRITICAL_BUGS': {
        const criticalBugs = await bugReportRepo.findCriticalBugs(projectId);
        satisfied = criticalBugs.length === 0;
        if (!satisfied) {
          details = `Còn ${criticalBugs.length} critical bug(s) chưa được xử lý`;
        }
        break;
      }
      
      case 'TEST_CHECKLIST_COMPLETE': {
        // TODO: Check test checklist
        satisfied = true; // Placeholder
        break;
      }
      
      case 'UAT_SIGNOFF': {
        // TODO: Check signoffs repository when implemented
        satisfied = true; // Placeholder
        break;
      }
      
      case 'ALL_FEEDBACK_ADDRESSED': {
        // TODO: Check UAT feedback repository when implemented
        satisfied = true; // Placeholder
        break;
      }
      
      default:
        satisfied = false;
        details = `Unknown requirement: ${req}`;
    }
    
    checks.push({ requirement: req, satisfied, details });
  }
  
  return checks;
}


/**
 * Validate if project can transition to next phase
 */
export async function validateTransition(
  projectId: string
): Promise<TransitionValidation> {
  const currentPhase = await phaseRepo.findCurrentPhase(projectId);
  
  if (!currentPhase) {
    return {
      canTransition: false,
      missingRequirements: ['No active phase found'],
      currentPhase: 'KICKOFF',
      nextPhase: null,
    };
  }
  
  const nextPhase = getNextPhase(currentPhase.phaseType);
  
  if (!nextPhase) {
    return {
      canTransition: false,
      missingRequirements: ['Already at final phase'],
      currentPhase: currentPhase.phaseType,
      nextPhase: null,
    };
  }
  
  const requirementChecks = await checkPhaseRequirements(projectId, nextPhase);
  const missingRequirements = requirementChecks
    .filter(c => !c.satisfied)
    .map(c => c.details || c.requirement);
  
  return {
    canTransition: missingRequirements.length === 0,
    missingRequirements,
    currentPhase: currentPhase.phaseType,
    nextPhase,
  };
}

/**
 * Execute phase transition
 */
export async function executeTransition(
  projectId: string
): Promise<{
  success: boolean;
  error?: string;
  completed?: ProjectPhase;
  started?: ProjectPhase;
}> {
  const validation = await validateTransition(projectId);
  
  if (!validation.canTransition) {
    return {
      success: false,
      error: `Cannot transition: ${validation.missingRequirements.join(', ')}`,
    };
  }
  
  const result = await phaseRepo.transitionToNextPhase(projectId);
  
  if (!result) {
    return {
      success: false,
      error: 'Failed to execute transition',
    };
  }
  
  return {
    success: true,
    completed: result.completed || undefined,
    started: result.started || undefined,
  };
}

/**
 * Get phase display information
 */
export function getPhaseDisplayInfo(phaseType: PhaseType): {
  name: string;
  description: string;
  color: string;
} {
  const info: Record<PhaseType, { name: string; description: string; color: string }> = {
    KICKOFF: {
      name: 'Kick-off',
      description: 'Khởi động dự án, thu thập yêu cầu',
      color: 'blue',
    },
    TECHNICAL_PLANNING: {
      name: 'Technical Planning',
      description: 'Lập kế hoạch kỹ thuật, thiết kế database và API',
      color: 'purple',
    },
    DEVELOPMENT: {
      name: 'Development',
      description: 'Phát triển tính năng',
      color: 'yellow',
    },
    INTERNAL_TESTING: {
      name: 'Internal Testing',
      description: 'Kiểm thử nội bộ, fix bugs',
      color: 'orange',
    },
    UAT: {
      name: 'UAT',
      description: 'User Acceptance Testing',
      color: 'pink',
    },
    GO_LIVE: {
      name: 'Go Live',
      description: 'Triển khai production',
      color: 'green',
    },
  };
  
  return info[phaseType];
}

export default {
  getNextPhase,
  getPreviousPhase,
  isValidTransition,
  checkPhaseRequirements,
  validateTransition,
  executeTransition,
  getPhaseDisplayInfo,
};
