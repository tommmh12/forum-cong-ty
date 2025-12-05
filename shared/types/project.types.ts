export interface Project {
  id: string;
  name: string;
  key: string;
  managerId: string;
  startDate: string;
  endDate: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
  description: string;
  budget: string;
  progress: number;
  workflowId?: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: 'MANAGER' | 'LEADER' | 'MEMBER' | 'VIEWER';
}

export interface TaskColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

export interface CommentMention {
  userId: string;
  userName: string;
  userAvatar: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  updatedAt?: string;
  parentId?: string;
  isDeleted?: boolean;
  replies?: Comment[];
  mentions?: CommentMention[];
}

export type TaskType = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH';

export interface Task {
  id: string;
  code: string;
  projectId: string;
  columnId: string;
  title: string;
  type: TaskType;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  reporterId?: string;
  dueDate: string;
  position: number;
  assigneeName?: string;
  assigneeAvatar?: string;
  tags?: string[];
  checklist?: ChecklistItem[];
  comments?: Comment[];
  attachments?: number;
}
