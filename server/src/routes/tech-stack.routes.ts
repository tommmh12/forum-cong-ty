import { Router, Request, Response } from 'express';
import { TechStackCategory } from '../../../shared/types';
import * as techStackRepo from '../repositories/tech-stack.repository';
import * as techStackService from '../services/tech-stack.service';

const router = Router();

/**
 * GET /projects/:projectId/tech-stack
 * Get all tech stack items for a project
 */
router.get('/projects/:projectId/tech-stack', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const items = await techStackRepo.findTechStackByProjectId(projectId);
    const summary = await techStackRepo.getTechStackSummary(projectId);
    const validation = techStackService.validateTechStack(items);
    
    res.json({
      items,
      summary,
      validation,
    });
  } catch (error) {
    console.error('Error fetching tech stack:', error);
    res.status(500).json({ error: 'Failed to fetch tech stack' });
  }
});

/**
 * POST /projects/:projectId/tech-stack
 * Add a new tech stack item
 */
router.post('/projects/:projectId/tech-stack', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { category, name, version } = req.body;
    
    // Validate required fields
    if (!category || !name) {
      return res.status(400).json({ error: 'Category and name are required' });
    }
    
    // Validate category
    const validCategories: TechStackCategory[] = ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'HOSTING', 'OTHER'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      });
    }
    
    const result = await techStackService.addTechStackItem({
      projectId,
      category,
      name,
      version,
    });
    
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }
    
    res.status(201).json({
      item: result.item,
      compatibility: result.compatibility,
    });
  } catch (error) {
    console.error('Error adding tech stack item:', error);
    res.status(500).json({ error: 'Failed to add tech stack item' });
  }
});


/**
 * PUT /projects/:projectId/tech-stack/:itemId
 * Update a tech stack item
 */
router.put('/projects/:projectId/tech-stack/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { name, version } = req.body;
    const userRole = (req as any).user?.role || 'Employee';
    
    const result = await techStackService.updateTechStackItem(
      itemId,
      { name, version },
      userRole
    );
    
    if (!result.success) {
      return res.status(result.error?.includes('not found') ? 404 : 403).json({ 
        error: result.error 
      });
    }
    
    res.json({ item: result.item });
  } catch (error) {
    console.error('Error updating tech stack item:', error);
    res.status(500).json({ error: 'Failed to update tech stack item' });
  }
});

/**
 * DELETE /projects/:projectId/tech-stack/:itemId
 * Delete a tech stack item
 */
router.delete('/projects/:projectId/tech-stack/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const userRole = (req as any).user?.role || 'Employee';
    
    const result = await techStackService.removeTechStackItem(itemId, userRole);
    
    if (!result.success) {
      return res.status(result.error?.includes('not found') ? 404 : 403).json({ 
        error: result.error 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tech stack item:', error);
    res.status(500).json({ error: 'Failed to delete tech stack item' });
  }
});

/**
 * POST /projects/:projectId/tech-stack/lock
 * Lock the entire tech stack for a project
 */
router.post('/projects/:projectId/tech-stack/lock', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id || 'system';
    const userRole = (req as any).user?.role || 'Employee';
    
    const result = await techStackService.lockTechStack(projectId, userId, userRole);
    
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }
    
    res.json({
      success: true,
      items: result.items,
      message: 'Tech stack locked successfully',
    });
  } catch (error) {
    console.error('Error locking tech stack:', error);
    res.status(500).json({ error: 'Failed to lock tech stack' });
  }
});

/**
 * POST /projects/:projectId/tech-stack/unlock
 * Unlock the entire tech stack for a project (Manager only)
 */
router.post('/projects/:projectId/tech-stack/unlock', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userRole = (req as any).user?.role || 'Employee';
    
    const result = await techStackService.unlockTechStack(projectId, userRole);
    
    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }
    
    res.json({
      success: true,
      items: result.items,
      message: 'Tech stack unlocked successfully',
    });
  } catch (error) {
    console.error('Error unlocking tech stack:', error);
    res.status(500).json({ error: 'Failed to unlock tech stack' });
  }
});

/**
 * GET /projects/:projectId/tech-stack/compatibility
 * Check compatibility for a potential new item
 */
router.get('/projects/:projectId/tech-stack/compatibility', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, category } = req.query;
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    
    const existingItems = await techStackRepo.findTechStackByProjectId(projectId);
    const compatibility = techStackService.checkCompatibility(
      { name: name as string, category: category as TechStackCategory },
      existingItems
    );
    
    res.json(compatibility);
  } catch (error) {
    console.error('Error checking compatibility:', error);
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
});

/**
 * GET /projects/:projectId/tech-stack/suggestions
 * Get tech stack suggestions based on existing items
 */
router.get('/projects/:projectId/tech-stack/suggestions', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { category } = req.query;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }
    
    const existingItems = await techStackRepo.findTechStackByProjectId(projectId);
    const suggestions = techStackService.getCompatibilitySuggestions(
      category as TechStackCategory,
      existingItems
    );
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

export default router;
