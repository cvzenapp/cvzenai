/**
 * Authentication Debug Hook
 * Provides easy access to authentication debugging functionality
 * Requirements: 6.2, 6.3
 */

import { useState, useEffect, useCallback } from 'react';
import { authLogger, AuthDebugInfo, AuthLogEntry, AuthOperation } from '../services/authLogger';
import { useAuth } from '../contexts/AuthContext';

export interface AuthDebugHook {
  // Debug info
  debugInfo: AuthDebugInfo | null;
  isDebugMode: boolean;
  
  // Actions
  refreshDebugInfo: () => void;
  exportLogs: () => void;
  clearLogs: () => void;
  toggleDebugMode: () => void;
  
  // Filtered data
  getFilteredLogs: (level?: string, operation?: string) => AuthLogEntry[];
  getErrorLogs: () => AuthLogEntry[];
  getPerformanceMetrics: () => AuthDebugInfo['performanceMetrics'];
  
  // Test operations
  testOperations: {
    testTokenValidation: () => Promise<void>;
    testTokenRefresh: () => Promise<void>;
    testUserFetch: () => Promise<void>;
    testStorageAccess: () => void;
  };
}

export const useAuthDebug = (): AuthDebugHook => {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(() => {
    return process.env.NODE_ENV === 'development' && 
           localStorage.getItem('auth_debug_mode') === 'true';
  });
  
  const auth = useAuth();

  // Refresh debug info
  const refreshDebugInfo = useCallback(() => {
    const info = authLogger.getDebugInfo();
    setDebugInfo(info);
    
    authLogger.debug(AuthOperation.STATE_CHANGE, 'Debug info refreshed', {
      logCount: info.authStateHistory.length,
      isAuthenticated: info.isAuthenticated
    });
  }, []);

  // Auto-refresh debug info when in debug mode
  useEffect(() => {
    if (!isDebugMode) return;

    refreshDebugInfo();
    
    const interval = setInterval(refreshDebugInfo, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [isDebugMode, refreshDebugInfo]);

  // Export logs
  const exportLogs = useCallback(() => {
    try {
      const logsData = authLogger.exportLogs();
      const blob = new Blob([logsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auth-debug-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      authLogger.info(AuthOperation.STATE_CHANGE, 'Debug logs exported');
    } catch (error) {
      authLogger.error(AuthOperation.STATE_CHANGE, 'Failed to export logs', {}, error as Error);
    }
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    authLogger.clearLogs();
    refreshDebugInfo();
    authLogger.info(AuthOperation.STATE_CHANGE, 'Debug logs cleared by user');
  }, [refreshDebugInfo]);

  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    const newMode = !isDebugMode;
    setIsDebugMode(newMode);
    localStorage.setItem('auth_debug_mode', newMode.toString());
    
    authLogger.info(AuthOperation.STATE_CHANGE, `Debug mode ${newMode ? 'enabled' : 'disabled'}`);
    
    if (newMode) {
      refreshDebugInfo();
    }
  }, [isDebugMode, refreshDebugInfo]);

  // Get filtered logs
  const getFilteredLogs = useCallback((level?: string, operation?: string): AuthLogEntry[] => {
    if (!debugInfo) return [];

    let logs = debugInfo.authStateHistory;

    if (level && level !== 'all') {
      logs = logs.filter(log => log.level === level);
    }

    if (operation && operation !== 'all') {
      logs = logs.filter(log => log.operation === operation);
    }

    return logs.reverse(); // Show newest first
  }, [debugInfo]);

  // Get error logs
  const getErrorLogs = useCallback((): AuthLogEntry[] => {
    return authLogger.getErrorLogs();
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback((): AuthDebugInfo['performanceMetrics'] => {
    return debugInfo?.performanceMetrics || {
      averageLoginTime: 0,
      averageTokenRefreshTime: 0,
      failureRate: 0
    };
  }, [debugInfo]);

  // Test operations
  const testOperations = {
    testTokenValidation: async () => {
      authLogger.info(AuthOperation.TOKEN_VALIDATION, 'Manual token validation test triggered');
      try {
        const result = await auth.ensureValidToken();
        authLogger.info(AuthOperation.TOKEN_VALIDATION, 'Token validation test completed', {
          result
        });
      } catch (error) {
        authLogger.error(AuthOperation.TOKEN_VALIDATION, 'Token validation test failed', {}, error as Error);
      }
    },

    testTokenRefresh: async () => {
      authLogger.info(AuthOperation.TOKEN_REFRESH, 'Manual token refresh test triggered');
      try {
        const result = await auth.refreshToken();
        authLogger.info(AuthOperation.TOKEN_REFRESH, 'Token refresh test completed', {
          success: result.success
        });
      } catch (error) {
        authLogger.error(AuthOperation.TOKEN_REFRESH, 'Token refresh test failed', {}, error as Error);
      }
    },

    testUserFetch: async () => {
      authLogger.info(AuthOperation.USER_FETCH, 'Manual user fetch test triggered');
      try {
        const user = await auth.getCurrentUser();
        authLogger.info(AuthOperation.USER_FETCH, 'User fetch test completed', {
          hasUser: !!user,
          userId: user?.id
        });
      } catch (error) {
        authLogger.error(AuthOperation.USER_FETCH, 'User fetch test failed', {}, error as Error);
      }
    },

    testStorageAccess: () => {
      authLogger.info(AuthOperation.STORAGE_ACCESS, 'Manual storage access test triggered');
      try {
        // Test localStorage access
        const testKey = 'auth_debug_test';
        const testValue = Date.now().toString();
        
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        authLogger.info(AuthOperation.STORAGE_ACCESS, 'Storage access test completed', {
          success: retrieved === testValue,
          testValue,
          retrieved
        });
      } catch (error) {
        authLogger.error(AuthOperation.STORAGE_ACCESS, 'Storage access test failed', {}, error as Error);
      }
    }
  };

  return {
    debugInfo,
    isDebugMode,
    refreshDebugInfo,
    exportLogs,
    clearLogs,
    toggleDebugMode,
    getFilteredLogs,
    getErrorLogs,
    getPerformanceMetrics,
    testOperations
  };
};

export default useAuthDebug;