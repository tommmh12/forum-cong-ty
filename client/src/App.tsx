import React from 'react';
import { AuthProvider, useAuth, ChangePasswordModal } from './features/auth';
import { LoginScreen } from './features/auth/components/LoginScreen';
import { Dashboard } from './features/dashboard/shared/Dashboard';
import { User, UserRole } from '../../shared/types';

/**
 * Main application content that uses auth context
 */
const AppContent: React.FC = () => {
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
  } = useAuth();

  // Handle first login password change completion
  const handlePasswordChangeSuccess = (userData: any, token?: string) => {
    const newUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl || '',
      department: userData.department || '',
      role: userData.role as UserRole,
    };
    completeFirstLogin(newUser, token);
  };

  // Show dashboard when authenticated
  if (isAuthenticated && user) {
    return <Dashboard user={user} onLogout={logout} />;
  }

  // Show login screen with optional password change modal
  return (
    <>
      <LoginScreen 
        onLogin={login}
        onGoogleLogin={loginWithGoogle}
        status={status} 
        errorMessage={errorMessage} 
      />
      {firstLoginData && (
        <ChangePasswordModal
          userId={firstLoginData.userId}
          isFirstLogin={true}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={clearFirstLogin}
        />
      )}
    </>
  );
};

/**
 * Root App component with AuthProvider wrapper
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
