/**
 * Authentication Context
 * Provides authentication state management across the React application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { unifiedAuthService, AuthState, AuthStateChangeCallback } from '../services/unifiedAuthService';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../../shared/auth';

interface AuthContextType extends AuthState {
  // Authentication actions
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResponse>;
  
  // User actions
  getCurrentUser: () => Promise<User | null>;
  
  // Token management
  isTokenExpired: () => boolean;
  getTokenExpiration: () => Date | null;
  ensureValidToken: () => Promise<boolean>;
  
  // Utility methods
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isValidated: false
  });

  useEffect(() => {
    // TEMPORARILY DISABLED to stop infinite loops
    // Subscribe to auth state changes from the service
    // const unsubscribe = unifiedAuthService.onAuthStateChange((newState: AuthState) => {
    //   setAuthState(newState);
    // });

    // Simple initialization from localStorage without service
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          isValidated: true
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isValidated: false
        });
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isValidated: false
      });
    }

    // No cleanup needed for now
    // return unsubscribe;
  }, []);

  // TEMPORARILY DISABLED automatic token refresh to stop infinite loops
  // useEffect(() => {
  //   // Token refresh monitoring disabled
  // }, [authState.isAuthenticated, authState.token]);

  // Authentication actions
  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    return unifiedAuthService.login(credentials);
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    return unifiedAuthService.register(userData);
  };

  const logout = async (): Promise<void> => {
    return unifiedAuthService.logout();
  };

  const refreshToken = async (): Promise<AuthResponse> => {
    return unifiedAuthService.refreshToken();
  };

  // User actions
  const getCurrentUser = async (): Promise<User | null> => {
    return unifiedAuthService.getCurrentUser();
  };

  // Token management
  const isTokenExpired = (): boolean => {
    return unifiedAuthService.isTokenExpired();
  };

  const getTokenExpiration = (): Date | null => {
    return unifiedAuthService.getTokenExpiration();
  };

  const ensureValidToken = async (): Promise<boolean> => {
    return unifiedAuthService.ensureValidToken();
  };

  // Utility methods
  const clearAuth = (): void => {
    unifiedAuthService.clearAuth();
  };

  const contextValue: AuthContextType = {
    // State
    ...authState,
    
    // Actions
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    
    // Token management
    isTokenExpired,
    getTokenExpiration,
    ensureValidToken,
    
    // Utility methods
    clearAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to get current user
 */
export const useCurrentUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook for authentication loading state
 */
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};

export default AuthContext;