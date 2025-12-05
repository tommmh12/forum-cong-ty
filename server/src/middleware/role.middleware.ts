import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../../../shared/types/user.types';
import { ROLE_HIERARCHY } from '../../../shared/constants/roles';

/**
 * Role-based authorization middleware factory.
 * Creates middleware that checks if the authenticated user has one of the allowed roles.
 * 
 * @param allowedRoles - Array of roles that are permitted to access the route
 * @returns Express middleware function
 * 
 * @example
 * // Only admins can access
 * router.get('/admin-only', authMiddleware, roleMiddleware([UserRole.ADMIN]), handler);
 * 
 * // Admins and managers can access
 * router.get('/management', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.MANAGER]), handler);
 */
export const roleMiddleware = (allowedRoles: UserRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    const userRole = req.user.role;

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Minimum role level middleware factory.
 * Creates middleware that checks if the user has at least the specified role level.
 * Uses role hierarchy: ADMIN > MANAGER > EMPLOYEE
 * 
 * @param minimumRole - The minimum role required to access the route
 * @returns Express middleware function
 * 
 * @example
 * // Managers and above (MANAGER, ADMIN) can access
 * router.get('/reports', authMiddleware, requireMinimumRole(UserRole.MANAGER), handler);
 */
export const requireMinimumRole = (minimumRole: UserRole): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user.role];
    const requiredRoleLevel = ROLE_HIERARCHY[minimumRole];

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Minimum role required: ${minimumRole}`
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware shorthand.
 * Restricts access to users with ADMIN role only.
 */
export const adminOnly: RequestHandler = roleMiddleware([UserRole.ADMIN]);

/**
 * Manager and above middleware shorthand.
 * Restricts access to users with MANAGER or ADMIN roles.
 */
export const managerAndAbove: RequestHandler = roleMiddleware([
  UserRole.ADMIN,
  UserRole.MANAGER
]);

/**
 * Any authenticated user middleware shorthand.
 * Allows access to any authenticated user regardless of role.
 */
export const anyAuthenticated: RequestHandler = roleMiddleware([
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EMPLOYEE
]);

export default roleMiddleware;
