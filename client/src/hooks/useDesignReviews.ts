import { useState, useEffect, useCallback } from 'react';
import { DesignReview, ProjectResource } from '../../../shared/types';
import { get, post } from '../services/api';
import { useApiError } from './useApiError';

type ReviewWithResource = { review: DesignReview; resource: ProjectResource | null };

export function useDesignReviews(projectId: string) {
  const [reviews, setReviews] = useState<ReviewWithResource[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<ReviewWithResource[]>(`/projects/${projectId}/design-reviews`);
      setReviews(data);
    } catch (err) {
      handleError(err, fetchReviews);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = async (resourceId: string) => {
    try {
      await post(`/projects/${projectId}/design-reviews`, { resourceId });
      await fetchReviews();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const approveReview = async (reviewId: string, comments?: string) => {
    try {
      const reviewerId = 'current-user-id';
      await post(`/projects/${projectId}/design-reviews/${reviewId}/approve`, { reviewerId, comments });
      await fetchReviews();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const rejectReview = async (reviewId: string, comments: string) => {
    try {
      const reviewerId = 'current-user-id';
      await post(`/projects/${projectId}/design-reviews/${reviewId}/reject`, { reviewerId, comments });
      await fetchReviews();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const requestChanges = async (reviewId: string, comments: string) => {
    try {
      const reviewerId = 'current-user-id';
      await post(`/projects/${projectId}/design-reviews/${reviewId}/request-changes`, { reviewerId, comments });
      await fetchReviews();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return { 
    reviews, 
    loading, 
    error: userMessage, 
    createReview, 
    approveReview, 
    rejectReview, 
    requestChanges, 
    refresh: fetchReviews 
  };
}

export default useDesignReviews;
