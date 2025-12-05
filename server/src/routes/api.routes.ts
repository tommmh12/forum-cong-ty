import { Router } from 'express';
import * as userRepo from '../repositories/user.repository';
import * as deptRepo from '../repositories/department.repository';
import * as projectRepo from '../repositories/project.repository';
import * as workspaceRepo from '../repositories/workspace.repository';
import employeeRoutes from './employee.routes';
import authRoutes from './auth.routes';
import resourceRoutes from './resource.routes';
import phaseRoutes from './phase.routes';
import environmentRoutes from './environment.routes';
import designReviewRoutes from './design-review.routes';
import bugRoutes from './bug.routes';
import uatRoutes from './uat.routes';
import goLiveRoutes from './go-live.routes';
import exportRoutes from './export.routes';
import techStackRoutes from './tech-stack.routes';
import projectMembersRoutes from './project-members.routes';
import workflowRoutes from './workflow.routes';
import forumRoutes from './forum.routes';
import uploadRoutes from './upload.routes';
import { logger } from '../utils/logger';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import * as memberRepo from '../repositories/project-members.repository';
import { getIO } from '../socket/socket';

const router = Router();

// Auth API
router.use('/auth', authRoutes);

// Employee API (v1 and default)
router.use('/v1/employees', employeeRoutes);
router.use('/employees', employeeRoutes);

