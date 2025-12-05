import { useState, useEffect, useCallback } from 'react';
import { UATFeedback, UATFeedbackStatus, ProjectSignoff, SignoffType } from '../../../shared/types';
import api from '../services/api';
import { useApiError } from './useApiError';

interface UATStatus {
  totalFeedback: number;
  pendingFeedback: number;
  addressedFeedback: number;
  hasUATSignoff: boolean;
  canSignoff: boolean;
}

export function useUAT(projectId: string) {
  const [feedback, setFeedback] = useState<UATFeedback[]>([]);
  const [signoffs, setSignoffs] = useState<ProjectSignoff[]>([]);
  const [status, setStatus] = useState<UATStatus>({
    totalFeedback: 0,
    pendingFeedback: 0,
    addressedFeedback: 0,
    hasUATSignoff: false,
    canSignoff: false,
  });
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const [feedbackData, signoffsData, statusData] = await Promise.all([
        api.get<UATFeedback[]>(`/projects/${projectId}/uat/feedback`),
        api.get<ProjectSignoff[]>(`/projects/${projectId}/uat/signoffs`),
        api.get<UATStatus>(`/projects/${projectId}/uat/status`),
      ]);
      setFeedback(feedbackData);
      setSignoffs(signoffsData);
      setStatus(statusData);
    } catch (err) {
      handleError(err, fetchData);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addFeedback = async (data: { featureName?: string; pageUrl?: string; feedbackText: string }) => {
    try {
      const providedBy = 'current-user-id';
      await api.post(`/projects/${projectId}/uat/feedback`, { ...data, providedBy });
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const updateFeedbackStatus = async (feedbackId: string, feedbackStatus: UATFeedbackStatus) => {
    try {
      await api.put(`/projects/${projectId}/uat/feedback/${feedbackId}/status`, { status: feedbackStatus });
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const createSignoff = async (data: { signoffType: SignoffType; approverName: string; approverEmail?: string; signatureData?: string; notes?: string }) => {
    try {
      await api.post(`/projects/${projectId}/uat/signoffs`, data);
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return { 
    feedback, 
    signoffs, 
    status, 
    loading, 
    error: userMessage, 
    addFeedback, 
    updateFeedbackStatus, 
    createSignoff, 
    refresh: fetchData 
  };
}

export default useUAT;
