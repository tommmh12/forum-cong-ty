import { query } from '../config/database';
import { Project, Task, TaskColumn, ChecklistItem, Comment } from '../../../shared/types';
import { TaskCategory, WebTask } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Project Repository
export interface ProjectRow {
  id: string;
  project_key: string;
  name: string;
  manager_id: string;
  progress: number;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  start_date: string;
  end_date: string;
  budget: string;
  description: string;
  workflow_id?: string | null;
}

function mapRowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    key: row.project_key,
    name: row.name,
    managerId: row.manager_id,
    progress: row.progress,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    budget: row.budget,
    description: row.description,
    workflowId: row.workflow_id || undefined,
  };
}

export async function findAllProjects(): Promise<Project[]> {
  const rows = await query<ProjectRow[]>('SELECT * FROM projects');
  return rows.map(mapRowToProject);
}

export async function findProjectById(id: string): Promise<Project | null> {
  const rows = await query<ProjectRow[]>('SELECT * FROM projects WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRowToProject(rows[0]);
}

/**
 * Create a new project
 */
export async function createProject(data: {
  key: string;
  name: string;
  managerId?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  startDate?: string;
  endDate?: string;
  budget?: string;
  description?: string;
  workflowId?: string;
}): Promise<Project> {
  const id = uuidv4();
  
  // If no workflowId provided, get default workflow
  let workflowId = data.workflowId;
  if (!workflowId) {
    try {
      const { findDefaultWorkflow } = await import('./workflow.repository');
      const defaultWorkflow = await findDefaultWorkflow();
      if (defaultWorkflow) {
        workflowId = defaultWorkflow.id;
      }
    } catch (error) {
      logger.warn('Could not get default workflow:', error);
    }
  }
  
  await query(
    `INSERT INTO projects (id, project_key, name, manager_id, progress, status, start_date, end_date, budget, description, workflow_id)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.key,
      data.name,
      data.managerId || null,
      data.status || 'PLANNING',
      data.startDate || null,
      data.endDate || null,
      data.budget || null,
      data.description || null,
      workflowId || null,
    ]
  );
  
  // Initialize default task columns
  await initializeDefaultColumns(id);
  
  // Initialize phases and environments (if web project tables exist)
  try {
    const { initializeProjectPhases, initializeProjectEnvironments } = await import('../database/web-project-schema');
    await initializeProjectPhases(id);
    await initializeProjectEnvironments(id);
  } catch (error) {
      logger.warn('Could not initialize phases/environments:', error);
  }
  
  const project = await findProjectById(id);
  if (!project) throw new Error('Failed to create project');
  return project;
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  data: Partial<{
    key: string;
    name: string;
    managerId: string;
    progress: number;
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
    startDate: string;
    endDate: string;
    budget: string;
    description: string;
  }>
): Promise<Project | null> {
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.key !== undefined) { updates.push('project_key = ?'); params.push(data.key); }
  if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
  if (data.managerId !== undefined) { updates.push('manager_id = ?'); params.push(data.managerId); }
  if (data.progress !== undefined) { updates.push('progress = ?'); params.push(data.progress); }
  if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
  if (data.startDate !== undefined) { updates.push('start_date = ?'); params.push(data.startDate); }
  if (data.endDate !== undefined) { updates.push('end_date = ?'); params.push(data.endDate); }
  if (data.budget !== undefined) { updates.push('budget = ?'); params.push(data.budget); }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
  
  if (updates.length === 0) return findProjectById(id);
  
  params.push(id);
  await query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params);
  
  return findProjectById(id);
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  const result = await query<any>('DELETE FROM projects WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Task Column Repository
export interface TaskColumnRow {
  id: string;
  project_id: string;
  name: string;
  position: number;
}

export async function findTaskColumnsByProjectId(projectId: string): Promise<TaskColumn[]> {
  const rows = await query<TaskColumnRow[]>(
    'SELECT * FROM task_columns WHERE project_id = ? ORDER BY position',
    [projectId]
  );
  return rows.map(row => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    position: row.position,
  }));
}

/**
 * Create a new task column
 */
export async function createTaskColumn(projectId: string, name: string): Promise<TaskColumn> {
  const id = uuidv4();
  
  // Get max position
  const rows = await query<{ maxPos: number }[]>(
    'SELECT MAX(position) as maxPos FROM task_columns WHERE project_id = ?',
    [projectId]
  );
  const position = (rows[0]?.maxPos || 0) + 1;
  
  await query(
    'INSERT INTO task_columns (id, project_id, name, position) VALUES (?, ?, ?, ?)',
    [id, projectId, name, position]
  );
  
  return { id, projectId, name, position };
}

/**
 * Update a task column
 */
export async function updateTaskColumn(columnId: string, name: string): Promise<boolean> {
  const result = await query<any>('UPDATE task_columns SET name = ? WHERE id = ?', [name, columnId]);
  return result.affectedRows > 0;
}

/**
 * Delete a task column
 */
export async function deleteTaskColumn(columnId: string): Promise<boolean> {
  const result = await query<any>('DELETE FROM task_columns WHERE id = ?', [columnId]);
  return result.affectedRows > 0;
}

/**
 * Initialize default columns for a new project
 */
export async function initializeDefaultColumns(projectId: string): Promise<TaskColumn[]> {
  const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
  const columns: TaskColumn[] = [];
  
  for (let i = 0; i < defaultColumns.length; i++) {
    const id = uuidv4();
    await query(
      'INSERT INTO task_columns (id, project_id, name, position) VALUES (?, ?, ?, ?)',
      [id, projectId, defaultColumns[i], i + 1]
    );
    columns.push({ id, projectId, name: defaultColumns[i], position: i + 1 });
  }
  
  return columns;
}

// Task Repository
export interface TaskRow {
  id: string;
  code: string;
  project_id: string;
  column_id: string;
  title: string;
  type: 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string;
  description: string;
  position: number;
  attachments: number;
}

export interface TaskTagRow {
  id: string;
  task_id: string;
  tag: string;
}

export interface ChecklistItemRow {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean | number; // MySQL returns TINYINT (0/1) but TypeScript expects boolean
  position: number;
}

export interface CommentRow {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  parent_id: string | null;
  is_deleted: boolean | number;
  created_at: string;
  updated_at: string | null;
}

export async function findTasksByProjectId(projectId: string): Promise<Task[]> {
  const tasks = await query<TaskRow[]>(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY position',
    [projectId]
  );
  
  const taskIds = tasks.map(t => t.id);
  if (taskIds.length === 0) return [];
  
  // Get tags, checklists, and comments for all tasks
  const tags = await query<TaskTagRow[]>(
    `SELECT * FROM task_tags WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
    taskIds
  );
  
  const checklists = await query<ChecklistItemRow[]>(
    `SELECT * FROM checklist_items WHERE task_id IN (${taskIds.map(() => '?').join(',')}) ORDER BY position`,
    taskIds
  );
  
  const comments = await query<CommentRow[]>(
    `SELECT c.*, u.full_name as user_name, u.avatar_url as user_avatar 
     FROM comments c 
     LEFT JOIN users u ON c.user_id = u.id 
     WHERE c.task_id IN (${taskIds.map(() => '?').join(',')})
     ORDER BY c.created_at`,
    taskIds
  );
  
  // Get mentions for all comments
  const commentIds = comments.map(c => c.id);
  const mentions = commentIds.length > 0 ? await query<any[]>(
    `SELECT cm.comment_id, cm.mentioned_user_id, u.full_name as user_name, u.avatar_url as user_avatar
     FROM comment_mentions cm
     JOIN users u ON cm.mentioned_user_id = u.id
     WHERE cm.comment_id IN (${commentIds.map(() => '?').join(',')})`,
    commentIds
  ) as any : [];
  
  const mentionsByCommentId = new Map<string, any[]>();
  for (const mention of mentions) {
    if (!mentionsByCommentId.has(mention.comment_id)) {
      mentionsByCommentId.set(mention.comment_id, []);
    }
    mentionsByCommentId.get(mention.comment_id)!.push({
      userId: mention.mentioned_user_id,
      userName: mention.user_name || 'Unknown',
      userAvatar: mention.user_avatar || '',
    });
  }
  
  // Get only users referenced by tasks (assignee_id and reporter_id) - avoids loading all users
  const userIds = new Set<string>();
  for (const task of tasks) {
    if (task.assignee_id) userIds.add(task.assignee_id);
    if (task.reporter_id) userIds.add(task.reporter_id);
  }
  
  let userMap = new Map<string, { id: string; full_name: string; avatar_url: string }>();
  if (userIds.size > 0) {
    const userIdArray = Array.from(userIds);
    const users = await query<{ id: string; full_name: string; avatar_url: string }[]>(
      `SELECT id, full_name, avatar_url FROM users WHERE id IN (${userIdArray.map(() => '?').join(',')})`,
      userIdArray
    );
    userMap = new Map(users.map(u => [u.id, u]));
  }
  
  return tasks.map(task => {
    const assignee = task.assignee_id ? userMap.get(task.assignee_id) : null;
    const taskTags = tags.filter(t => t.task_id === task.id).map(t => t.tag);
    const taskChecklist = checklists
      .filter(c => c.task_id === task.id)
      .map(c => ({
        id: c.id,
        taskId: c.task_id,
        title: c.title,
        isCompleted: c.is_completed === 1 || c.is_completed === true,
        position: c.position,
      }));
    const taskComments = comments
      .filter(c => c.task_id === task.id)
      .map(c => {
        const commentMentions = mentionsByCommentId.get(c.id) || [];
        return {
          id: c.id,
          userId: c.user_id,
          userName: (c as any).user_name || 'Unknown',
          userAvatar: (c as any).user_avatar || '',
          text: c.text,
          timestamp: c.created_at,
          updatedAt: c.updated_at || undefined,
          parentId: c.parent_id || undefined,
          isDeleted: c.is_deleted === 1 || c.is_deleted === true,
          mentions: commentMentions.length > 0 ? commentMentions : undefined,
        };
      });
    
    return {
      id: task.id,
      code: task.code,
      projectId: task.project_id,
      columnId: task.column_id,
      title: task.title,
      type: task.type,
      priority: task.priority,
      assigneeId: task.assignee_id || undefined,
      reporterId: task.reporter_id || undefined,
      dueDate: task.due_date,
      description: task.description,
      position: task.position,
      assigneeName: assignee?.full_name,
      assigneeAvatar: assignee?.avatar_url,
      tags: taskTags,
      checklist: taskChecklist,
      comments: taskComments,
      attachments: task.attachments,
    };
  });
}

/**
 * Create a new task
 */
export async function createTask(data: {
  projectId: string;
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
}): Promise<WebTask> {
  const id = uuidv4();
  
  // Generate task code
  const [projectRows] = await query<any[]>('SELECT project_key FROM projects WHERE id = ?', [data.projectId]) as any;
  const projectKey = projectRows[0]?.project_key || 'TASK';
  const [countRows] = await query<any[]>('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?', [data.projectId]) as any;
  const taskNumber = (countRows[0]?.count || 0) + 1;
  const code = `${projectKey}-${taskNumber.toString().padStart(3, '0')}`;
  
  // Get max position in column
  const [posRows] = await query<any[]>('SELECT MAX(position) as maxPos FROM tasks WHERE column_id = ?', [data.columnId]) as any;
  const position = (posRows[0]?.maxPos || 0) + 1;
  
  await query(
    `INSERT INTO tasks (id, code, project_id, column_id, title, type, priority, assignee_id, reporter_id, due_date, description, position, attachments, category)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      code,
      data.projectId,
      data.columnId,
      data.title,
      data.type || 'FEATURE',
      data.priority || 'MEDIUM',
      data.assigneeId || null,
      data.reporterId || null,
      data.dueDate || null,
      data.description || null,
      position,
      data.category || 'FRONTEND',
    ]
  );
  
  // Insert tags if provided
  if (data.tags && data.tags.length > 0) {
    for (const tag of data.tags) {
      const tagId = uuidv4();
      await query(
        'INSERT INTO task_tags (id, task_id, tag) VALUES (?, ?, ?)',
        [tagId, id, tag]
      );
    }
  }
  
  // Insert checklist items if provided
  if (data.checklist && data.checklist.length > 0) {
    for (let i = 0; i < data.checklist.length; i++) {
      const item = data.checklist[i];
      const itemId = uuidv4();
      await query(
        'INSERT INTO checklist_items (id, task_id, title, is_completed, position) VALUES (?, ?, ?, FALSE, ?)',
        [itemId, id, item.title, i + 1]
      );
    }
  }
  
  const tasks = await findWebTasksByProjectId(data.projectId);
  const task = tasks.find(t => t.id === id);
  if (!task) throw new Error('Failed to create task');
  return task;
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  data: Partial<{
    columnId: string;
    title: string;
    type: 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'RESEARCH';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assigneeId: string | null;
    reporterId: string | null;
    dueDate: string | null;
    description: string | null;
    position: number;
    category: TaskCategory;
    tags?: string[];
  }>
): Promise<boolean> {
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.columnId !== undefined) { updates.push('column_id = ?'); params.push(data.columnId); }
  if (data.title !== undefined) { updates.push('title = ?'); params.push(data.title); }
  if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type); }
  if (data.priority !== undefined) { updates.push('priority = ?'); params.push(data.priority); }
  if (data.assigneeId !== undefined) { updates.push('assignee_id = ?'); params.push(data.assigneeId); }
  if (data.reporterId !== undefined) { updates.push('reporter_id = ?'); params.push(data.reporterId); }
  if (data.dueDate !== undefined) { updates.push('due_date = ?'); params.push(data.dueDate); }
  if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
  if (data.position !== undefined) { updates.push('position = ?'); params.push(data.position); }
  if (data.category !== undefined) { updates.push('category = ?'); params.push(data.category); }
  
  if (updates.length > 0) {
    params.push(taskId);
    const result = await query<any>(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return false;
  }
  
  // Update tags if provided
  if (data.tags !== undefined) {
    // Delete existing tags
    await query('DELETE FROM task_tags WHERE task_id = ?', [taskId]);
    
    // Insert new tags
    if (data.tags.length > 0) {
      for (const tag of data.tags) {
        const tagId = uuidv4();
        await query(
          'INSERT INTO task_tags (id, task_id, tag) VALUES (?, ?, ?)',
          [tagId, taskId, tag]
        );
      }
    }
  }
  
  return true;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const result = await query<any>('DELETE FROM tasks WHERE id = ?', [taskId]);
  return result.affectedRows > 0;
}

/**
 * Move task to another column
 */
export async function moveTask(taskId: string, columnId: string, position: number): Promise<boolean> {
  const result = await query<any>(
    'UPDATE tasks SET column_id = ?, position = ? WHERE id = ?',
    [columnId, position, taskId]
  );
  return result.affectedRows > 0;
}

export default {
  findAllProjects,
  findProjectById,
  createProject,
  updateProject,
  deleteProject,
  findTaskColumnsByProjectId,
  createTaskColumn,
  updateTaskColumn,
  deleteTaskColumn,
  initializeDefaultColumns,
  findTasksByProjectId,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
};


// ============ Web Task Extensions ============

// Extended Task Row with category
export interface WebTaskRow extends TaskRow {
  category: TaskCategory | null;
  commit_reference: string | null;
}

// Task Dependency Row
export interface TaskDependencyRow {
  id: string;
  task_id: string;
  depends_on_task_id: string;
}

/**
 * Find tasks by project with category and dependencies (WebTask)
 */
export async function findWebTasksByProjectId(projectId: string): Promise<WebTask[]> {
  try {
    const tasks = await query<WebTaskRow[]>(
      'SELECT * FROM tasks WHERE project_id = ? ORDER BY position',
      [projectId]
    );
    
    const taskIds = tasks.map(t => t.id);
    if (taskIds.length === 0) return [];
    
    // Get tags, checklists, and dependencies
    let tags: TaskTagRow[] = [];
    try {
      if (taskIds.length > 0) {
        tags = await query<TaskTagRow[]>(
          `SELECT * FROM task_tags WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
          taskIds
        );
      }
    } catch (error) {
      logger.warn('Task tags table might not exist:', error);
      tags = [];
    }
    
    let checklists: ChecklistItemRow[] = [];
    try {
      if (taskIds.length > 0) {
        checklists = await query<ChecklistItemRow[]>(
          `SELECT * FROM checklist_items WHERE task_id IN (${taskIds.map(() => '?').join(',')}) ORDER BY position`,
          taskIds
        );
      }
    } catch (error) {
      logger.warn('Checklist items table might not exist:', error);
      checklists = [];
    }
    
    // Get comments with user info (use LEFT JOIN to handle missing users)
    let comments: CommentRow[] = [];
    try {
      if (taskIds.length > 0) {
        comments = await query<CommentRow[]>(
          `SELECT c.*, u.full_name as user_name, u.avatar_url as user_avatar 
           FROM comments c 
           LEFT JOIN users u ON c.user_id = u.id 
           WHERE c.task_id IN (${taskIds.map(() => '?').join(',')})
           ORDER BY c.created_at`,
          taskIds
        );
      }
    } catch (error) {
      // Comments table might not exist yet, ignore error
      logger.warn('Comments table might not exist:', error);
      comments = [];
    }
    
    // Get mentions for all comments (use LEFT JOIN to handle missing users)
    const commentIds = comments.map(c => c.id);
    let mentions: any[] = [];
    try {
      if (commentIds.length > 0) {
        mentions = await query<any[]>(
          `SELECT cm.comment_id, cm.mentioned_user_id, u.full_name as user_name, u.avatar_url as user_avatar
           FROM comment_mentions cm
           LEFT JOIN users u ON cm.mentioned_user_id = u.id
           WHERE cm.comment_id IN (${commentIds.map(() => '?').join(',')})`,
          commentIds
        ) as any;
      }
    } catch (error) {
      // Comment mentions table might not exist yet, ignore error
      logger.warn('Comment mentions table might not exist:', error);
      mentions = [];
    }
  
  const mentionsByCommentId = new Map<string, any[]>();
  for (const mention of mentions) {
    if (!mentionsByCommentId.has(mention.comment_id)) {
      mentionsByCommentId.set(mention.comment_id, []);
    }
    mentionsByCommentId.get(mention.comment_id)!.push({
      userId: mention.mentioned_user_id,
      userName: mention.user_name || 'Unknown',
      userAvatar: mention.user_avatar || '',
    });
  }
  
    // Get dependencies
    let dependencies: TaskDependencyRow[] = [];
    try {
      if (taskIds.length > 0) {
        dependencies = await query<TaskDependencyRow[]>(
          `SELECT * FROM task_dependencies WHERE task_id IN (${taskIds.map(() => '?').join(',')})`,
          taskIds
        );
      }
    } catch (error) {
      // Table might not exist yet, ignore error
      logger.warn('Task dependencies table might not exist:', error);
    }
  
    // Get only users referenced by tasks (assignee_id and reporter_id) - avoids loading all users
    const webUserIds = new Set<string>();
    for (const task of tasks) {
      if (task.assignee_id) webUserIds.add(task.assignee_id);
      if (task.reporter_id) webUserIds.add(task.reporter_id);
    }
    
    let userMap = new Map<string, { id: string; full_name: string; avatar_url: string }>();
    if (webUserIds.size > 0) {
      try {
        const userIdArray = Array.from(webUserIds);
        const users = await query<{ id: string; full_name: string; avatar_url: string }[]>(
          `SELECT id, full_name, avatar_url FROM users WHERE id IN (${userIdArray.map(() => '?').join(',')})`,
          userIdArray
        );
        userMap = new Map(users.map(u => [u.id, u]));
      } catch (error) {
        logger.warn('Users table might not exist or query failed:', error);
        // Continue with empty userMap
      }
    }
    
    return tasks.map(task => {
    const assignee = task.assignee_id ? userMap.get(task.assignee_id) : null;
    const taskTags = tags.filter(t => t.task_id === task.id).map(t => t.tag);
    const taskChecklist = checklists
      .filter(c => c.task_id === task.id)
      .map(c => ({
        id: c.id,
        taskId: c.task_id,
        title: c.title,
        isCompleted: c.is_completed === 1 || c.is_completed === true,
        position: c.position,
      }));
    const taskComments = comments
      .filter(c => c.task_id === task.id)
      .map(c => {
        const commentMentions = mentionsByCommentId.get(c.id) || [];
        return {
          id: c.id,
          userId: c.user_id,
          userName: (c as any).user_name || 'Unknown',
          userAvatar: (c as any).user_avatar || '',
          text: c.text,
          timestamp: c.created_at,
          updatedAt: c.updated_at || undefined,
          parentId: c.parent_id || undefined,
          isDeleted: c.is_deleted === 1 || c.is_deleted === true,
          mentions: commentMentions.length > 0 ? commentMentions : undefined,
        };
      });
    const taskDependencies = dependencies
      .filter(d => d.task_id === task.id)
      .map(d => d.depends_on_task_id);
    
    return {
      id: task.id,
      code: task.code,
      projectId: task.project_id,
      columnId: task.column_id,
      title: task.title,
      type: task.type,
      priority: task.priority,
      assigneeId: task.assignee_id || undefined,
      reporterId: task.reporter_id || undefined,
      dueDate: task.due_date,
      description: task.description,
      position: task.position,
      assigneeName: assignee?.full_name,
      assigneeAvatar: assignee?.avatar_url,
      tags: taskTags,
      checklist: taskChecklist,
      comments: taskComments,
      attachments: task.attachments,
      category: task.category || 'FRONTEND',
      commitReference: task.commit_reference || undefined,
      dependencies: taskDependencies,
    };
  });
  } catch (error) {
    logger.error('Error in findWebTasksByProjectId:', error);
    throw error;
  }
}

