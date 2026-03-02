/**
 * Token Refresh Hook
 * Provides utilities for automatic token refresh and validation
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface UseTokenRefreshOptions {
  /**
   * Whether to automatically refresh tokens when they're about to expire
   * @default true
   */
  autoRefresh?: boolean;
  
  /**
   * How many minutes before expiration to trigger refresh
   * @default 5
   */
  refreshBufferMinutes?: number;
  
  /**
   * Callback when token refresh succeeds
   */
  onRefreshSuccess?: () => void;
  
  /**
   * Callback when token refresh fails
   */
  onRefreshFailure?: (error: string) => void;
}

export interface UseTokenRefreshReturn {
  /**
   * Check if the current token is expired or expiring soon
   */
  isTokenExpired: () => boolean;
  
  /**
   * Get the token expiration date
   */
  getTokenExpiration: () => Date | null;
  
  /**
   * Manually refresh the token
   */
  refreshToken: () => Promise<boolean>;
  
  /**
   * Ensure the token is valid, refreshing if necessary
   */
  ensureValidToken: () => Promise<boolean>;
  
  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiration: () => number | null;
}

export const useTokenRefresh = (options: UseTokenRefreshOptions = {}): UseTokenRefreshReturn => {
  const {
    autoRefresh = true,
    refreshBufferMinutes = 5,
    onRefreshSuccess,
    onRefreshFailure
  } = options;

  const {
    isTokenExpired: authIsTokenExpired,
    getTokenExpiration: authGetTokenExpiration,
    refreshToken: authRefreshToken,
    ensureValidToken: authEnsureValidToken,
    isAuthenticated
  } = useAuth();

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const lastRefreshAttemptRef = useRef<number>(0);

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback((): boolean => {
    return authIsTokenExpired();
  }, [authIsTokenExpired]);

  /**
   * Get token expiration date
   */
  const getTokenExpiration = useCallback((): Date | null => {
    return authGetTokenExpiration();
  }, [authGetTokenExpiration]);

  /**
   * Get time until token expires
   */
  const getTimeUntilExpiration = useCallback((): number | null => {
    const expiration = getTokenExpiration();
    if (!expiration) return null;
    
    return expiration.getTime() - Date.now();
  }, [getTokenExpiration]);

  /**
   * Manually refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent multiple rapid refresh attempts
    const now = Date.now();
    if (now - lastRefreshAttemptRef.current < 5000) { // 5 second cooldown
      return false;
    }
    
    lastRefreshAttemptRef.current = now;

    try {
      const result = await authRefreshToken();
      if (result.success) {
        onRefreshSuccess?.();
        return true;
      } else {
        onRefreshFailure?.(result.message || 'Token refresh failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      onRefreshFailure?.(errorMessage);
      return false;
    }
  }, [authRefreshToken, onRefreshSuccess, onRefreshFailure]);

  /**
   * Ensure token is valid
   */
  const ensureValidToken = useCallback(async (): Promise<boolean> => {
    return authEnsureValidToken();
  }, [authEnsureValidToken]);

  /**
   * Schedule automatic token refresh
   */
  const scheduleTokenRefresh = useCallback(() => {
    if (!autoRefresh || !isAuthenticated) {
      return;
    }

    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const timeUntilExpiration = getTimeUntilExpiration();
    if (timeUntilExpiration === null) {
      return;
    }

    // Schedule refresh for buffer time before expiration
    const refreshTime = timeUntilExpiration - (refreshBufferMinutes * 60 * 1000);
    
    // Don't schedule if token is already expired or refresh time is too soon
    if (refreshTime <= 0) {
      // Token is expired or expiring very soon, refresh immediately
      refreshToken();
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshToken();
    }, refreshTime);
  }, [autoRefresh, isAuthenticated, getTimeUntilExpiration, refreshBufferMinutes, refreshToken]);

  // Set up automatic refresh scheduling
  useEffect(() => {
    scheduleTokenRefresh();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleTokenRefresh]);

  // Re-schedule when authentication state changes
  useEffect(() => {
    scheduleTokenRefresh();
  }, [isAuthenticated, scheduleTokenRefresh]);

  return {
    isTokenExpired,
    getTokenExpiration,
    refreshToken,
    ensureValidToken,
    getTimeUntilExpiration
  };
};

export default useTokenRefresh;