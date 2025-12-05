import { Router, Request, Response } from 'express';
import * as bugReportRepo from '../repositories/bug-report.repository';
import * as testingService from '../services/testing.service';

interface ProjectParams {
  id: string;
  bugId?: string;
}

const router = Router({ mergeParams: true });

router.get('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { severity } = req.query;
    
    let bugs;
    if (severity && typeof severity === 'string') {
      bugs = await bugReportRepo.findBugReportsBySeverity(projectId, severity as any);
    } else {
      bugs = await bugReportRepo.findBugReportsByProjectId(projectId);
    }
    
    res.json(bugs);
  } catch (error) {
    console.error('Error fetching bugs:', error);
    res.status(500).json({ error: 'Failed to fetch bugs' });
  }
});

router.get('/stats', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const stats = await testingService.getTestStatistics(projectId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching bug stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

router.get('/critical-check', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const result = await testingService.checkCriticalBugsForPhaseTransition(projectId);
    res.json(result);
  } catch (error) {
    console.error('Error checking critical bugs:', error);
    res.status(500).json({ error: 'Failed to check critical bugs' });
  }
});

router.get('/:bugId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { bugId } = req.params;
    const bug = await bugReportRepo.findBugReportById(bugId!);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    res.json(bug);
  } catch (error) {
    console.error('Error fetching bug:', error);
    res.status(500).json({ error: 'Failed to fetch bug' });
  }
});

router.post('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const result = await testingService.createBugReport({ ...req.body, projectId });
    
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.errors });
    }
    
    res.status(201).json(result.bug);
  } catch (error) {
    console.error('Error creating bug:', error);
    res.status(500).json({ error: 'Failed to create bug' });
  }
});

router.put('/:bugId/status', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { bugId } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    const bug = await bugReportRepo.updateBugReportStatus(bugId!, status);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    
    res.json(bug);
  } catch (error) {
    console.error('Error updating bug status:', error);
    res.status(500).json({ error: 'Failed to update bug status' });
  }
});

router.put('/:bugId/assign', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { bugId } = req.params;
    const { assignedTo } = req.body;
    
    if (!assignedTo) return res.status(400).json({ error: 'assignedTo is required' });
    
    const bug = await bugReportRepo.assignBugReport(bugId!, assignedTo);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    
    res.json(bug);
  } catch (error) {
    console.error('Error assigning bug:', error);
    res.status(500).json({ error: 'Failed to assign bug' });
  }
});

export default router;
