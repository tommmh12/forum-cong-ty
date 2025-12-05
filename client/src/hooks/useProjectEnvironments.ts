import { useState, useEffect, useCallback } from 'react';
import { ProjectEnvironment } from '../../../shared/types';
import { get, post, put } from '../services/api';
import { useApiError } from './useApiError';

interface DeployData {
  version: string;
  commitHash?: string;
  notes?: string;
}

interface DeploymentReadiness {
  local: { ready: boolean; blockers: string[] };
  staging: { ready: boolean; blockers: string[] };
  production: { ready: boolean; blockers: string[] };
}

export function useProjectEnvironments(projectId: string) {
  const [environments, setEnvironments] = useState<ProjectEnvironment[]>([]);
  const [readiness, setReadiness] = useState<DeploymentReadiness>({
    local: { ready: true, blockers: [] },
    staging: { ready: true, blockers: [] },
    production: { ready: true, blockers: [] },
  });
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchEnvironments = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const [envs, readinessData] = await Promise.all([
        get<ProjectEnvironment[]>(`/projects/${projectId}/environments`),
        get<DeploymentReadiness>(`/projects/${projectId}/environments/deployment-readiness`),
      ]);
      setEnvironments(envs);
      setReadiness(readinessData);
    } catch (err) {
      handleError(err, fetchEnvironments);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const deploy = async (envId: string, data: DeployData) => {
    try {
      const userId = 'current-user-id'; // Get from auth context
      await post(`/projects/${projectId}/environments/${envId}/deploy`, {
        ...data,
        deployedBy: userId,
      });
      await fetchEnvironments();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const rollback = async (envId: string, deploymentId: string) => {
    try {
      const userId = 'current-user-id';
      await post(`/projects/${projectId}/environments/${envId}/rollback`, {
        deploymentId,
        userId,
      });
      await fetchEnvironments();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const updateEnvironment = async (envId: string, data: { url?: string; sslEnabled?: boolean }) => {
    try {
      await put(`/projects/${projectId}/environments/${envId}`, data);
      await fetchEnvironments();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return {
    environments,
    readiness,
    loading,
    error: userMessage,
    deploy,
    rollback,
    updateEnvironment,
    refresh: fetchEnvironments,
  };
}

export default useProjectEnvironments;