/**
 * Find tasks by category
 */
export async function findTasksByCategory(
  projectId: string,
  category: TaskCategory
): Promise<WebTask[]> {
  const allTasks = await findWebTasksByProjectId(projectId);
  return allTasks.filter(t => t.category === category);
}

/**
 * Update task category
 */
export async function updateTaskCategory(
  taskId: string,
  category: TaskCategory
): Promise<void> {
  await query(
    'UPDATE tasks SET category = ? WHERE id = ?',
    [category, taskId]
  );
}

/**
 * Update task commit reference
 */
export async function updateTaskCommitReference(
  taskId: string,
  commitReference: string
): Promise<void> {
  await query(
    'UPDATE tasks SET commit_reference = ? WHERE id = ?',
    [commitReference, taskId]
  );
}

/**
 * Add task dependency
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<void> {
  const id = uuidv4();
  await query(
    'INSERT INTO task_dependencies (id, task_id, depends_on_task_id) VALUES (?, ?, ?)',
    [id, taskId, dependsOnTaskId]
  );
}

/**
 * Remove task dependency
 */
export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<void> {
  await query(
    'DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?',
    [taskId, dependsOnTaskId]
  );
}

/**
 * Get task dependencies
 */
export async function getTaskDependencies(taskId: string): Promise<string[]> {
  const rows = await query<TaskDependencyRow[]>(
    'SELECT * FROM task_dependencies WHERE task_id = ?',
    [taskId]
  );
  return rows.map(r => r.depends_on_task_id);
}

