import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let ioInstance: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        env.frontendUrl,
        'http://localhost:3000',
        'http://localhost:5173',
      ],
      credentials: true,
    },
  });

  // Socket.IO connection handling
  ioInstance.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Handle joining a task room
    socket.on('join_task', (taskId: string) => {
      if (taskId) {
        socket.join(`task:${taskId}`);
        logger.info(`Socket ${socket.id} joined room: task:${taskId}`);
      }
    });

    // Handle leaving a task room
    socket.on('leave_task', (taskId: string) => {
      if (taskId) {
        socket.leave(`task:${taskId}`);
        logger.info(`Socket ${socket.id} left room: task:${taskId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return ioInstance;
}

export default getIO;

