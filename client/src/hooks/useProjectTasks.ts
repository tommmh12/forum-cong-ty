import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { TaskColumn } from '../../../shared/types';
import { WebTask, TaskCategory } from '../../../shared/types/web-project.types';
import { useApiError } from './useApiError';

/**
 * Input data for creating a new task
 */
export interface CreateTaskInput {
  columnId: string;
  title: string;
  type?: 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  reporterId?: string;
  dueDate?: string;
  description?: string;
  category?: TaskCategory;
  tags?: string[];
  checklist?: { title: string }[];
}

/**
 * Input data for updating an existing task
 */
export interface UpdateTaskInput {
  columnId?: string;
  title?: string;
  type?: 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string | null;
  reporterId?: string | null;
  dueDate?: string | null;
  description?: string | null;
  position?: number;
  category?: TaskCategory;
  tags?: string[];
}

/**
 * Input data for moving a task
 */
export interface MoveTaskInput {
  columnId: string;
  position?: number;
}

interface UseProjectTasksResult {
  tasks: WebTask[];
  columns: TaskColumn[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<WebTask[]>;
  createTask: (data: CreateTaskInput) => Promise<WebTask>;
  updateTask: (taskId: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, data: MoveTaskInput) => Promise<void>;
  addChecklistItem: (taskId: string, title: string) => Promise<void>;
  updateChecklistItem: (taskId: string, itemId: string, updates: { title?: string; isCompleted?: boolean }) => Promise<void>;
  deleteChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  addComment: (taskId: string, content: string, mentionedUserIds?: string[], parentId?: string) => Promise<void>;
  updateComment: (taskId: string, commentId: string, text: string) => Promise<void>;
  deleteComment: (taskId: string, commentId: string) => Promise<void>;
}

/**
 * Hook for managing project tasks
 * Fetches tasks and columns from API and provides CRUD operations
 * 
 * @param projectId - The ID of the project to fetch tasks for
 * @returns Tasks, columns, loading state, error state, and CRUD operations
 */
export function useProjectTasks(projectId: string): UseProjectTasksResult {
  const [tasks, setTasks] = useState<WebTask[]>([]);
  const [columns, setColumns] = useState<TaskColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  /**
   * Fetch tasks and columns from API
   * GET /api/projects/:id/tasks
   * GET /api/projects/:id/columns
   */
  const fetchData = useCallback(async (): Promise<WebTask[]> => {
    if (!projectId) return [];
    setLoading(true);
    clearError();
    try {
      const [tasksData, columnsData] = await Promise.all([
        get<WebTask[]>(`/projects/${projectId}/tasks`),
        get<TaskColumn[]>(`/projects/${projectId}/columns`),
      ]);
      setTasks(tasksData);
      setColumns(columnsData);
      return tasksData;
    } catch (err) {
      handleError(err, fetchData);
      return [];
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Create a new task
   * POST /api/projects/:id/tasks
   */
  const createTask = useCallback(async (data: CreateTaskInput): Promise<WebTask> => {
    try {
      const newTask = await post<WebTask>(`/projects/${projectId}/tasks`, data);
      // Refetch to update the list
      await fetchData();
      return newTask;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Update an existing task
   * PUT /api/projects/:id/tasks/:taskId
   */
  const updateTask = useCallback(async (taskId: string, data: UpdateTaskInput): Promise<void> => {
    try {
      await put<{ message: string }>(`/projects/${projectId}/tasks/${taskId}`, data);
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Delete a task
   * DELETE /api/projects/:id/tasks/:taskId
   */
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await del<{ message: string }>(`/projects/${projectId}/tasks/${taskId}`);
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Move a task to another column
   * PUT /api/projects/:id/tasks/:taskId/move
   */
  const moveTask = useCallback(async (taskId: string, data: MoveTaskInput): Promise<void> => {
    try {
      await put<{ message: string }>(`/projects/${projectId}/tasks/${taskId}/move`, data);
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Add a checklist item to a task
   * POST /api/projects/:id/tasks/:taskId/checklist
   */
  const addChecklistItem = useCallback(async (taskId: string, title: string): Promise<void> => {
    try {
      await post<{ id: string }>(`/projects/${projectId}/tasks/${taskId}/checklist`, { title });
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Update a checklist item
   * PUT /api/projects/:id/tasks/:taskId/checklist/:itemId
   */
  const updateChecklistItem = useCallback(async (
    taskId: string,
    itemId: string,
    updates: { title?: string; isCompleted?: boolean }
  ): Promise<void> => {
    try {
      await put<{ id: string }>(`/projects/${projectId}/tasks/${taskId}/checklist/${itemId}`, updates);
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Delete a checklist item
   * DELETE /api/projects/:id/tasks/:taskId/checklist/:itemId
   */
  const deleteChecklistItem = useCallback(async (taskId: string, itemId: string): Promise<void> => {
    try {
      await del<{ message: string }>(`/projects/${projectId}/tasks/${taskId}/checklist/${itemId}`);
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Add a comment to a task
   * POST /api/projects/:id/tasks/:taskId/comments
   */
  const addComment = useCallback(async (taskId: string, content: string, mentionedUserIds?: string[], parentId?: string): Promise<void> => {
    try {
      console.log(`[useProjectTasks] Adding comment to task ${taskId}, parentId=${parentId || 'null'}`);
      const response = await post<{ id: string }>(`/projects/${projectId}/tasks/${taskId}/comments`, { content, mentionedUserIds, parentId });
      console.log(`[useProjectTasks] Comment added successfully:`, response);
      // Refetch to update the list
      console.log(`[useProjectTasks] Refetching tasks...`);
      await fetchData();
      console.log(`[useProjectTasks] Tasks refetched successfully`);
    } catch (err) {
      console.error(`[useProjectTasks] Error adding comment:`, err);
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Update a comment
   * PUT /api/projects/:id/tasks/:taskId/comments/:commentId
   */
  const updateComment = useCallback(async (taskId: string, commentId: string, text: string): Promise<void> => {
    try {
      await put<{ id: string }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { text });
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  /**
   * Delete a comment
   * DELETE /api/projects/:id/tasks/:taskId/comments/:commentId
   */
  const deleteComment = useCallback(async (taskId: string, commentId: string): Promise<void> => {
    try {
      await del<{ message: string }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
      // Refetch to update the list
      await fetchData();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [projectId, fetchData, handleError]);

  return { 
    tasks, 
    columns, 
    loading, 
    error: userMessage, 
    refetch: fetchData,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    addComment,
    updateComment,
    deleteComment,
  };
}

export default useProjectTasks;