/**
 * Validate task-role assignment
 * Returns true if the role can be assigned to the task category
 */
export function validateTaskRoleAssignment(
  category: TaskCategory,
  userRole: string
): { valid: boolean; reason?: string } {
  const categoryRoleMap: Record<TaskCategory, string[]> = {
    FRONTEND: ['Developer', 'Frontend Developer', 'Full Stack Developer', 'Tech Lead'],
    BACKEND: ['Developer', 'Backend Developer', 'Full Stack Developer', 'Tech Lead'],
    DESIGN: ['Designer', 'UI/UX Designer', 'Product Designer'],
    DEVOPS: ['DevOps Engineer', 'SRE', 'System Administrator', 'Tech Lead'],
    QA: ['QA Engineer', 'Tester', 'QA Lead'],
  };
  
  const allowedRoles = categoryRoleMap[category] || [];
  
  // Allow managers and admins to be assigned to any category
  if (['Manager', 'Admin', 'Project Manager'].includes(userRole)) {
    return { valid: true };
  }
  
  if (allowedRoles.includes(userRole)) {
    return { valid: true };
  }
  
  return {
    valid: false,
    reason: `Role "${userRole}" cannot be assigned to ${category} tasks. Allowed roles: ${allowedRoles.join(', ')}`,
  };
}

