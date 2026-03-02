/**
 * API Hook with Automatic Token Refresh
 * Provides API calling capabilities with automatic token refresh
 */

import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTokenRefresh } from './useTokenRefresh';

export interface ApiCallOptions {
  /**
   * Whether to ensure token is valid before making the call
   * @default true
   */
  ensureValidToken?: boolean;
  
  /**
   * Whether to retry the call once if it fails with 401
   * @default true
   */
  retryOnAuthFailure?: boolean;
  
  /**
   * Custom error handler for authentication failures
   */
  onAuthFailure?: (error: string) => void;
}

export interface UseApiWithTokenRefreshReturn {
  /**
   * Make an API call with automatic token refresh
   */
  callApi: <T>(
    apiCall: () => Promise<T>,
    options?: ApiCallOptions
  ) => Promise<T>;
  
  /**
   * Check if token is valid and refresh if needed
   */
  ensureValidToken: () => Promise<boolean>;
  
  /**
   * Manually refresh token
   */
  refreshToken: () => Promise<boolean>;
  
  /**
   * Check if token is expired
   */
  isTokenExpired: () => boolean;
}

export const useApiWithTokenRefresh = (): UseApiWithTokenRefreshReturn => {
  const { isAuthenticated, logout } = useAuth();
  const { 
    ensureValidToken: tokenEnsureValid, 
    refreshToken: tokenRefresh,
    isTokenExpired
  } = useTokenRefresh();

  /**
   * Make an API call with automatic token refresh
   */
  const callApi = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const {
      ensureValidToken = true,
      retryOnAuthFailure = true,
      onAuthFailure
    } = options;

    // Check authentication
    if (!isAuthenticated) {
      const error = 'User not authenticated';
      onAuthFailure?.(error);
      throw new Error(error);
    }

    // Ensure token is valid before making the call
    if (ensureValidToken) {
      const tokenValid = await tokenEnsureValid();
      if (!tokenValid) {
        const error = 'Unable to refresh authentication token';
        onAuthFailure?.(error);
        throw new Error(error);
      }
    }

    try {
      // Make the API call
      return await apiCall();
    } catch (error) {
      // Check if it's an authentication error and we should retry
      if (retryOnAuthFailure && isAuthenticationError(error)) {
        try {
          // Try to refresh token
          const refreshed = await tokenRefresh();
          if (refreshed) {
            // Retry the API call once
            return await apiCall();
          } else {
            // Refresh failed, logout user
            await logout();
            const authError = 'Authentication session expired';
            onAuthFailure?.(authError);
            throw new Error(authError);
          }
        } catch (refreshError) {
          // Refresh or retry failed, logout user
          await logout();
          const authError = 'Authentication session expired';
          onAuthFailure?.(authError);
          throw new Error(authError);
        }
      }

      // Re-throw the original error if it's not an auth error or retry is disabled
      throw error;
    }
  }, [isAuthenticated, tokenEnsureValid, tokenRefresh, logout]);

  /**
   * Ensure token is valid
   */
  const ensureValidToken = useCallback(async (): Promise<boolean> => {
    return tokenEnsureValid();
  }, [tokenEnsureValid]);

  /**
   * Refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    return tokenRefresh();
  }, [tokenRefresh]);

  return {
    callApi,
    ensureValidToken,
    refreshToken,
    isTokenExpired
  };
};

/**
 * Check if an error is an authentication error
 */
function isAuthenticationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('401') ||
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('token')
    );
  }
  
  // Check if it's a response object with status
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    return (
      errorObj.status === 401 ||
      errorObj.statusCode === 401 ||
      (typeof errorObj.success === 'boolean' && !errorObj.success && 
       typeof errorObj.error === 'string' && 
       errorObj.error.toLowerCase().includes('auth'))
    );
  }
  
  return false;
}

export default useApiWithTokenRefresh;