import { Router, Request, Response } from 'express';
import * as resourceRepo from '../repositories/resource.repository';
import * as resourceValidation from '../services/resource-validation.service';
import { ResourceType } from '../../../shared/types';

// Type for route params
interface ProjectParams {
  id: string;
  rid?: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /projects/:id/resources
 * Get all resources for a project
 */
router.get('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { type } = req.query;
    
    let resources;
    if (type && typeof type === 'string') {
      resources = await resourceRepo.findResourcesByType(projectId, type as ResourceType);
    } else {
      resources = await resourceRepo.findResourcesByProjectId(projectId);
    }
    
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

/**
 * GET /projects/:id/resources/stats
 * Get resource statistics for a project
 */
router.get('/stats', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const stats = await resourceRepo.getResourceStats(projectId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching resource stats:', error);
    res.status(500).json({ error: 'Failed to fetch resource statistics' });
  }
});

/**
 * GET /projects/:id/resources/check
 * Check if required resources are complete
 */
router.get('/check', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { types } = req.query;
    
    const requiredTypes = types 
      ? (types as string).split(',') as ResourceType[]
      : ['SITEMAP', 'SRS'] as ResourceType[];
    
    const result = await resourceRepo.checkRequiredResources(projectId, requiredTypes);
    res.json(result);
  } catch (error) {
    console.error('Error checking resources:', error);
    res.status(500).json({ error: 'Failed to check resources' });
  }
});


/**
 * GET /projects/:id/resources/:rid
 * Get a single resource
 */
router.get('/:rid', async (req, res) => {
  try {
    const { rid } = req.params;
    const resource = await resourceRepo.findResourceById(rid);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

/**
 * POST /projects/:id/resources
 * Create a new resource
 */
router.post('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { type, name, filePath, url, encryptedData } = req.body;
    
    // Validate required fields
    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }
    
    // Validate resource type
    const validTypes: ResourceType[] = ['SITEMAP', 'SRS', 'WIREFRAME', 'MOCKUP', 'FIGMA_LINK', 'ASSET', 'CREDENTIAL'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid resource type', validTypes });
    }
    
    // Validate resource data
    const validation = resourceValidation.validateResource(type, {
      filename: filePath,
      url,
      encryptedData,
    });
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validation.errors,
        allowedFormats: resourceValidation.getAllowedFormats(type),
      });
    }
    
    const resource = await resourceRepo.createResource({
      projectId,
      type,
      name,
      filePath,
      url,
      encryptedData,
    });
    
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

/**
 * PUT /projects/:id/resources/:rid
 * Update a resource
 */
router.put('/:rid', async (req, res) => {
  try {
    const { rid } = req.params;
    const { name, filePath, url, encryptedData } = req.body;
    
    const existing = await resourceRepo.findResourceById(rid);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Validate if file path is being updated
    if (filePath) {
      const validation = resourceValidation.validateFileFormat(existing.type, filePath);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          allowedFormats: validation.allowedFormats,
        });
      }
    }
    
    const resource = await resourceRepo.updateResource(rid, {
      name,
      filePath,
      url,
      encryptedData,
    });
    
    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});


/**
 * PUT /projects/:id/resources/:rid/version
 * Create a new version of a resource
 */
router.put('/:rid/version', async (req, res) => {
  try {
    const { rid } = req.params;
    const { filePath, url, encryptedData } = req.body;
    
    const existing = await resourceRepo.findResourceById(rid);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Validate if file path is being updated
    if (filePath) {
      const validation = resourceValidation.validateFileFormat(existing.type, filePath);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          allowedFormats: validation.allowedFormats,
        });
      }
    }
    
    const resource = await resourceRepo.createNewVersion(rid, {
      filePath,
      url,
      encryptedData,
    });
    
    res.json(resource);
  } catch (error) {
    console.error('Error creating new version:', error);
    res.status(500).json({ error: 'Failed to create new version' });
  }
});

/**
 * POST /projects/:id/resources/:rid/approve
 * Approve a resource
 */
router.post('/:rid/approve', async (req, res) => {
  try {
    const { rid } = req.params;
    const { approverId } = req.body;
    
    if (!approverId) {
      return res.status(400).json({ error: 'Approver ID is required' });
    }
    
    const existing = await resourceRepo.findResourceById(rid);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    if (existing.status === 'APPROVED') {
      return res.status(409).json({ error: 'Resource is already approved' });
    }
    
    const resource = await resourceRepo.approveResource(rid, approverId);
    res.json(resource);
  } catch (error) {
    console.error('Error approving resource:', error);
    res.status(500).json({ error: 'Failed to approve resource' });
  }
});

/**
 * POST /projects/:id/resources/:rid/reject
 * Reject a resource
 */
router.post('/:rid/reject', async (req, res) => {
  try {
    const { rid } = req.params;
    
    const existing = await resourceRepo.findResourceById(rid);
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    const resource = await resourceRepo.rejectResource(rid);
    res.json(resource);
  } catch (error) {
    console.error('Error rejecting resource:', error);
    res.status(500).json({ error: 'Failed to reject resource' });
  }
});

/**
 * DELETE /projects/:id/resources/:rid
 * Delete a resource
 */
router.delete('/:rid', async (req, res) => {
  try {
    const { rid } = req.params;
    
    const deleted = await resourceRepo.deleteResource(rid);
    if (!deleted) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

export default router;
