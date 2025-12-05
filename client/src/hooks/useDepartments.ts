import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { Department } from '../../../shared/types';
import { useApiError } from './useApiError';

export interface DepartmentFormData {
  code: string;
  name: string;
  managerName: string;
  managerAvatar?: string;
  description?: string;
  kpiStatus?: string;
  parentDeptId?: string;
}

interface UseDepartmentsResult {
  departments: Department[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createDepartment: (data: DepartmentFormData) => Promise<Department>;
  updateDepartment: (id: string, data: Partial<DepartmentFormData>) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;
}

export function useDepartments(): UseDepartmentsResult {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const data = await get<Department[]>('/departments');
      setDepartments(data);
    } catch (err) {
      handleError(err, fetchDepartments);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = useCallback(async (data: DepartmentFormData): Promise<Department> => {
    try {
      const newDept = await post<Department>('/departments', data);
      setDepartments(prev => [...prev, newDept]);
      return newDept;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const updateDepartment = useCallback(async (id: string, data: Partial<DepartmentFormData>): Promise<Department> => {
    try {
      const updated = await put<Department>(`/departments/${id}`, data);
      setDepartments(prev => prev.map(d => d.id === id ? updated : d));
      return updated;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  const deleteDepartment = useCallback(async (id: string): Promise<void> => {
    try {
      await del(`/departments/${id}`);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  return { 
    departments, 
    loading, 
    error: userMessage, 
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

export default useDepartments;
