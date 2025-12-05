import { useState, useEffect, useCallback } from 'react';
import { ProjectResource, ResourceType, ResourceStatus } from '../../../shared/types';
import { get, post, put, del } from '../services/api';
import { useApiError } from './useApiError';

export function useProjectResources(projectId: string) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<ProjectResource[]>(`/projects/${projectId}/resources`);
      setResources(data);
    } catch (err) {
      handleError(err, fetchResources);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const uploadResource = async (type: ResourceType, file: File | null, url?: string) => {
    try {
      const formData = new FormData();
      formData.append('type', type);
      if (file) formData.append('file', file);
      if (url) formData.append('url', url);
      await post(`/projects/${projectId}/resources`, formData);
      await fetchResources();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const approveResource = async (resourceId: string) => {
    try {
      await put(`/projects/${projectId}/resources/${resourceId}/approve`, {});
      await fetchResources();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const rejectResource = async (resourceId: string) => {
    try {
      await put(`/projects/${projectId}/resources/${resourceId}/reject`, {});
      await fetchResources();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      await del(`/projects/${projectId}/resources/${resourceId}`);
      await fetchResources();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return { 
    resources, 
    loading, 
    error: userMessage, 
    uploadResource, 
    approveResource, 
    rejectResource, 
    deleteResource, 
    refresh: fetchResources 
  };
}

export default useProjectResources;
