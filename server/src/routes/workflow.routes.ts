import { Router, Request, Response } from 'express';
import * as workflowRepo from '../repositories/workflow.repository';

const router = Router();

/**
 * GET /workflows
 * Get all workflows
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const workflows = await workflowRepo.findAllWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

/**
 * GET /workflows/:id
 * Get a specific workflow
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await workflowRepo.findWorkflowById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

/**
 * POST /workflows
 * Create a new workflow
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, steps, isDefault } = req.body;
    
    if (!name || !steps || !Array.isArray(steps)) {
      return res.status(400).json({ error: 'Name and steps (array) are required' });
    }
    
    const workflow = await workflowRepo.createWorkflow({
      name,
      description,
      steps,
      isDefault,
    });
    
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

/**
 * PUT /workflows/:id
 * Update a workflow
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, steps, isDefault } = req.body;
    
    const workflow = await workflowRepo.updateWorkflow(req.params.id, {
      name,
      description,
      steps,
      isDefault,
    });
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

/**
 * DELETE /workflows/:id
 * Delete a workflow
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await workflowRepo.deleteWorkflow(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

export default router;

