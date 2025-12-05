import { Router, Request, Response } from 'express';
import * as goLiveService from '../services/go-live.service';

interface ProjectParams {
  id: string;
}

const router = Router({ mergeParams: true });

router.get('/checklist', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const checklist = await goLiveService.generateGoLiveChecklist(projectId);
    res.json(checklist);
  } catch (error) {
    console.error('Error fetching go-live checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

router.get('/readiness', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const readiness = await goLiveService.isReadyForGoLive(projectId);
    res.json(readiness);
  } catch (error) {
    console.error('Error checking go-live readiness:', error);
    res.status(500).json({ error: 'Failed to check readiness' });
  }
});

router.get('/handover', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const documents = await goLiveService.generateHandoverDocuments(projectId);
    const warranty = goLiveService.getWarrantyInfo();
    res.json({ documents, warranty });
  } catch (error) {
    console.error('Error fetching handover info:', error);
    res.status(500).json({ error: 'Failed to fetch handover info' });
  }
});

export default router;
