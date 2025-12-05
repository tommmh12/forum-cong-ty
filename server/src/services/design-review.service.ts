import * as designReviewRepo from '../repositories/design-review.repository';
import * as resourceRepo from '../repositories/resource.repository';
import { query } from '../config/database';
import {
  DesignReview,
  DesignReviewStatus,
  ProjectResource,
} from '../../../shared/types';

export interface ReviewResult {
  success: boolean;
  review?: DesignReview;
  error?: string;
}

/**
 * Create a design review for a resource
 */
export async function createReview(
  projectId: string,
  resourceId: string
): Promise<ReviewResult> {
  // Verify resource exists and is a design resource
  const resource = await resourceRepo.findResourceById(resourceId);
  if (!resource) {
    return { success: false, error: 'Resource not found' };
  }
  
  if (resource.projectId !== projectId) {
    return { success: false, error: 'Resource does not belong to this project' };
  }
  
  // Check if resource is a design type
  const designTypes = ['WIREFRAME', 'MOCKUP', 'FIGMA_LINK'];
  if (!designTypes.includes(resource.type)) {
    return { success: false, error: 'Resource is not a design type' };
  }
  
  // Check if review already exists
  const existingReview = await designReviewRepo.findDesignReviewByResourceId(resourceId);
  if (existingReview && existingReview.status === 'PENDING') {
    return { success: false, error: 'A pending review already exists for this resource' };
  }
  
  const review = await designReviewRepo.createDesignReview(projectId, resourceId);
  return { success: true, review };
}


/**
 * Approve a design review
 * Locks the resource version when approved
 */
export async function approveReview(
  reviewId: string,
  reviewerId: string,
  comments?: string
): Promise<ReviewResult> {
  const review = await designReviewRepo.findDesignReviewById(reviewId);
  if (!review) {
    return { success: false, error: 'Review not found' };
  }
  
  if (review.status !== 'PENDING' && review.status !== 'CHANGE_REQUESTED') {
    return { success: false, error: 'Review is not in a reviewable state' };
  }
  
  // Get resource to lock version
  const resource = await resourceRepo.findResourceById(review.resourceId);
  if (!resource) {
    return { success: false, error: 'Associated resource not found' };
  }
  
  const updatedReview = await designReviewRepo.approveDesignReview(
    reviewId,
    reviewerId,
    resource.version,
    comments
  );
  
  // Also approve the resource
  await resourceRepo.approveResource(review.resourceId, reviewerId);
  
  return { success: true, review: updatedReview || undefined };
}

/**
 * Reject a design review
 */
export async function rejectReview(
  reviewId: string,
  reviewerId: string,
  comments: string
): Promise<ReviewResult> {
  if (!comments || comments.trim() === '') {
    return { success: false, error: 'Comments are required when rejecting' };
  }
  
  const review = await designReviewRepo.findDesignReviewById(reviewId);
  if (!review) {
    return { success: false, error: 'Review not found' };
  }
  
  if (review.status !== 'PENDING' && review.status !== 'CHANGE_REQUESTED') {
    return { success: false, error: 'Review is not in a reviewable state' };
  }
  
  const updatedReview = await designReviewRepo.rejectDesignReview(reviewId, reviewerId, comments);
  
  // Also reject the resource
  await resourceRepo.rejectResource(review.resourceId);
  
  return { success: true, review: updatedReview || undefined };
}

/**
 * Request changes for a design review
 */
export async function requestChangesForReview(
  reviewId: string,
  reviewerId: string,
  comments: string
): Promise<ReviewResult> {
  if (!comments || comments.trim() === '') {
    return { success: false, error: 'Comments are required when requesting changes' };
  }
  
  const review = await designReviewRepo.findDesignReviewById(reviewId);
  if (!review) {
    return { success: false, error: 'Review not found' };
  }
  
  if (review.status !== 'PENDING') {
    return { success: false, error: 'Can only request changes for pending reviews' };
  }
  
  const updatedReview = await designReviewRepo.requestChanges(reviewId, reviewerId, comments);
  return { success: true, review: updatedReview || undefined };
}

/**
 * Check if Frontend tasks can proceed
 * Frontend tasks are blocked until design is approved
 */
export async function canFrontendTasksProceed(projectId: string): Promise<{
  canProceed: boolean;
  reason?: string;
}> {
  const isApproved = await designReviewRepo.isDesignApproved(projectId);
  
  if (!isApproved) {
    return {
      canProceed: false,
      reason: 'Design must be approved before Frontend tasks can proceed',
    };
  }
  
  return { canProceed: true };
}

/**
 * Get all design reviews with resource details
 */
export async function getDesignReviewsWithResources(projectId: string): Promise<{
  review: DesignReview;
  resource: ProjectResource | null;
}[]> {
  const reviews = await designReviewRepo.findDesignReviewsByProjectId(projectId);
  
  const result = await Promise.all(
    reviews.map(async (review) => {
      const resource = await resourceRepo.findResourceById(review.resourceId);
      return { review, resource };
    })
  );
  
  return result;
}

export default {
  createReview,
  approveReview,
  rejectReview,
  requestChangesForReview,
  canFrontendTasksProceed,
  getDesignReviewsWithResources,
};
