import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, AuthStatus, AuthState, UserRole } from '../../../../../shared/types';

// Use environment variable for API URL, with fallback for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN_KEY = 'auth_token';

export interface FirstLoginData {
  userId: string;
  message: string;
}

interface ExtendedAuthState extends AuthState {
  token: string | null;
}

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  errorMessage: string | null;
  token: string | null;
  firstLoginData: FirstLoginData | null;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  completeFirstLogin: (user: User, token?: string) => void;
  clearFirstLogin: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<ExtendedAuthState>(() => {
    // Initialize from localStorage if available
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        return {
          status: AuthStatus.SUCCESS,
          user: JSON.parse(storedUser),
          errorMessage: null,
          token: storedToken,
        };
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('user');
      }
    }
    return {
      status: AuthStatus.IDLE,
      user: null,
      errorMessage: null,
      token: null,
    };
  });
  const [firstLoginData, setFirstLoginData] = useState<FirstLoginData | null>(null);

  const login = useCallback(async (email: string, password?: string): Promise<void> => {
    setAuthState((prev: ExtendedAuthState) => ({
      ...prev,
      status: AuthStatus.LOADING,
      errorMessage: null,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthState({
          status: AuthStatus.ERROR,
          user: null,
          errorMessage: data.message || 'Đăng nhập thất bại.',
          token: null,
        });
        return;
      }

      // Check if first login - need to change password
      if (data.requirePasswordChange) {
        setFirstLoginData({
          userId: data.userId,
          message: data.message,
        });
        setAuthState({
          status: AuthStatus.IDLE,
          user: null,
          errorMessage: null,
          token: null,
        });
        return;
      }

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        department: data.user.department,
        role: data.user.role as UserRole,
      };

      // Store token and user in localStorage
      if (!data.token) {
        console.error('No token received from server');
        setAuthState({
          status: AuthStatus.ERROR,
          user: null,
          errorMessage: 'Không nhận được token từ server. Vui lòng thử lại.',
          token: null,
        });
        return;
      }
      
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        status: AuthStatus.SUCCESS,
        user,
        errorMessage: null,
        token: data.token,
      });
    } catch (error) {
      setAuthState({
        status: AuthStatus.ERROR,
        user: null,
        errorMessage: 'Đăng nhập thất bại. Vui lòng thử lại.',
        token: null,
      });
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<void> => {
    setAuthState((prev: ExtendedAuthState) => ({
      ...prev,
      status: AuthStatus.LOADING,
      errorMessage: null,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthState({
          status: AuthStatus.ERROR,
          user: null,
          errorMessage: data.message || 'Đăng nhập Google thất bại.',
          token: null,
        });
        return;
      }

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        department: data.user.department,
        role: data.user.role as UserRole,
      };

      // Store token and user in localStorage
      if (!data.token) {
        console.error('No token received from Google login');
        setAuthState({
          status: AuthStatus.ERROR,
          user: null,
          errorMessage: 'Không nhận được token từ server. Vui lòng thử lại.',
          token: null,
        });
        return;
      }
      
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem('google_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        status: AuthStatus.SUCCESS,
        user,
        errorMessage: null,
        token: data.token,
      });
    } catch (error) {
      setAuthState({
        status: AuthStatus.ERROR,
        user: null,
        errorMessage: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
        token: null,
      });
    }
  }, []);

  const logout = useCallback(() => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('google_user');
    localStorage.removeItem('user');
    setAuthState({
      status: AuthStatus.IDLE,
      user: null,
      errorMessage: null,
      token: null,
    });
    setFirstLoginData(null);
  }, []);

  const completeFirstLogin = useCallback((user: User, token?: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    setFirstLoginData(null);
    setAuthState({
      status: AuthStatus.SUCCESS,
      user,
      errorMessage: null,
      token: token || null,
    });
  }, []);

  const clearFirstLogin = useCallback(() => {
    setFirstLoginData(null);
  }, []);

  const value: AuthContextType = {
    user: authState.user,
    status: authState.status,
    errorMessage: authState.errorMessage,
    token: authState.token,
    firstLoginData,
    login,
    loginWithGoogle,
    logout,
    completeFirstLogin,
    clearFirstLogin,
    isAuthenticated: authState.status === AuthStatus.SUCCESS && authState.user !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
