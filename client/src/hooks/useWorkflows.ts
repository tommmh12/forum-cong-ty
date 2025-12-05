import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { useApiError } from './useApiError';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<Workflow[]>('/workflows');
      setWorkflows(data);
    } catch (err) {
      handleError(err, fetchWorkflows);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = async (data: {
    name: string;
    description?: string;
    steps: string[];
    isDefault?: boolean;
  }) => {
    try {
      const workflow = await post<Workflow>('/workflows', data);
      await fetchWorkflows();
      return workflow;
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const updateWorkflow = async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      steps: string[];
      isDefault: boolean;
    }>
  ) => {
    try {
      const workflow = await put<Workflow>(`/workflows/${id}`, data);
      await fetchWorkflows();
      return workflow;
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await del(`/workflows/${id}`);
      await fetchWorkflows();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return {
    workflows,
    loading,
    error: userMessage,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    refresh: fetchWorkflows,
  };
}

export default useWorkflows;

