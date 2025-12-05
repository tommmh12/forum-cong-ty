import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../../shared/types/user.types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department?: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware that verifies the user's token
 * and attaches user information to the request object.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn(`No authorization header for ${req.method} ${req.path}`);
      res.status(401).json({ 
        error: 'UNAUTHORIZED',
        message: 'No authorization header provided'
      });
      return;
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.warn(`Invalid authorization header format for ${req.method} ${req.path}`);
      res.status(401).json({ 
        error: 'UNAUTHORIZED',
        message: 'Invalid authorization header format. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    // Verify token and get user
    const user = await verifyToken(token);

    if (!user) {
      logger.warn(`Token verification failed for ${req.method} ${req.path}`);
      res.status(401).json({ 
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    logger.info(`Authenticated user ${user.id} for ${req.method} ${req.path}`);
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: 'UNAUTHORIZED',
      message: 'Authentication failed'
    });
  }
};

/**
 * Verifies a token and returns the associated user.
 * Uses real JWT verification with signature and expiry checks.
 * In development mode, also supports mock tokens for testing.
 */
async function verifyToken(token: string): Promise<User | null> {
  if (!token || token === 'invalid') {
    return null;
  }

  // In development mode only: support mock tokens for testing
  if (env.nodeEnv === 'development' && token.startsWith('mock-')) {
    const parts = token.split('-');
    if (parts.length >= 3) {
      const role = parts[1].toUpperCase();
      const userId = parts[2];
      
      if (['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
        return {
          id: userId,
          name: `Test ${role.charAt(0) + role.slice(1).toLowerCase()}`,
          email: `${role.toLowerCase()}@nexus.com`,
          avatarUrl: '',
          department: 'Engineering',
          role: role as User['role'],
        };
      }
    }
  }

  // Real JWT verification
  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JWTPayload;
    
    return {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      avatarUrl: decoded.avatarUrl || '',
      department: decoded.department || '',
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.error('Token expired:', {
        exp: (error as any).expiredAt,
        now: new Date(),
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.error('Invalid token:', {
        message: error.message,
        name: error.name,
      });
    } else {
      logger.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    department: user.department,
    role: user.role,
  };
  
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Optional authentication middleware.
 * Attaches user to request if token is valid, but doesn't block if missing.
 */
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const user = await verifyToken(parts[1]);
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Don't block on errors for optional auth
    next();
  }
};

export default authMiddleware;
