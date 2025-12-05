import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env';
import { testConnection } from './config/database';
import apiRoutes from './routes/api.routes';
import { createWebProjectTables } from './database/web-project-schema';
import { logger } from './utils/logger';
import { initializeSocket } from './socket/socket';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const httpServer = createServer(app);
const PORT = env.port;

// Initialize Socket.IO
initializeSocket(httpServer);

// Basic middleware - Allow multiple origins for development
const allowedOrigins = [
  env.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Log disallowed origin for observability (without throwing error)
    logger.warn(`CORS: Request from disallowed origin blocked: ${origin}`);
    // Pass false to indicate origin not allowed - avoids 500 error from throwing
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  // Ensure web project tables exist
  try {
    await createWebProjectTables();
    logger.info('✅ Web project tables ready');
    
    // Initialize default workflows
    try {
      const { initializeDefaultWorkflows } = await import('./repositories/workflow.repository');
      await initializeDefaultWorkflows();
      logger.info('✅ Default workflows initialized');
    } catch (error) {
      logger.warn('⚠️  Could not initialize default workflows:', error);
    }
  } catch (error) {
    logger.warn('⚠️  Could not create web project tables:', error);
  }
  
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`📚 API available at http://localhost:${PORT}/api`);
    logger.info(`🔌 Socket.IO ready for connections`);
  });
}

startServer();

export default app;