/**
 * Get tasks grouped by category
 */
export async function getTasksGroupedByCategory(projectId: string): Promise<Record<TaskCategory, WebTask[]>> {
  const tasks = await findWebTasksByProjectId(projectId);
  
  const grouped: Record<TaskCategory, WebTask[]> = {
    FRONTEND: [],
    BACKEND: [],
    DESIGN: [],
    DEVOPS: [],
    QA: [],
  };
  
  for (const task of tasks) {
    if (task.category && grouped[task.category]) {
      grouped[task.category].push(task);
    }
  }
  
  return grouped;
}

/**
 * Add a checklist item to a task
 */
export async function addChecklistItem(
  taskId: string,
  title: string
): Promise<ChecklistItem> {
  // Get max position for this task
  const [positionRows] = await query<any[]>(
    'SELECT COALESCE(MAX(position), 0) as max_position FROM checklist_items WHERE task_id = ?',
    [taskId]
  ) as any;
  const position = (positionRows[0]?.max_position || 0) + 1;
  
  const id = uuidv4();
  await query(
    'INSERT INTO checklist_items (id, task_id, title, is_completed, position) VALUES (?, ?, ?, FALSE, ?)',
    [id, taskId, title, position]
  );
  
  return {
    id,
    taskId,
    title,
    isCompleted: false,
    position,
  };
}

