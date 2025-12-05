import { Router, Request, Response } from 'express';
import * as exportService from '../services/export.service';

interface ProjectParams {
  id: string;
}

const router = Router({ mergeParams: true });

router.get('/json', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const data = await exportService.exportProjectAsJSON(projectId);
    
    if (!data) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="project-${projectId}.json"`);
    res.json(data);
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ error: 'Failed to export project' });
  }
});

router.get('/csv', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const csv = await exportService.exportTasksAsCSV(projectId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tasks-${projectId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export tasks' });
  }
});

router.get('/pdf-data', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const data = await exportService.generatePDFReportData(projectId);
    res.json(data);
  } catch (error) {
    console.error('Error generating PDF data:', error);
    res.status(500).json({ error: 'Failed to generate PDF data' });
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const validation = exportService.validateImportData(data);
    
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid import data', details: validation.errors });
    }
    
    // Import logic would go here
    res.json({ success: true, message: 'Import validation passed' });
  } catch (error) {
    console.error('Error importing project:', error);
    res.status(500).json({ error: 'Failed to import project' });
  }
});

export default router;
