import { Router, Request, Response } from 'express';
import * as phaseRepo from '../repositories/phase.repository';
import * as phaseTransition from '../services/phase-transition.service';
import { PhaseStatus } from '../../../shared/types';

interface ProjectParams {
  id: string;
  pid?: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /projects/:id/phases
 * Get all phases for a project
 */
router.get('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const phases = await phaseRepo.findPhasesByProjectId(projectId);
    res.json(phases);
  } catch (error) {
    console.error('Error fetching phases:', error);
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
});

/**
 * GET /projects/:id/phases/current
 * Get current active phase
 */
router.get('/current', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const phase = await phaseRepo.findCurrentPhase(projectId);
    
    if (!phase) {
      return res.status(404).json({ error: 'No active phase found' });
    }
    
    const displayInfo = phaseTransition.getPhaseDisplayInfo(phase.phaseType);
    res.json({ ...phase, ...displayInfo });
  } catch (error) {
    console.error('Error fetching current phase:', error);
    res.status(500).json({ error: 'Failed to fetch current phase' });
  }
});

/**
 * GET /projects/:id/phases/progress
 * Get phase progress summary
 */
router.get('/progress', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const progress = await phaseRepo.getPhaseProgress(projectId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching phase progress:', error);
    res.status(500).json({ error: 'Failed to fetch phase progress' });
  }
});


/**
 * GET /projects/:id/phases/validate-transition
 * Check if project can transition to next phase
 */
router.get('/validate-transition', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const validation = await phaseTransition.validateTransition(projectId);
    res.json(validation);
  } catch (error) {
    console.error('Error validating transition:', error);
    res.status(500).json({ error: 'Failed to validate transition' });
  }
});

/**
 * GET /projects/:id/phases/can-transition
 * Alias for validate-transition - Check if project can transition to next phase
 */
router.get('/can-transition', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const validation = await phaseTransition.validateTransition(projectId);
    res.json(validation);
  } catch (error) {
    console.error('Error checking transition:', error);
    res.status(500).json({ error: 'Failed to check transition' });
  }
});

/**
 * GET /projects/:id/phases/:pid
 * Get a single phase
 */
router.get('/:pid', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { pid } = req.params;
    const phase = await phaseRepo.findPhaseById(pid!);
    
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    
    const displayInfo = phaseTransition.getPhaseDisplayInfo(phase.phaseType);
    res.json({ ...phase, ...displayInfo });
  } catch (error) {
    console.error('Error fetching phase:', error);
    res.status(500).json({ error: 'Failed to fetch phase' });
  }
});

/**
 * PUT /projects/:id/phases/:pid
 * Update phase status
 */
router.put('/:pid', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { pid } = req.params;
    const { status, blockedReason } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses: PhaseStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }
    
    if (status === 'BLOCKED' && !blockedReason) {
      return res.status(400).json({ error: 'Blocked reason is required when blocking a phase' });
    }
    
    const phase = await phaseRepo.updatePhaseStatus(pid!, status, blockedReason);
    
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    
    res.json(phase);
  } catch (error) {
    console.error('Error updating phase:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

/**
 * POST /projects/:id/phases/transition
 * Transition to next phase (without specifying phase ID)
 */
router.post('/transition', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    
    const result = await phaseTransition.executeTransition(projectId);
    
    if (!result.success) {
      return res.status(409).json({ 
        error: 'Cannot transition to next phase',
        details: result.error,
      });
    }
    
    res.json({
      message: 'Phase transition successful',
      completed: result.completed,
      started: result.started,
    });
  } catch (error) {
    console.error('Error transitioning phase:', error);
    res.status(500).json({ error: 'Failed to transition phase' });
  }
});

/**
 * POST /projects/:id/phases/:pid/transition
 * Transition to next phase (with phase ID - legacy)
 */
router.post('/:pid/transition', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    
    const result = await phaseTransition.executeTransition(projectId);
    
    if (!result.success) {
      return res.status(409).json({ 
        error: 'Cannot transition to next phase',
        details: result.error,
      });
    }
    
    res.json({
      message: 'Phase transition successful',
      completed: result.completed,
      started: result.started,
    });
  } catch (error) {
    console.error('Error transitioning phase:', error);
    res.status(500).json({ error: 'Failed to transition phase' });
  }
});

/**
 * POST /projects/:id/phases/:pid/block
 * Block a phase
 */
router.post('/:pid/block', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { pid } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Block reason is required' });
    }
    
    const phase = await phaseRepo.blockPhase(pid!, reason);
    
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    
    res.json(phase);
  } catch (error) {
    console.error('Error blocking phase:', error);
    res.status(500).json({ error: 'Failed to block phase' });
  }
});

/**
 * POST /projects/:id/phases/:pid/unblock
 * Unblock a phase
 */
router.post('/:pid/unblock', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { pid } = req.params;
    
    const phase = await phaseRepo.unblockPhase(pid!);
    
    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }
    
    res.json(phase);
  } catch (error) {
    console.error('Error unblocking phase:', error);
    res.status(500).json({ error: 'Failed to unblock phase' });
  }
});

export default router;
