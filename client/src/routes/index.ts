import { UserRole } from '../../../shared/types';

/**
 * Route configuration with role-based access control
 */

export interface RouteConfig {
  path: string;
  allowedRoles: UserRole[];
  title: string;
}

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes: RouteConfig[] = [
  { path: '/login', allowedRoles: [], title: 'Login' },
];

/**
 * Protected routes - require authentication and specific roles
 */
export const protectedRoutes: RouteConfig[] = [
  // Dashboard routes
  {
    path: '/dashboard',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Dashboard',
  },
  {
    path: '/dashboard/overview',
    allowedRoles: [UserRole.ADMIN],
    title: 'Admin Overview',
  },
  {
    path: '/dashboard/resources',
    allowedRoles: [UserRole.ADMIN],
    title: 'Resource Management',
  },

  // Projects routes
  {
    path: '/projects',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Projects',
  },
  {
    path: '/projects/:id',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Project Detail',
  },
  {
    path: '/projects/settings',
    allowedRoles: [UserRole.ADMIN],
    title: 'Task Settings',
  },
  {
    path: '/projects/workflow',
    allowedRoles: [UserRole.ADMIN],
    title: 'Workflow Designer',
  },

  // Employee routes
  {
    path: '/employees',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
    title: 'Employee List',
  },

  // Organization routes
  {
    path: '/organization',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Organization',
  },
  {
    path: '/organization/chart',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Organization Chart',
  },
  {
    path: '/organization/departments',
    allowedRoles: [UserRole.ADMIN],
    title: 'Department Management',
  },
  {
    path: '/organization/users',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
    title: 'User Management',
  },

  // Workspace routes
  {
    path: '/workspace',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Workspace',
  },
  {
    path: '/workspace/meetings',
    allowedRoles: [UserRole.ADMIN],
    title: 'Meeting Administration',
  },
  {
    path: '/workspace/rooms',
    allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
    title: 'Room Booking',
  },
];

/**
 * Get route configuration by path
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return [...publicRoutes, ...protectedRoutes].find(route => route.path === path);
};

/**
 * Check if a route is accessible by a given role
 */
export const isRouteAccessible = (path: string, role: UserRole): boolean => {
  const route = getRouteConfig(path);
  if (!route) return false;
  if (route.allowedRoles.length === 0) return true; // Public route
  return route.allowedRoles.includes(role);
};

/**
 * Get all routes accessible by a given role
 */
export const getAccessibleRoutes = (role: UserRole): RouteConfig[] => {
  return protectedRoutes.filter(route => route.allowedRoles.includes(role));
};

/**
 * Fallback paths for unauthorized access
 */
export const FALLBACK_PATHS = {
  unauthorized: '/unauthorized',
  login: '/login',
  dashboard: '/dashboard',
} as const;

export { RoleGuard, hasRoleAccess } from './guards/RoleGuard';
export type { RoleGuardProps } from './guards/RoleGuard';
export { UnauthorizedPage } from './pages/UnauthorizedPage';
