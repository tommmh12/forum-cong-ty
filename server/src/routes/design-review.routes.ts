import { Router, Request, Response } from 'express';
import * as designReviewRepo from '../repositories/design-review.repository';
import * as designReviewService from '../services/design-review.service';

interface ProjectParams {
  id: string;
  reviewId?: string;
}

const router = Router({ mergeParams: true });

/**
 * GET /projects/:id/design-reviews
 * Get all design reviews for a project
 */
router.get('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const reviews = await designReviewService.getDesignReviewsWithResources(projectId);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching design reviews:', error);
    res.status(500).json({ error: 'Failed to fetch design reviews' });
  }
});

/**
 * GET /projects/:id/design-reviews/stats
 * Get design review statistics
 */
router.get('/stats', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const stats = await designReviewRepo.getDesignReviewStats(projectId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching design review stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /projects/:id/design-reviews/frontend-status
 * Check if frontend tasks can proceed
 */
router.get('/frontend-status', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const status = await designReviewService.canFrontendTasksProceed(projectId);
    res.json(status);
  } catch (error) {
    console.error('Error checking frontend status:', error);
    res.status(500).json({ error: 'Failed to check frontend status' });
  }
});


/**
 * GET /projects/:id/design-reviews/:reviewId
 * Get a specific design review
 */
router.get('/:reviewId', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await designReviewRepo.findDesignReviewById(reviewId!);
    
    if (!review) {
      return res.status(404).json({ error: 'Design review not found' });
    }
    
    res.json(review);
  } catch (error) {
    console.error('Error fetching design review:', error);
    res.status(500).json({ error: 'Failed to fetch design review' });
  }
});

/**
 * POST /projects/:id/design-reviews
 * Create a new design review
 */
router.post('/', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { resourceId } = req.body;
    
    if (!resourceId) {
      return res.status(400).json({ error: 'resourceId is required' });
    }
    
    const result = await designReviewService.createReview(projectId, resourceId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json(result.review);
  } catch (error) {
    console.error('Error creating design review:', error);
    res.status(500).json({ error: 'Failed to create design review' });
  }
});

/**
 * POST /projects/:id/design-reviews/:reviewId/approve
 * Approve a design review
 */
router.post('/:reviewId/approve', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reviewerId, comments } = req.body;
    
    if (!reviewerId) {
      return res.status(400).json({ error: 'reviewerId is required' });
    }
    
    const result = await designReviewService.approveReview(reviewId!, reviewerId, comments);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result.review);
  } catch (error) {
    console.error('Error approving design review:', error);
    res.status(500).json({ error: 'Failed to approve design review' });
  }
});

/**
 * POST /projects/:id/design-reviews/:reviewId/reject
 * Reject a design review
 */
router.post('/:reviewId/reject', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reviewerId, comments } = req.body;
    
    if (!reviewerId || !comments) {
      return res.status(400).json({ error: 'reviewerId and comments are required' });
    }
    
    const result = await designReviewService.rejectReview(reviewId!, reviewerId, comments);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result.review);
  } catch (error) {
    console.error('Error rejecting design review:', error);
    res.status(500).json({ error: 'Failed to reject design review' });
  }
});

/**
 * POST /projects/:id/design-reviews/:reviewId/request-changes
 * Request changes for a design review
 */
router.post('/:reviewId/request-changes', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reviewerId, comments } = req.body;
    
    if (!reviewerId || !comments) {
      return res.status(400).json({ error: 'reviewerId and comments are required' });
    }
    
    const result = await designReviewService.requestChangesForReview(reviewId!, reviewerId, comments);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result.review);
  } catch (error) {
    console.error('Error requesting changes:', error);
    res.status(500).json({ error: 'Failed to request changes' });
  }
});

export default router;
