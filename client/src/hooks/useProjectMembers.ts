import { useState, useEffect, useCallback } from 'react';
import { ProjectMember } from '../../../shared/types';
import { get, post, put, del } from '../services/api';
import { useApiError } from './useApiError';

export interface ProjectMemberWithUser extends ProjectMember {
  userId: string;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  userPosition?: string;
  userDepartment?: string;
}

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const data = await get<ProjectMemberWithUser[]>(`/projects/${projectId}/members`);
      setMembers(data);
    } catch (err) {
      handleError(err, fetchMembers);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    if (projectId) {
      fetchMembers();
    }
  }, [projectId, fetchMembers]);

  const addMember = async (userId: string, role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER' = 'MEMBER') => {
    try {
      await post(`/projects/${projectId}/members`, { userId, role });
      await fetchMembers();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const updateMemberRole = async (userId: string, role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER') => {
    try {
      await put(`/projects/${projectId}/members/${userId}`, { role });
      await fetchMembers();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await del(`/projects/${projectId}/members/${userId}`);
      await fetchMembers();
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return {
    members,
    loading,
    error: userMessage,
    addMember,
    updateMemberRole,
    removeMember,
    refresh: fetchMembers,
  };
}

export default useProjectMembers;