// Users API
router.get('/users', async (req, res) => {
  try {
    const users = await userRepo.findAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await userRepo.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Departments API
router.get('/departments', async (req, res) => {
  try {
    const departments = await deptRepo.findAllDepartments();
    res.json(departments);
  } catch (error) {
    logger.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

router.get('/departments/:id', async (req, res) => {
  try {
    const department = await deptRepo.findDepartmentById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    logger.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const { code, name, managerName, managerAvatar, description, kpiStatus, parentDeptId } = req.body;
    
    if (!code || !name || !managerName) {
      return res.status(400).json({ error: 'Code, name and managerName are required' });
    }
    
    const department = await deptRepo.createDepartment({
      code,
      name,
      managerName,
      managerAvatar,
      description,
      kpiStatus,
      parentDeptId,
    });
    
    res.status(201).json(department);
  } catch (error) {
    logger.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const { code, name, managerName, managerAvatar, description, kpiStatus, parentDeptId } = req.body;
    
    const department = await deptRepo.updateDepartment(req.params.id, {
      code,
      name,
      managerName,
      managerAvatar,
      description,
      kpiStatus,
      parentDeptId,
    });
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    logger.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    const deleted = await deptRepo.deleteDepartment(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    logger.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});


// Projects API
router.get('/projects', async (req, res) => {
  try {
    const projects = await projectRepo.findAllProjects();
    res.json(projects);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const project = await projectRepo.findProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.get('/projects/:id/columns', async (req, res) => {
  try {
    const columns = await projectRepo.findTaskColumnsByProjectId(req.params.id);
    res.json(columns);
  } catch (error) {
    logger.error('Error fetching task columns:', error);
    res.status(500).json({ error: 'Failed to fetch task columns' });
  }
});

// Create a new task column
router.post('/projects/:id/columns', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Column name is required' });
    }
    
    const column = await projectRepo.createTaskColumn(req.params.id, name);
    res.status(201).json(column);
  } catch (error) {
    logger.error('Error creating task column:', error);
    res.status(500).json({ error: 'Failed to create task column' });
  }
});

// Update a task column
router.put('/projects/:id/columns/:columnId', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Column name is required' });
    }
    
    const updated = await projectRepo.updateTaskColumn(req.params.columnId, name);
    
    if (!updated) {
      return res.status(404).json({ error: 'Column not found' });
    }
    
    res.json({ message: 'Column updated successfully' });
  } catch (error) {
    logger.error('Error updating task column:', error);
    res.status(500).json({ error: 'Failed to update task column' });
  }
});

// Delete a task column
router.delete('/projects/:id/columns/:columnId', async (req, res) => {
  try {
    const deleted = await projectRepo.deleteTaskColumn(req.params.columnId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Column not found' });
    }
    
    res.json({ message: 'Column deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task column:', error);
    res.status(500).json({ error: 'Failed to delete task column' });
  }
});

router.get('/projects/:id/tasks', async (req, res) => {
  try {
    const tasks = await projectRepo.findWebTasksByProjectId(req.params.id);
    res.json(tasks);
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error details:', { projectId: req.params.id, error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    res.status(500).json({ error: 'Failed to fetch tasks', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined });
  }
});

// Create a new project
router.post('/projects', async (req, res) => {
  try {
    const { key, name, managerId, status, startDate, endDate, budget, description } = req.body;
    
    if (!key || !name) {
      return res.status(400).json({ error: 'Project key and name are required' });
    }
    
    const project = await projectRepo.createProject({
      key,
      name,
      managerId,
      status,
      startDate,
      endDate,
      budget,
      description,
    });
    
    res.status(201).json(project);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
router.put('/projects/:id', async (req, res) => {
  try {
    const { key, name, managerId, progress, status, startDate, endDate, budget, description } = req.body;
    
    const project = await projectRepo.updateProject(req.params.id, {
      key,
      name,
      managerId,
      progress,
      status,
      startDate,
      endDate,
      budget,
      description,
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
router.delete('/projects/:id', async (req, res) => {
  try {
    const deleted = await projectRepo.deleteProject(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Create a new task
router.post('/projects/:id/tasks', async (req, res) => {
  try {
    const { columnId, title, type, priority, assigneeId, reporterId, dueDate, description, category, tags, checklist } = req.body;
    
    if (!columnId || !title) {
      return res.status(400).json({ error: 'Column ID and title are required' });
    }
    
    const task = await projectRepo.createTask({
      projectId: req.params.id,
      columnId,
      title,
      type,
      priority,
      assigneeId,
      reporterId,
      dueDate,
      description,
      category,
      tags,
      checklist,
    });
    
    res.status(201).json(task);
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/projects/:id/tasks/:taskId', async (req, res) => {
  try {
    const { columnId, title, type, priority, assigneeId, reporterId, dueDate, description, position, category, tags } = req.body;
    
    const updated = await projectRepo.updateTask(req.params.taskId, {
      columnId,
      title,
      type,
      priority,
      assigneeId,
      reporterId,
      dueDate,
      description,
      position,
      category,
      tags,
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/projects/:id/tasks/:taskId', async (req, res) => {
  try {
    const deleted = await projectRepo.deleteTask(req.params.taskId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Helper function to check if user is a project member (including manager)
async function checkProjectMember(projectId: string, userId: string): Promise<boolean> {
  try {
    logger.info(`Checking project membership: projectId=${projectId}, userId=${userId}`);
    
    // Check if user is in project_members table
    try {
      const isMember = await memberRepo.isMember(projectId, userId);
      logger.info(`isMember check result: ${isMember}`);
      if (isMember) {
        logger.info(`User ${userId} is a member of project ${projectId}`);
        return true;
      }
    } catch (memberError) {
      logger.warn('Error checking project_members table:', memberError);
      // Continue to check manager
    }
    
    // Check if user is the project manager
    try {
      const project = await projectRepo.findProjectById(projectId);
      logger.info(`Project found: ${project ? 'yes' : 'no'}, managerId=${project?.managerId}, comparing with userId=${userId}`);
      if (project && project.managerId === userId) {
        logger.info(`User ${userId} is the manager of project ${projectId}`);
        return true;
      }
    } catch (projectError) {
      logger.error('Error finding project:', projectError);
    }
    
    logger.warn(`User ${userId} is NOT a member of project ${projectId}`);
    return false;
  } catch (error) {
    // If project_members table doesn't exist, check if user is manager
    logger.error('Error checking project membership, falling back to manager check:', error);
    try {
      const project = await projectRepo.findProjectById(projectId);
      const isManager = project?.managerId === userId;
      logger.info(`Fallback manager check: ${isManager}`);
      return isManager;
    } catch (fallbackError) {
      logger.error('Fallback check also failed:', fallbackError);
      return false;
    }
  }
}

// Checklist Items Routes
// Add a checklist item to a task
// Allow any project member to add checklist items
router.post('/projects/:id/tasks/:taskId/checklist', optionalAuthMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const projectId = req.params.id;
    const userId = req.user?.id;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Checklist item title is required' });
    }
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in to add checklist items.' });
    }
    
    // Check if user is a member of the project
    const isProjectMember = await checkProjectMember(projectId, userId);
    if (!isProjectMember) {
      return res.status(403).json({ error: 'You must be a member of this project to add checklist items.' });
    }
    
    const item = await projectRepo.addChecklistItem(req.params.taskId, title.trim());
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error adding checklist item:', error);
    res.status(500).json({ error: 'Failed to add checklist item' });
  }
});

// Update a checklist item
// Allow any project member to update checklist items
router.put('/projects/:id/tasks/:taskId/checklist/:itemId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { title, isCompleted } = req.body;
    const projectId = req.params.id;
    const userId = req.user?.id;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in to update checklist items.' });
    }
    
    // Check if user is a member of the project
    const isProjectMember = await checkProjectMember(projectId, userId);
    if (!isProjectMember) {
      return res.status(403).json({ error: 'You must be a member of this project to update checklist items.' });
    }
    
    const updates: { title?: string; isCompleted?: boolean } = {};
    if (title !== undefined) updates.title = title.trim();
    if (isCompleted !== undefined) updates.isCompleted = isCompleted;
    
    const item = await projectRepo.updateChecklistItem(req.params.itemId, updates);
    
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    
    res.json(item);
  } catch (error) {
    logger.error('Error updating checklist item:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      itemId: req.params.itemId,
      taskId: req.params.taskId,
      updates: req.body,
    });
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

// Delete a checklist item
// Allow any project member to delete checklist items
router.delete('/projects/:id/tasks/:taskId/checklist/:itemId', optionalAuthMiddleware, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user?.id;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please log in to delete checklist items.' });
    }
    
    // Check if user is a member of the project
    const isProjectMember = await checkProjectMember(projectId, userId);
    if (!isProjectMember) {
      return res.status(403).json({ error: 'You must be a member of this project to delete checklist items.' });
    }
    
    const deleted = await projectRepo.deleteChecklistItem(req.params.itemId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    
    res.json({ message: 'Checklist item deleted successfully' });
  } catch (error) {
    logger.error('Error deleting checklist item:', error);
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

// Move a task to another column
router.put('/projects/:id/tasks/:taskId/move', async (req, res) => {
  try {
    const { columnId, position } = req.body;
    
    if (!columnId) {
      return res.status(400).json({ error: 'Column ID is required' });
    }
    
    const moved = await projectRepo.moveTask(req.params.taskId, columnId, position || 0);
    
    if (!moved) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task moved successfully' });
  } catch (error) {
    logger.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// Project Resources API
router.use('/projects/:id/resources', resourceRoutes);

// Project Phases API
router.use('/projects/:id/phases', phaseRoutes);

// Project Environments API
router.use('/projects/:id/environments', environmentRoutes);

// Project Design Reviews API
router.use('/projects/:id/design-reviews', designReviewRoutes);

// Project Bug Reports API
router.use('/projects/:id/bugs', bugRoutes);

// Project UAT API
router.use('/projects/:id/uat', uatRoutes);

// Project Go-Live API
router.use('/projects/:id/go-live', goLiveRoutes);

// Project Export API
router.use('/projects/:id/export', exportRoutes);

// Project Tech Stack API
router.use('/', techStackRoutes);

// Project Members API
router.use('/projects/:id/members', projectMembersRoutes);

// Workflows API
router.use('/workflows', workflowRoutes);

// Forum API
router.use('/forum', forumRoutes);

// Upload API
router.use('/upload', uploadRoutes);

// Meeting Rooms API
router.get('/meeting-rooms', async (req, res) => {
  try {
    const rooms = await workspaceRepo.findAllMeetingRooms();
    res.json(rooms);
  } catch (error) {
    logger.error('Error fetching meeting rooms:', error);
    res.status(500).json({ error: 'Failed to fetch meeting rooms' });
  }
});

router.get('/meeting-rooms/:id', async (req, res) => {
  try {
    const room = await workspaceRepo.findMeetingRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Meeting room not found' });
    }
    res.json(room);
  } catch (error) {
    logger.error('Error fetching meeting room:', error);
    res.status(500).json({ error: 'Failed to fetch meeting room' });
  }
});

router.post('/meeting-rooms', async (req, res) => {
  try {
    const { name, capacity, type, location, status, image, meetingUrl, platform, amenities } = req.body;
    
    if (!name || !capacity || !type) {
      return res.status(400).json({ error: 'Missing required fields: name, capacity, type' });
    }
    
    const room = await workspaceRepo.createMeetingRoom({
      name,
      capacity,
      type,
      location,
      status,
      image,
      meetingUrl,
      platform,
      amenities,
    });
    
    res.status(201).json(room);
  } catch (error) {
    logger.error('Error creating meeting room:', error);
    res.status(500).json({ error: 'Failed to create meeting room' });
  }
});

router.put('/meeting-rooms/:id', async (req, res) => {
  try {
    const { name, capacity, type, location, status, image, meetingUrl, platform, amenities } = req.body;
    
    const room = await workspaceRepo.updateMeetingRoom(req.params.id, {
      name,
      capacity,
      type,
      location,
      status,
      image,
      meetingUrl,
      platform,
      amenities,
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Meeting room not found' });
    }
    
    res.json(room);
  } catch (error) {
    logger.error('Error updating meeting room:', error);
    res.status(500).json({ error: 'Failed to update meeting room' });
  }
});

router.delete('/meeting-rooms/:id', async (req, res) => {
  try {
    const deleted = await workspaceRepo.deleteMeetingRoom(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Meeting room not found' });
    }
    
    res.json({ message: 'Meeting room deleted successfully' });
  } catch (error) {
    logger.error('Error deleting meeting room:', error);
    res.status(500).json({ error: 'Failed to delete meeting room' });
  }
});

// Bookings API
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await workspaceRepo.findAllBookings();
    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/meeting-rooms/:id/bookings', async (req, res) => {
  try {
    const bookings = await workspaceRepo.findBookingsByRoomId(req.params.id);
    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const { roomId, title, organizerId, startTime, endTime, participants, status } = req.body;
    
    if (!roomId || !title || !organizerId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields: roomId, title, organizerId, startTime, endTime' });
    }
    
    // Check for booking conflicts
    const hasConflict = await workspaceRepo.hasBookingConflict(roomId, startTime, endTime);
    if (hasConflict) {
      const conflictingBookings = await workspaceRepo.findConflictingBookings(roomId, startTime, endTime);
      return res.status(409).json({ 
        error: 'Booking conflict: The requested time slot overlaps with existing bookings',
        conflicts: conflictingBookings,
      });
    }
    
    const booking = await workspaceRepo.createBooking({
      roomId,
      title,
      organizerId,
      startTime,
      endTime,
      participants,
      status,
    });
    
    res.status(201).json(booking);
  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.put('/bookings/:id', async (req, res) => {
  try {
    const { title, startTime, endTime, status, participants } = req.body;
    const bookingId = req.params.id;
    
    // If updating time, check for conflicts (excluding current booking)
    if (startTime || endTime) {
      // Get current booking to fill in missing time values
      const existingBookings = await workspaceRepo.findAllBookings();
      const existingBooking = existingBookings.find(b => b.id === bookingId);
      
      if (!existingBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      const newStartTime = startTime || existingBooking.startTime;
      const newEndTime = endTime || existingBooking.endTime;
      
      const hasConflict = await workspaceRepo.hasBookingConflict(
        existingBooking.roomId, 
        newStartTime, 
        newEndTime, 
        bookingId
      );
      
      if (hasConflict) {
        const conflictingBookings = await workspaceRepo.findConflictingBookings(
          existingBooking.roomId, 
          newStartTime, 
          newEndTime, 
          bookingId
        );
        return res.status(409).json({ 
          error: 'Booking conflict: The requested time slot overlaps with existing bookings',
          conflicts: conflictingBookings,
        });
      }
    }
    
    const booking = await workspaceRepo.updateBooking(bookingId, {
      title,
      startTime,
      endTime,
      status,
      participants,
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    logger.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Comments Routes
// Add a comment to a task
// Allow any project member to comment (optional auth, but must be project member)
router.post('/projects/:id/tasks/:taskId/comments', optionalAuthMiddleware, async (req, res) => {
  try {
    const { content, mentionedUserIds, parentId } = req.body;
    const projectId = req.params.id;
    const userId = req.user?.id; // Get from optional authenticated user
    
    logger.info(`Add comment request: projectId=${projectId}, taskId=${req.params.taskId}, userId=${userId}, parentId=${parentId || 'null'}`);
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // Check if user is authenticated
    if (!userId) {
      logger.warn('No userId found in request');
      return res.status(401).json({ error: 'Authentication required. Please log in to add comments.' });
    }
    
    // Check if user is a member of the project (including manager)
    const isProjectMember = await checkProjectMember(projectId, userId);
    logger.info(`Project member check result: ${isProjectMember}`);
    
    if (!isProjectMember) {
      logger.warn(`User ${userId} is not a member of project ${projectId}`);
      return res.status(403).json({ error: 'You must be a member of this project to add comments.' });
    }
    
    // If parentId is provided, verify it exists and belongs to the same task
    if (parentId) {
      const parentComment = await projectRepo.findCommentById(parentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
      if (parentComment.taskId !== req.params.taskId) {
        return res.status(400).json({ error: 'Parent comment does not belong to this task' });
      }
    }
    
    logger.info(`User ${userId} is authorized to add comment to task ${req.params.taskId}`);
    const comment = await projectRepo.addComment(req.params.taskId, userId, content.trim(), mentionedUserIds, parentId);
    logger.info(`Comment created successfully, returning: ${JSON.stringify(comment)}`);
    
    // Emit real-time event to all clients in the task room
    const io = getIO();
    io.to(`task:${req.params.taskId}`).emit('new_comment', {
      taskId: req.params.taskId,
      comment,
    });
    logger.info(`Emitted new_comment event to room: task:${req.params.taskId}`);
    
    res.status(201).json(comment);
  } catch (error) {
    logger.error('Error adding comment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update a comment
router.put('/projects/:id/tasks/:taskId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user?.id;
    const projectId = req.params.id;
    const taskId = req.params.taskId;
    const commentId = req.params.commentId;
    
    logger.info(`Update comment request: projectId=${projectId}, taskId=${taskId}, commentId=${commentId}, userId=${userId}`);
    logger.info(`Request body:`, { text: text?.substring(0, 50), textLength: text?.length });
    
    if (!userId) {
      logger.warn('Update comment: No userId found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!text || typeof text !== 'string' || !text.trim()) {
      logger.warn('Update comment: Invalid text', { text, textType: typeof text });
      return res.status(400).json({ error: 'Comment text is required and must be a non-empty string' });
    }
    
    // Get comment to check ownership
    const comment = await projectRepo.findCommentById(commentId);
    
    if (!comment) {
      logger.warn(`Update comment: Comment not found: commentId=${commentId}`);
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    logger.info(`Comment found: userId=${comment.userId}, requestingUserId=${userId}`);
    
    // Only the comment owner can edit
    if (comment.userId !== userId) {
      logger.warn(`Update comment: Permission denied: comment.userId=${comment.userId}, requestingUserId=${userId}`);
      return res.status(403).json({ error: 'Forbidden: Only comment owner can edit comments' });
    }
    
    // Update the comment
    logger.info(`Calling updateComment repository function: commentId=${commentId}, userId=${userId}`);
    const updatedComment = await projectRepo.updateComment(commentId, text.trim(), userId);
    logger.info(`Comment updated successfully: id=${updatedComment.id}`);
    
    // Emit real-time event to all clients in the task room
    const io = getIO();
    io.to(`task:${taskId}`).emit('comment_updated', {
      taskId: taskId,
      comment: updatedComment,
    });
    logger.info(`Emitted comment_updated event to room: task:${taskId}`);
    
    res.json(updatedComment);
  } catch (error) {
    logger.error('Error updating comment:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params: req.params,
      body: req.body,
    });
    res.status(500).json({ 
      error: 'Failed to update comment',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete a comment
router.delete('/projects/:id/tasks/:taskId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get comment to check ownership
    const comment = await projectRepo.findCommentById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user is the comment owner
    const isOwner = comment.userId === userId;
    
    // Check if user is project manager or admin
    let isPrivileged = false;
    if (!isOwner) {
      const project = await projectRepo.findProjectById(req.params.id);
      if (project) {
        // Check if user is project manager
        if (project.managerId === userId) {
          isPrivileged = true;
        } else {
          // Check if user has MANAGER role in project members
          const { findMember } = await import('../repositories/project-members.repository');
          const member = await findMember(req.params.id, userId);
          if (member && member.role === 'MANAGER') {
            isPrivileged = true;
          }
        }
        
        // Check if user is admin
        const userRole = (req as any).user?.role;
        if (userRole === 'ADMIN') {
          isPrivileged = true;
        }
      }
    }
    
    // Only allow deletion if user is owner or has privileged role
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: 'Forbidden: Only comment owner or project manager/admin can delete comments' });
    }
    
    const deleted = await projectRepo.deleteComment(req.params.commentId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Get the updated comment to emit with is_deleted flag
    const updatedComment = await projectRepo.findCommentById(req.params.commentId);
    
    // Emit real-time event to all clients in the task room
    const io = getIO();
    io.to(`task:${req.params.taskId}`).emit('comment_deleted', {
      taskId: req.params.taskId,
      commentId: req.params.commentId,
      comment: updatedComment ? {
        id: updatedComment.id,
        isDeleted: true,
      } : null,
    });
    logger.info(`Emitted comment_deleted event to room: task:${req.params.taskId}`);
    
    res.json({ message: 'Comment recalled successfully' });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
