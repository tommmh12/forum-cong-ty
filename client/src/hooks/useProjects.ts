import { useState, useEffect, useCallback } from 'react';
import { get, post, put, del } from '../services/api';
import { Project, Task, TaskColumn } from '../../../shared/types';
import { useApiError } from './useApiError';

/**
 * Input data for creating a new project
 */
export interface CreateProjectInput {
  key: string;
  name: string;
  managerId?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  startDate?: string;
  endDate?: string;
  budget?: string;
  description?: string;
}

/**
 * Input data for updating an existing project
 */
export interface UpdateProjectInput {
  key?: string;
  name?: string;
  managerId?: string;
  progress?: number;
  status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  startDate?: string;
  endDate?: string;
  budget?: string;
  description?: string;
}

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    clearError();
    try {
      const data = await get<Project[]>('/projects');
      setProjects(data);
    } catch (err) {
      handleError(err, fetchProjects);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  /**
   * Create a new project
   * POST /api/projects
   */
  const createProject = useCallback(async (data: CreateProjectInput): Promise<Project> => {
    try {
      const newProject = await post<Project>('/projects', data);
      // Refetch to update the list
      await fetchProjects();
      return newProject;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [fetchProjects, handleError]);

  /**
   * Update an existing project
   * PUT /api/projects/:id
   */
  const updateProject = useCallback(async (id: string, data: UpdateProjectInput): Promise<Project> => {
    try {
      const updatedProject = await put<Project>(`/projects/${id}`, data);
      // Refetch to update the list
      await fetchProjects();
      return updatedProject;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [fetchProjects, handleError]);

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      await del<{ message: string }>(`/projects/${id}`);
      // Refetch to update the list
      await fetchProjects();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [fetchProjects, handleError]);

  return { 
    projects, 
    loading, 
    error: userMessage, 
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

interface UseProjectTasksResult {
  tasks: Task[];
  columns: TaskColumn[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProjectTasks(projectId: string): UseProjectTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<TaskColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, userMessage, handleError, clearError } = useApiError({ maxRetries: 2 });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    clearError();
    try {
      const [tasksData, columnsData] = await Promise.all([
        get<Task[]>(`/projects/${projectId}/tasks`),
        get<TaskColumn[]>(`/projects/${projectId}/columns`),
      ]);
      setTasks(tasksData);
      setColumns(columnsData);
    } catch (err) {
      handleError(err, fetchData);
    } finally {
      setLoading(false);
    }
  }, [projectId, clearError, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tasks, columns, loading, error: userMessage, refetch: fetchData };
}

export default useProjects;
