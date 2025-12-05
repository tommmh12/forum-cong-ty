import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '../../../../shared/types';
import { useAuthContext } from '../../features/auth/context/AuthContext';

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard component that checks user role before rendering children.
 * If user is not authenticated, redirects to login.
 * If user role is not in allowedRoles, shows fallback or redirects.
 * 
 * @param allowedRoles - Array of roles that are allowed to access the content
 * @param children - Content to render if access is granted
 * @param fallback - Optional fallback content to show if access is denied
 * @param redirectTo - Optional path to redirect if access is denied (default: '/unauthorized')
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback,
  redirectTo = '/unauthorized',
}) => {
  const { user, isAuthenticated } = useAuthContext();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is in the allowed roles
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    // If fallback is provided, render it
    if (fallback) {
      return <>{fallback}</>;
    }
    // Otherwise redirect to the specified path
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * Helper function to check if a user role has access to a route
 * Useful for conditional rendering without the full guard component
 */
export const hasRoleAccess = (userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

export default RoleGuard;
