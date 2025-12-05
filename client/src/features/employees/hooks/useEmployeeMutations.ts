import { useState, useCallback } from 'react';
import { post, put, del, fetchAPI } from '../../../services/api';
import { Employee, EmployeeFormData } from '../../../../../shared/types';

/**
 * Response from avatar upload endpoint
 */
interface AvatarUploadResponse {
  avatarUrl: string;
}

/**
 * Result interface for the useEmployeeMutations hook
 * Requirements: 4.2, 5.4
 */
export interface UseEmployeeMutationsResult {
  createEmployee: (data: EmployeeFormData) => Promise<Employee>;
  updateEmployee: (id: string, data: EmployeeFormData) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for employee CRUD mutations
 * 
 * Requirements:
 * - 4.2: Create new employee and refresh data table
 * - 5.4: Soft delete by setting status to Terminated
 * 
 * @returns UseEmployeeMutationsResult with mutation functions and state
 */
export function useEmployeeMutations(): UseEmployeeMutationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Create a new employee
   * Requirement 4.2: Create new Employee_Record
   */
  const createEmployee = useCallback(async (data: EmployeeFormData): Promise<Employee> => {
    setLoading(true);
    setError(null);
    
    try {
      const employee = await post<Employee>('/employees', data);
      return employee;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create employee');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);


  /**
   * Update an existing employee
   * Requirement 5.2: Edit employee data
   */
  const updateEmployee = useCallback(async (id: string, data: EmployeeFormData): Promise<Employee> => {
    setLoading(true);
    setError(null);
    
    try {
      const employee = await put<Employee>(`/employees/${id}`, data);
      return employee;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update employee');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Soft delete an employee (sets status to Terminated)
   * Requirement 5.4: Perform Soft_Delete by setting status to Terminated
   */
  const deleteEmployee = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await del<void>(`/employees/${id}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete employee');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload avatar image file
   * Requirement 4.6: Upload file and return avatarUrl
   * Note: Field name must be 'avatar' to match server's upload.single('avatar')
   */
  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file); // Must match server's upload.single('avatar')
      
      // Use fetchAPI directly for multipart/form-data
      // Don't set Content-Type header - browser will set it with boundary for FormData
      const response = await fetchAPI<AvatarUploadResponse>('/employees/avatar', {
        method: 'POST',
        body: formData,
      });
      
      return response.avatarUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload avatar');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    uploadAvatar,
    loading,
    error,
  };
}

export default useEmployeeMutations;