/**
 * Update a checklist item
 */
export async function updateChecklistItem(
  itemId: string,
  updates: { title?: string; isCompleted?: boolean }
): Promise<ChecklistItem | null> {
  try {
    logger.info(`Updating checklist item: id=${itemId}, updates=${JSON.stringify(updates)}`);
    
    const updatesList: string[] = [];
    const params: any[] = [];
    
    if (updates.title !== undefined) {
      updatesList.push('title = ?');
      params.push(updates.title.trim());
    }
    if (updates.isCompleted !== undefined) {
      updatesList.push('is_completed = ?');
      // Convert boolean to MySQL TINYINT (0 or 1)
      params.push(updates.isCompleted ? 1 : 0);
    }
    
    if (updatesList.length === 0) {
      logger.info(`No updates provided, returning existing item: ${itemId}`);
      // Return existing item if no updates
      const result = await query<ChecklistItemRow[]>(
        'SELECT * FROM checklist_items WHERE id = ?',
        [itemId]
      ) as any;
      
      // Handle different query result formats
      let rows: ChecklistItemRow[];
      if (Array.isArray(result)) {
        rows = result;
      } else if (Array.isArray(result[0])) {
        rows = result[0];
      } else {
        rows = [];
      }
      
      if (rows.length === 0) {
        logger.warn(`Checklist item not found: ${itemId}`);
        return null;
      }
      const row = rows[0];
      return {
        id: row.id,
        taskId: row.task_id,
        title: row.title,
        isCompleted: row.is_completed === 1 || row.is_completed === true,
        position: row.position,
      };
    }
    
    params.push(itemId);
    logger.info(`Executing UPDATE query: ${updatesList.join(', ')}, params: ${JSON.stringify(params)}`);
    await query(
      `UPDATE checklist_items SET ${updatesList.join(', ')} WHERE id = ?`,
      params
    );
    logger.info(`Checklist item updated successfully: ${itemId}`);
    
    // Return updated item
    const result = await query<ChecklistItemRow[]>(
      'SELECT * FROM checklist_items WHERE id = ?',
      [itemId]
    ) as any;
    
    // Handle different query result formats
    let rows: ChecklistItemRow[];
    if (Array.isArray(result)) {
      rows = result;
    } else if (Array.isArray(result[0])) {
      rows = result[0];
    } else {
      rows = [];
    }
    
    if (rows.length === 0) {
      logger.error(`Checklist item not found after update: ${itemId}`);
      return null;
    }
    const row = rows[0];
    
    const updatedItem = {
      id: row.id,
      taskId: row.task_id,
      title: row.title,
      isCompleted: row.is_completed === 1 || row.is_completed === true,
      position: row.position,
    };
    
    logger.info(`Checklist item retrieved successfully: ${itemId}`);
    return updatedItem;
  } catch (error) {
    logger.error('Error in updateChecklistItem:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      itemId,
      updates,
    });
    throw error;
  }
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(itemId: string): Promise<boolean> {
  const result = await query<any>('DELETE FROM checklist_items WHERE id = ?', [itemId]);
  return result.affectedRows > 0;
}

