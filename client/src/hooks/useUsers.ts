import { useState, useEffect, useCallback } from 'react';
import { get } from '../services/api';
import { EmployeeProfile } from '../../../shared/types';
import { useApiError } from './useApiError';

interface UseUsersResult {
  users: EmployeeProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const data = await get<EmployeeProfile[]>('/users');
      setUsers(data);
    } catch (err) {
      handleError(err, fetchUsers);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error: userMessage, refetch: fetchUsers };
}

export default useUsers;
