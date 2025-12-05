import { useAuthContext } from '../context/AuthContext';
import { UserRole } from '../../../../../shared/types';

/**
 * Custom hook for authentication functionality
 * Provides access to auth state and actions
 */
export const useAuth = () => {
  const { 
    user, 
    status, 
    errorMessage, 
    firstLoginData,
    login, 
    loginWithGoogle, 
    logout, 
    completeFirstLogin,
    clearFirstLogin,
    isAuthenticated 
  } = useAuthContext();

  /**
   * Check if the current user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  /**
   * Check if the current user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  /**
   * Check if the current user is an admin
   */
  const isAdmin = (): boolean => {
    return hasRole(UserRole.ADMIN);
  };

  /**
   * Check if the current user is a manager
   */
  const isManager = (): boolean => {
    return hasRole(UserRole.MANAGER);
  };

  /**
   * Check if the current user is an employee
   */
  const isEmployee = (): boolean => {
    return hasRole(UserRole.EMPLOYEE);
  };

  /**
   * Check if the current user has manager-level access (admin or manager)
   */
  const hasManagerAccess = (): boolean => {
    return hasAnyRole([UserRole.ADMIN, UserRole.MANAGER]);
  };

  return {
    // State
    user,
    status,
    errorMessage,
    firstLoginData,
    isAuthenticated,
    
    // Actions
    login,
    loginWithGoogle,
    logout,
    completeFirstLogin,
    clearFirstLogin,
    
    // Role checks
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isEmployee,
    hasManagerAccess,
  };
};
