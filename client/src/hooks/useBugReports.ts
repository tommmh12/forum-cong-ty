import { useState, useEffect, useCallback } from 'react';
import { BugReport, BugStatus, BugSeverity, EnvironmentType } from '../../../shared/types';
import { get, post, put } from '../services/api';
import { useApiError } from './useApiError';

interface CreateBugData {
  title: string;
  description?: string;
  severity: BugSeverity;
  environment: EnvironmentType;
  reproductionSteps: string;
}

interface BugStats {
  bugs: { total: number; open: number; inProgress: number; resolved: number; critical: number; high: number };
  resolutionRate: number;
  criticalBugCount: number;
}

export function useBugReports(projectId: string) {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [stats, setStats] = useState<BugStats>({
    bugs: { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, high: 0 },
    resolutionRate: 0,
    criticalBugCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const [bugsData, statsData] = await Promise.all([
        get<BugReport[]>(`/projects/${projectId}/bugs`),
        get<BugStats>(`/projects/${projectId}/bugs/stats`),
      ]);
      setBugs(bugsData);
      setStats(statsData);
    } catch (err) {
      handleError(err, fetchBugs);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const createBug = async (data: CreateBugData) => {
    try {
      const reportedBy = 'current-user-id';
      await post(`/projects/${projectId}/bugs`, { ...data, reportedBy });
      await fetchBugs();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const updateStatus = async (bugId: string, status: BugStatus) => {
    try {
      await put(`/projects/${projectId}/bugs/${bugId}/status`, { status });
      await fetchBugs();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const assignBug = async (bugId: string, assignedTo: string) => {
    try {
      await put(`/projects/${projectId}/bugs/${bugId}/assign`, { assignedTo });
      await fetchBugs();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return { 
    bugs, 
    stats, 
    loading, 
    error: userMessage, 
    createBug, 
    updateStatus, 
    assignBug, 
    refresh: fetchBugs 
  };
}

export default useBugReports;
