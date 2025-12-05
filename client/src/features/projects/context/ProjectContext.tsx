import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Project, TaskColumn } from '../../../../../shared/types';
import { WebTask, TaskCategory } from '../../../../../shared/types/web-project.types';
import { get, post, put, del } from '../../../services/api';

// ============ Types ============

export interface CreateProjectInput {
  key: string;
  name: string;
  managerId?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  startDate?: string;
  endDate?: string;
  budget?: string;
  description?: string;
  workflowId?: string;
}

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
}

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
}

export interface MoveTaskInput {
  columnId: string;
  position?: number;
}

// ============ Context Interface ============

interface ProjectContextType {
  // Projects State
  projects: Project[];
  projectsLoading: boolean;
  projectsError: string | null;
  
  // Selected Project State
  selectedProject: Project | null;
  selectedProjectId: string | null;
  
  // Tasks & Columns for Selected Project
  tasks: WebTask[];
  columns: TaskColumn[];
  tasksLoading: boolean;
  tasksError: string | null;
  
  // Project Actions
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string | null) => void;
  createProject: (data: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  
  // Task Actions
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<WebTask>;
  updateTask: (taskId: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, data: MoveTaskInput) => Promise<void>;
  
  // Column Actions
  createColumn: (name: string) => Promise<TaskColumn>;
  updateColumn: (columnId: string, name: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
}

// ============ Context ============

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// ============ Provider ============

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  
  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Tasks & Columns State
  const [tasks, setTasks] = useState<WebTask[]>([]);
  const [columns, setColumns] = useState<TaskColumn[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // ============ Project Actions ============

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const data = await get<Project[]>('/projects');
      setProjects(data);
      
      // Auto-select first project if none selected
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
        setSelectedProject(data[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách dự án';
      setProjectsError(message);
    } finally {
      setProjectsLoading(false);
    }
  }, [selectedProjectId]);

  const selectProject = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
    if (projectId) {
      const project = projects.find(p => p.id === projectId) || null;
      setSelectedProject(project);
    } else {
      setSelectedProject(null);
      setTasks([]);
      setColumns([]);
    }
  }, [projects]);

  const createProject = useCallback(async (data: CreateProjectInput): Promise<Project> => {
    try {
      const newProject = await post<Project>('/projects', data);
      await fetchProjects();
      return newProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo dự án';
      throw new Error(message);
    }
  }, [fetchProjects]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectInput): Promise<Project> => {
    try {
      const updatedProject = await put<Project>(`/projects/${id}`, data);
      await fetchProjects();
      return updatedProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật dự án';
      throw new Error(message);
    }
  }, [fetchProjects]);

  const deleteProjectAction = useCallback(async (id: string): Promise<void> => {
    try {
      await del<{ message: string }>(`/projects/${id}`);
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setSelectedProject(null);
      }
      await fetchProjects();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa dự án';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchProjects]);

  // ============ Task Actions ============

  const fetchTasks = useCallback(async () => {
    if (!selectedProjectId) {
      setTasks([]);
      setColumns([]);
      return;
    }
    
    setTasksLoading(true);
    setTasksError(null);
    try {
      const [tasksData, columnsData] = await Promise.all([
        get<WebTask[]>(`/projects/${selectedProjectId}/tasks`),
        get<TaskColumn[]>(`/projects/${selectedProjectId}/columns`),
      ]);
      setTasks(tasksData);
      setColumns(columnsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải tasks';
      setTasksError(message);
    } finally {
      setTasksLoading(false);
    }
  }, [selectedProjectId]);

  const createTask = useCallback(async (data: CreateTaskInput): Promise<WebTask> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      const newTask = await post<WebTask>(`/projects/${selectedProjectId}/tasks`, data);
      await fetchTasks();
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo task';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, data: UpdateTaskInput): Promise<void> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      await put<{ message: string }>(`/projects/${selectedProjectId}/tasks/${taskId}`, data);
      await fetchTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật task';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  const deleteTaskAction = useCallback(async (taskId: string): Promise<void> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      await del<{ message: string }>(`/projects/${selectedProjectId}/tasks/${taskId}`);
      await fetchTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa task';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  const moveTask = useCallback(async (taskId: string, data: MoveTaskInput): Promise<void> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      await put<{ message: string }>(`/projects/${selectedProjectId}/tasks/${taskId}/move`, data);
      await fetchTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể di chuyển task';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  // ============ Column Actions ============

  const createColumn = useCallback(async (name: string): Promise<TaskColumn> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      const newColumn = await post<TaskColumn>(`/projects/${selectedProjectId}/columns`, { name });
      await fetchTasks();
      return newColumn;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo column';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  const updateColumn = useCallback(async (columnId: string, name: string): Promise<void> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      await put<{ message: string }>(`/projects/${selectedProjectId}/columns/${columnId}`, { name });
      await fetchTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật column';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  const deleteColumn = useCallback(async (columnId: string): Promise<void> => {
    if (!selectedProjectId) throw new Error('Chưa chọn dự án');
    try {
      await del<{ message: string }>(`/projects/${selectedProjectId}/columns/${columnId}`);
      await fetchTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa column';
      throw new Error(message);
    }
  }, [selectedProjectId, fetchTasks]);

  // ============ Effects ============

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch tasks when selected project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks();
    }
  }, [selectedProjectId, fetchTasks]);

  // Update selectedProject when projects list changes
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId) || null;
      setSelectedProject(project);
    }
  }, [projects, selectedProjectId]);

  // ============ Context Value ============

  const value: ProjectContextType = {
    // Projects State
    projects,
    projectsLoading,
    projectsError,
    
    // Selected Project State
    selectedProject,
    selectedProjectId,
    
    // Tasks & Columns
    tasks,
    columns,
    tasksLoading,
    tasksError,
    
    // Project Actions
    fetchProjects,
    selectProject,
    createProject,
    updateProject,
    deleteProject: deleteProjectAction,
    
    // Task Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask: deleteTaskAction,
    moveTask,
    
    // Column Actions
    createColumn,
    updateColumn,
    deleteColumn,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// ============ Hook ============

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;