/**
 * Add a comment to a task
 */
export async function addComment(
  taskId: string,
  userId: string,
  content: string,
  mentionedUserIds?: string[],
  parentId?: string
): Promise<Comment> {
  const id = uuidv4();
  
  try {
    logger.info(`Adding comment: id=${id}, taskId=${taskId}, userId=${userId}, parentId=${parentId || 'null'}`);
    
    // Insert comment
    await query(
      'INSERT INTO comments (id, task_id, user_id, text, parent_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, taskId, userId, content, parentId || null]
    );
    logger.info(`Comment inserted successfully: ${id}`);
    
    // Insert mentions if provided (handle case where table might not exist)
    if (mentionedUserIds && mentionedUserIds.length > 0) {
      try {
        for (const mentionedUserId of mentionedUserIds) {
          const mentionId = uuidv4();
          await query(
            'INSERT INTO comment_mentions (id, comment_id, mentioned_user_id, created_at) VALUES (?, ?, ?, NOW())',
            [mentionId, id, mentionedUserId]
          );
        }
      } catch (error) {
        // Comment mentions table might not exist yet, log warning but continue
        logger.warn('Comment mentions table might not exist, skipping mention inserts:', error);
      }
    }
    
    // Get the comment with user info and mentions
    const result = await query<any[]>(
      `SELECT c.*, u.full_name as user_name, u.avatar_url as user_avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [id]
    ) as any;
    
    // Handle different query result formats
    let rows: any[];
    if (Array.isArray(result)) {
      // If result is already an array
      rows = result;
    } else if (Array.isArray(result[0])) {
      // If result is [rows, fields] format
      rows = result[0];
    } else {
      rows = [];
    }
    
    logger.info(`Query result format check: result type=${typeof result}, isArray=${Array.isArray(result)}, rows length=${rows.length}`);
    
    if (rows.length === 0) {
      logger.error(`Failed to retrieve comment after insert: id=${id}, result=${JSON.stringify(result)}`);
      throw new Error('Failed to create comment');
    }
    const row = rows[0];
    
    if (!row) {
      logger.error(`Row is undefined: id=${id}, rows=${JSON.stringify(rows)}`);
      throw new Error('Failed to retrieve comment data');
    }
    
    logger.info(`Comment retrieved successfully: ${id}, row keys=${Object.keys(row).join(',')}`);
    
    // Get mentions for this comment (handle case where table might not exist)
    let mentions: any[] = [];
    try {
      const [mentionRows] = await query<any[]>(
        `SELECT cm.mentioned_user_id, u.full_name as user_name, u.avatar_url as user_avatar
         FROM comment_mentions cm
         JOIN users u ON cm.mentioned_user_id = u.id
         WHERE cm.comment_id = ?`,
        [id]
      ) as any;
      
      mentions = mentionRows.map((m: any) => ({
        userId: m.mentioned_user_id,
        userName: m.user_name || 'Unknown',
        userAvatar: m.user_avatar || '',
      }));
    } catch (error) {
      // Comment mentions table might not exist yet, ignore error
      logger.warn('Comment mentions table might not exist, skipping mentions:', error);
      mentions = [];
    }
    
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || 'Unknown',
      userAvatar: row.user_avatar || '',
      text: row.text,
      timestamp: row.created_at,
      updatedAt: row.updated_at || undefined,
      parentId: row.parent_id || undefined,
      isDeleted: row.is_deleted === 1 || row.is_deleted === true,
      mentions: mentions.length > 0 ? mentions : undefined,
    };
  } catch (error) {
    logger.error('Error in addComment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId,
      userId,
      commentId: id,
    });
    throw error;
  }
}

/**
 * Find a comment by ID with user and task information
 */
export async function findCommentById(commentId: string): Promise<{
  id: string;
  taskId: string;
  userId: string;
  text: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
} | null> {
  const rows = await query<any[]>(
    'SELECT id, task_id, user_id, text, parent_id, is_deleted, created_at, updated_at FROM comments WHERE id = ?',
    [commentId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    text: row.text,
    parentId: row.parent_id,
    isDeleted: row.is_deleted === 1 || row.is_deleted === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, text: string, userId: string): Promise<Comment> {
  try {
    logger.info(`Updating comment: id=${commentId}, userId=${userId}, text length=${text.length}`);
    
    // Update comment - ensure updated_at is set
    // For UPDATE queries, mysql2 returns ResultSetHeader which has affectedRows
    const updateResult = await query<any>(
      'UPDATE comments SET text = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [text, commentId, userId]
    );
    
    logger.info(`Update query executed, affectedRows: ${updateResult?.affectedRows || 'unknown'}`);
    
    // Check if update was successful
    if (!updateResult || updateResult.affectedRows === 0) {
      logger.warn(`Update failed: No rows affected. commentId=${commentId}, userId=${userId}`);
      throw new Error('Comment not found or user does not have permission to update');
    }
    
    // Get the updated comment with user info
    // For SELECT queries, mysql2 returns array of rows directly
    const result = await query<any[]>(
      `SELECT c.*, u.full_name as user_name, u.avatar_url as user_avatar 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [commentId]
    );
    
    logger.info(`Select query result type: ${typeof result}, isArray: ${Array.isArray(result)}, length: ${Array.isArray(result) ? result.length : 'N/A'}`);
    
    // The query function already returns rows directly (not [rows, fields])
    const rows = Array.isArray(result) ? result : [];
    
    logger.info(`Rows extracted: ${rows.length}`);
    
    if (rows.length === 0) {
      logger.error(`Comment not found after update: commentId=${commentId}`);
      throw new Error('Comment not found after update');
    }
    
    const row = rows[0];
    logger.info(`Comment retrieved: id=${row.id}, text length=${row.text?.length || 0}, updated_at=${row.updated_at}`);
    
    // Get mentions for this comment
    let mentions: any[] = [];
    try {
      const mentionResult = await query<any[]>(
        `SELECT cm.mentioned_user_id, u.full_name as user_name, u.avatar_url as user_avatar
         FROM comment_mentions cm
         LEFT JOIN users u ON cm.mentioned_user_id = u.id
         WHERE cm.comment_id = ?`,
        [commentId]
      );
      
      // The query function returns rows directly
      const mentionRows = Array.isArray(mentionResult) ? mentionResult : [];
      
      mentions = mentionRows.map((m: any) => ({
        userId: m.mentioned_user_id,
        userName: m.user_name || 'Unknown',
        userAvatar: m.user_avatar || '',
      }));
    } catch (error) {
      logger.warn('Error fetching mentions (non-critical):', error);
      mentions = [];
    }
    
    const comment: Comment = {
      id: row.id,
      userId: row.user_id,
      userName: row.user_name || 'Unknown',
      userAvatar: row.user_avatar || '',
      text: row.text,
      timestamp: row.created_at,
      updatedAt: row.updated_at || undefined,
      parentId: row.parent_id || undefined,
      isDeleted: row.is_deleted === 1 || row.is_deleted === true,
      mentions: mentions.length > 0 ? mentions : undefined,
    };
    
    logger.info(`Comment update successful: id=${comment.id}, updatedAt=${comment.updatedAt}`);
    return comment;
  } catch (error) {
    logger.error('Error in updateComment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      commentId,
      userId,
      textLength: text?.length || 0,
    });
    throw error;
  }
}

/**
 * Soft delete a comment (recall)
 */
export async function deleteComment(commentId: string): Promise<boolean> {
  const result = await query<any>(
    'UPDATE comments SET is_deleted = true WHERE id = ?',
    [commentId]
  );
  return result.affectedRows > 0;
}
