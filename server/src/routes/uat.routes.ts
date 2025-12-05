import { Router, Request, Response } from 'express';
import * as uatRepo from '../repositories/uat.repository';
import * as uatService from '../services/uat.service';

interface ProjectParams {
  id: string;
  feedbackId?: string;
  signoffId?: string;
}

const router = Router({ mergeParams: true });

// UAT Feedback endpoints
router.get('/feedback', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const feedback = await uatRepo.findUATFeedbackByProjectId(projectId);
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching UAT feedback:', error);
    res.status(500).json({ error: 'Failed to fetch UAT feedback' });
  }
});

router.post('/feedback', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { featureName, pageUrl, feedbackText, providedBy } = req.body;
    
    if (!feedbackText || !providedBy) {
      return res.status(400).json({ error: 'feedbackText and providedBy are required' });
    }
    
    const feedback = await uatRepo.createUATFeedback({
      projectId, featureName, pageUrl, feedbackText, providedBy,
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating UAT feedback:', error);
    res.status(500).json({ error: 'Failed to create UAT feedback' });
  }
});

router.put('/feedback/:feedbackId/status', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });
    
    const feedback = await uatRepo.updateUATFeedbackStatus(feedbackId!, status);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    
    res.json(feedback);
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
});

// UAT Status
router.get('/status', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const status = await uatService.getUATStatus(projectId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching UAT status:', error);
    res.status(500).json({ error: 'Failed to fetch UAT status' });
  }
});

// Signoffs
router.get('/signoffs', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const signoffs = await uatRepo.findSignoffsByProjectId(projectId);
    res.json(signoffs);
  } catch (error) {
    console.error('Error fetching signoffs:', error);
    res.status(500).json({ error: 'Failed to fetch signoffs' });
  }
});

router.post('/signoffs', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const result = await uatService.createSignoff({ ...req.body, projectId });
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json(result.signoff);
  } catch (error) {
    console.error('Error creating signoff:', error);
    res.status(500).json({ error: 'Failed to create signoff' });
  }
});

router.get('/signoffs/check/:type', async (req: Request<ProjectParams & { type: string }>, res: Response) => {
  try {
    const { id: projectId, type } = req.params;
    const hasSignoff = await uatRepo.hasSignoff(projectId, type as any);
    res.json({ hasSignoff });
  } catch (error) {
    console.error('Error checking signoff:', error);
    res.status(500).json({ error: 'Failed to check signoff' });
  }
});

export default router;
