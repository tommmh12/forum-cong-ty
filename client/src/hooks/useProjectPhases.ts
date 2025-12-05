import { useState, useEffect, useCallback } from 'react';
import { ProjectPhase, PhaseType } from '../../../shared/types';
import { get, post, put } from '../services/api';
import { useApiError, ApiError, getUserFriendlyMessage } from './useApiError';

interface PhaseTransitionResult {
  canTransition: boolean;
  missingRequirements: string[];
}

export function useProjectPhases(projectId: string) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [canTransition, setCanTransition] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchPhases = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const [phasesData, transitionData] = await Promise.all([
        get<ProjectPhase[]>(`/projects/${projectId}/phases`),
        get<PhaseTransitionResult>(`/projects/${projectId}/phases/can-transition`),
      ]);
      setPhases(phasesData);
      setCanTransition(transitionData.canTransition);
      setMissingRequirements(transitionData.missingRequirements);
    } catch (err) {
      handleError(err, fetchPhases);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const transitionPhase = async () => {
    try {
      await post(`/projects/${projectId}/phases/transition`, {});
      await fetchPhases();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const blockPhase = async (phaseId: string, reason: string) => {
    try {
      await put(`/projects/${projectId}/phases/${phaseId}/block`, { reason });
      await fetchPhases();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const unblockPhase = async (phaseId: string) => {
    try {
      await put(`/projects/${projectId}/phases/${phaseId}/unblock`, {});
      await fetchPhases();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return { 
    phases, 
    canTransition, 
    missingRequirements, 
    loading, 
    error: userMessage, 
    transitionPhase, 
    blockPhase, 
    unblockPhase, 
    refresh: fetchPhases 
  };
}

export default useProjectPhases;
