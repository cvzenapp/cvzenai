/**
 * Authentication State Management Hook
 * Provides utilities for managing authentication state across page navigation
 */

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import { useNavigate, useLocation } from 'react-router-dom';

export interface UseAuthStateReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  
  // Actions
  ensureAuth: () => Promise<boolean>;
  requireAuth: () => Promise<void>;
  redirectToLogin: () => void;
  
  // Utilities
  isProtectedRoute: (path?: string) => boolean;
}

/**
 * Hook for managing authentication state across page navigation
 */
export const useAuthState = (): UseAuthStateReturn => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Ensure authentication state is properly initialized
   */
  const ensureAuth = useCallback(async (): Promise<boolean> => {
    return await unifiedAuthService.ensureAuthState();
  }, []);

  /**
   * Require authentication - redirect to login if not authenticated
   */
  const requireAuth = useCallback(async (): Promise<void> => {
    const isAuth = await ensureAuth();
    if (!isAuth) {
      redirectToLogin();
    }
  }, [ensureAuth]);

  /**
   * Redirect to login page with current location
   */
  const redirectToLogin = useCallback((): void => {
    navigate('/login', { 
      state: { from: location },
      replace: true 
    });
  }, [navigate, location]);

  /**
   * Check if a route requires authentication
   */
  const isProtectedRoute = useCallback((path?: string): boolean => {
    const routePath = path || location.pathname;
    const protectedRoutes = [
      '/dashboard',
      '/builder',
      '/profile',
      '/resume',
      '/recruiter/dashboard'
    ];
    
    return protectedRoutes.some(route => routePath.startsWith(route));
  }, [location.pathname]);

  // Auto-check authentication for protected routes
  useEffect(() => {
    if (isProtectedRoute() && !auth.isLoading) {
      requireAuth();
    }
  }, [location.pathname, auth.isLoading, isProtectedRoute, requireAuth]);

  return {
    // State
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    
    // Actions
    ensureAuth,
    requireAuth,
    redirectToLogin,
    
    // Utilities
    isProtectedRoute,
  };
};

export default useAuthState;