import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { TaskColumn } from '../../../shared/types';
import { useApiError } from './useApiError';

/**
 * Input data for creating a new column
 */
export interface CreateColumnInput {
  name: string;
}

/**
 * Input data for updating an existing column
 */
export interface UpdateColumnInput {
  name: string;
}

interface UseTaskColumnsResult {
  columns: TaskColumn[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createColumn: (data: CreateColumnInput) => Promise<TaskColumn>;
  updateColumn: (columnId: string, data: UpdateColumnInput) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
}

/**
 * Hook for managing task columns for a project
 * Fetches columns from API and provides CRUD operations
 * 
 * @param projectId - The ID of the project to fetch columns for
 * @returns Columns, loading state, error state, and CRUD operations
 */
export function useTaskColumns(projectId: string): UseTaskColumnsResult {
  const [columns, setColumns] = useState<TaskColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  /**
   * Fetch columns from API
   * GET /api/projects/:id/columns
   */
  const fetchColumns = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    clearError();
    try {
      const columnsData = await get<TaskColumn[]>(`/projects/${projectId}/columns`);
      setColumns(columnsData);
    } catch (err) {
      handleError(err, fetchColumns);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  /**
   * Create a new column
   * POST /api/projects/:id/columns
   */
  const createColumn = useCallback(async (data: CreateColumnInput): Promise<TaskColumn> => {
    try {
      const newColumn = await post<TaskColumn>(`/projects/${projectId}/columns`, data);
      // Refetch to update the list
      await fetchColumns();
      return newColumn;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchColumns, handleError]);

  /**
   * Update an existing column
   * PUT /api/projects/:id/columns/:columnId
   */
  const updateColumn = useCallback(async (columnId: string, data: UpdateColumnInput): Promise<void> => {
    try {
      await put<{ message: string }>(`/projects/${projectId}/columns/${columnId}`, data);
      // Refetch to update the list
      await fetchColumns();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchColumns, handleError]);

  /**
   * Delete a column
   * DELETE /api/projects/:id/columns/:columnId
   */
  const deleteColumn = useCallback(async (columnId: string): Promise<void> => {
    try {
      await del<{ message: string }>(`/projects/${projectId}/columns/${columnId}`);
      // Refetch to update the list
      await fetchColumns();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchColumns, handleError]);

  return { 
    columns, 
    loading, 
    error: userMessage, 
    refetch: fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
  };
}

export default useTaskColumns;
