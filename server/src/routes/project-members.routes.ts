import { Router, Request, Response } from 'express';
import * as memberRepo from '../repositories/project-members.repository';

interface ProjectParams {
  id: string;
  userId?: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /projects/:id/members
 * Get all members of a project
 */
router.get('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const members = await memberRepo.findMembersByProjectId(projectId);
    res.json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', { projectId: req.params.id, error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    res.status(500).json({ error: 'Failed to fetch project members', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined });
  }
});

/**
 * POST /projects/:id/members
 * Add a member to a project
 */
router.post('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { userId, role } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const member = await memberRepo.addMember(
      projectId,
      userId,
      role || 'MEMBER'
    );
    
    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding project member:', error);
    if (error instanceof Error && error.message.includes('already a member')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to add project member' });
  }
});

/**
 * PUT /projects/:id/members/:userId
 * Update a member's role
 */
router.put('/:userId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }
    
    if (!['MANAGER', 'LEADER', 'MEMBER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const updated = await memberRepo.updateMemberRole(
      projectId,
      userId,
      role
    );
    
    if (!updated) {
      return res.status(404).json({ error: 'Project member not found' });
    }
    
    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating project member role:', error);
    res.status(500).json({ error: 'Failed to update project member role' });
  }
});

/**
 * DELETE /projects/:id/members/:userId
 * Remove a member from a project
 */
router.delete('/:userId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;
    
    const deleted = await memberRepo.removeMember(projectId, userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Project member not found' });
    }
    
    res.json({ message: 'Member removed from project successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ error: 'Failed to remove project member' });
  }
});

/**
 * GET /projects/:id/members/:userId
 * Get a specific member
 */
router.get('/:userId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId, userId } = req.params;
    
    const member = await memberRepo.findMember(projectId, userId);
    
    if (!member) {
      return res.status(404).json({ error: 'Project member not found' });
    }
    
    res.json(member);
  } catch (error) {
    console.error('Error fetching project member:', error);
    res.status(500).json({ error: 'Failed to fetch project member' });
  }
});

export default router;

