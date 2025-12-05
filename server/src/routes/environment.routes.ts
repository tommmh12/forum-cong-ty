import { Router, Request, Response } from 'express';
import * as environmentRepo from '../repositories/environment.repository';
import * as deploymentService from '../services/deployment.service';

// Type for route params
interface ProjectParams {
  id: string;
  envId?: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /projects/:id/environments
 * Get all environments for a project
 */
router.get('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const environments = await environmentRepo.findEnvironmentsByProjectId(projectId);
    res.json(environments);
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({ error: 'Failed to fetch environments' });
  }
});

/**
 * GET /projects/:id/environments/deployment-readiness
 * Get deployment readiness status for all environments
 * NOTE: This route must be before /:envId routes to avoid matching 'deployment-readiness' as envId
 */
router.get('/deployment-readiness', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const readiness = await deploymentService.getDeploymentReadiness(projectId);
    res.json(readiness);
  } catch (error) {
    console.error('Error checking deployment readiness:', error);
    res.status(500).json({ error: 'Failed to check deployment readiness' });
  }
});

/**
 * GET /projects/:id/environments/deployment-stats
 * Get deployment statistics for a project
 * NOTE: This route must be before /:envId routes
 */
router.get('/deployment-stats', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const stats = await environmentRepo.getDeploymentStats(projectId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching deployment stats:', error);
    res.status(500).json({ error: 'Failed to fetch deployment stats' });
  }
});

/**
 * GET /projects/:id/environments/:envId
 * Get a specific environment
 */
router.get('/:envId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId, envId } = req.params;
    const environment = await environmentRepo.findEnvironmentById(envId!);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    
    // Verify environment belongs to project
    if (environment.projectId !== projectId) {
      return res.status(404).json({ error: 'Environment not found in this project' });
    }
    
    res.json(environment);
  } catch (error) {
    console.error('Error fetching environment:', error);
    res.status(500).json({ error: 'Failed to fetch environment' });
  }
});

/**
 * PUT /projects/:id/environments/:envId
 * Update environment settings (URL, SSL)
 */
router.put('/:envId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId, envId } = req.params;
    const { url, sslEnabled } = req.body;
    
    const environment = await environmentRepo.findEnvironmentById(envId!);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    
    if (environment.projectId !== projectId) {
      return res.status(404).json({ error: 'Environment not found in this project' });
    }
    
    const updated = await environmentRepo.updateEnvironment(envId!, {
      url,
      sslEnabled,
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({ error: 'Failed to update environment' });
  }
});


/**
 * POST /projects/:id/environments/:envId/deploy
 * Deploy to an environment
 */
router.post('/:envId/deploy', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId, envId } = req.params;
    const { version, deployedBy, commitHash, notes } = req.body;
    
    if (!version || !deployedBy) {
      return res.status(400).json({ error: 'Version and deployedBy are required' });
    }
    
    const result = await deploymentService.deploy(projectId, {
      environmentId: envId!,
      version,
      deployedBy,
      commitHash,
      notes,
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json({
      deployment: result.deployment,
      environment: result.environment,
    });
  } catch (error) {
    console.error('Error deploying:', error);
    res.status(500).json({ error: 'Failed to deploy' });
  }
});

/**
 * POST /projects/:id/environments/:envId/rollback
 * Rollback to a previous deployment
 */
router.post('/:envId/rollback', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { envId } = req.params;
    const { deploymentId, userId } = req.body;
    
    if (!deploymentId || !userId) {
      return res.status(400).json({ error: 'deploymentId and userId are required' });
    }
    
    const result = await deploymentService.rollback(
      envId!,
      deploymentId,
      userId
    );
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      deployment: result.deployment,
      environment: result.environment,
    });
  } catch (error) {
    console.error('Error rolling back:', error);
    res.status(500).json({ error: 'Failed to rollback' });
  }
});

/**
 * GET /projects/:id/environments/:envId/deployments
 * Get deployment history for an environment
 */
router.get('/:envId/deployments', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { envId } = req.params;
    const deployments = await environmentRepo.findDeploymentsByEnvironmentId(envId!);
    res.json(deployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

export default router;
