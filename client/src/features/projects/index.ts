// Context
export { ProjectProvider, useProjectContext } from './context/ProjectContext';
export type { 
  CreateProjectInput, 
  UpdateProjectInput, 
  CreateTaskInput, 
  UpdateTaskInput, 
  MoveTaskInput 
} from './context/ProjectContext';

// Shared components (used across all roles)
export { KanbanBoard } from './shared/KanbanBoard';
export { ProjectDetailView } from './shared/ProjectDetailView';
export { ProjectModule } from './shared/ProjectModule';
export { CreateTaskModal } from './shared/CreateTaskModal';
export { TaskDetailModal } from './shared/TaskDetailModal';

// Admin components (admin-only features)
export { TaskSettings } from './admin/TaskSettings';
export { WorkflowDesigner } from './admin/WorkflowDesigner';
