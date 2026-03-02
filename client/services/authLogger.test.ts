/**
 * Authentication Logger Tests
 * Tests for comprehensive authentication logging and debugging
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authLogger, AuthLogLevel, AuthOperation } from './authLogger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console methods
const consoleMock = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
Object.defineProperty(console, 'debug', { value: consoleMock.debug });
Object.defineProperty(console, 'info', { value: consoleMock.info });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });
Object.defineProperty(console, 'error', { value: consoleMock.error });

describe('AuthLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authLogger.clearLogs();
    
    // Mock environment
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log messages with correct structure', () => {
      authLogger.info(AuthOperation.LOGIN, 'Test login message', { userId: 123 });
      
      const logs = authLogger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.level).toBe(AuthLogLevel.INFO);
      expect(log.operation).toBe(AuthOperation.LOGIN);
      expect(log.message).toBe('Test login message');
      expect(log.details).toEqual({ userId: 123 });
      expect(log.timestamp).toBeDefined();
      expect(log.sessionId).toBeDefined();
    });

    it('should sanitize sensitive information in messages', () => {
      authLogger.info(AuthOperation.LOGIN, 'Login with token: abc123token and password: secret123');
      
      const logs = authLogger.getRecentLogs(1);
      const log = logs[0];
      
      expect(log.message).toBe('Login with token: [REDACTED] and password: [REDACTED]');
    });

    it('should sanitize sensitive information in details', () => {
      authLogger.info(AuthOperation.LOGIN, 'Login attempt', {
        email: 'user@example.com',
        password: 'secret123',
        token: 'abc123token',
        userId: 123
      });
      
      const logs = authLogger.getRecentLogs(1);
      const log = logs[0];
      
      expect(log.details).toEqual({
        email: '[REDACTED]',
        password: '[REDACTED]',
        token: '[REDACTED]',
        userId: 123
      });
    });

    it('should handle nested object sanitization', () => {
      authLogger.info(AuthOperation.LOGIN, 'Login attempt', {
        user: {
          email: 'user@example.com',
          password: 'secret123',
          id: 123
        },
        auth: {
          token: 'abc123token'
        }
      });
      
      const logs = authLogger.getRecentLogs(1);
      const log = logs[0];
      
      expect(log.details).toEqual({
        user: {
          email: '[REDACTED]',
          password: '[REDACTED]',
          id: 123
        },
        auth: {
          token: '[REDACTED]'
        }
      });
    });
  });

  describe('Log Levels', () => {
    it('should support all log levels', () => {
      authLogger.debug(AuthOperation.TOKEN_VALIDATION, 'Debug message');
      authLogger.info(AuthOperation.LOGIN, 'Info message');
      authLogger.warn(AuthOperation.TOKEN_REFRESH, 'Warning message');
      authLogger.error(AuthOperation.LOGIN, 'Error message', {}, new Error('Test error'));
      
      const logs = authLogger.getRecentLogs(4);
      expect(logs).toHaveLength(4);
      
      expect(logs[0].level).toBe(AuthLogLevel.DEBUG);
      expect(logs[1].level).toBe(AuthLogLevel.INFO);
      expect(logs[2].level).toBe(AuthLogLevel.WARN);
      expect(logs[3].level).toBe(AuthLogLevel.ERROR);
    });

    it('should output to console in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      authLogger.debug(AuthOperation.LOGIN, 'Debug message');
      authLogger.info(AuthOperation.LOGIN, 'Info message');
      authLogger.warn(AuthOperation.LOGIN, 'Warning message');
      authLogger.error(AuthOperation.LOGIN, 'Error message', {}, new Error('Test error'));
      
      expect(consoleMock.debug).toHaveBeenCalled();
      expect(consoleMock.info).toHaveBeenCalled();
      expect(consoleMock.warn).toHaveBeenCalled();
      expect(consoleMock.error).toHaveBeenCalled();
    });
  });

  describe('Operation Logging', () => {
    it('should log timed operations successfully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await authLogger.logOperation(
        AuthOperation.LOGIN,
        'Test operation',
        mockOperation
      );
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalled();
      
      const logs = authLogger.getRecentLogs(2);
      expect(logs).toHaveLength(2);
      
      // Should have start and completion logs
      expect(logs[0].message).toContain('Starting Test operation');
      expect(logs[1].message).toContain('Test operation completed successfully');
      expect(logs[1].duration).toBeDefined();
    });

    it('should log timed operations with errors', async () => {
      const testError = new Error('Operation failed');
      const mockOperation = vi.fn().mockRejectedValue(testError);
      
      await expect(
        authLogger.logOperation(
          AuthOperation.LOGIN,
          'Test operation',
          mockOperation
        )
      ).rejects.toThrow('Operation failed');
      
      const logs = authLogger.getRecentLogs(2);
      expect(logs).toHaveLength(2);
      
      // Should have start and failure logs
      expect(logs[0].message).toContain('Starting Test operation');
      expect(logs[1].message).toContain('Test operation failed');
      expect(logs[1].error).toBeDefined();
      expect(logs[1].duration).toBeDefined();
    });
  });

  describe('Debug Information', () => {
    beforeEach(() => {
      // Mock localStorage for debug info
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'mock.jwt.token';
        if (key === 'user') return JSON.stringify({ id: 123, email: 'test@example.com' });
        return null;
      });
    });

    it('should provide comprehensive debug information', () => {
      // Add some logs first
      authLogger.info(AuthOperation.LOGIN, 'Login successful');
      authLogger.error(AuthOperation.TOKEN_REFRESH, 'Refresh failed', {}, new Error('Test error'));
      
      const debugInfo = authLogger.getDebugInfo();
      
      expect(debugInfo).toMatchObject({
        sessionId: expect.any(String),
        isAuthenticated: true,
        tokenExists: true,
        userExists: true,
        storageAvailable: expect.any(Boolean),
        authStateHistory: expect.any(Array),
        performanceMetrics: expect.any(Object)
      });
      
      expect(debugInfo.authStateHistory.length).toBeGreaterThan(0);
    });

    it('should calculate performance metrics correctly', async () => {
      // Simulate some operations with timing
      await authLogger.logOperation(AuthOperation.LOGIN, 'Login 1', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      });
      
      await authLogger.logOperation(AuthOperation.LOGIN, 'Login 2', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'success';
      });
      
      const debugInfo = authLogger.getDebugInfo();
      expect(debugInfo.performanceMetrics.averageLoginTime).toBeGreaterThan(0);
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      // Add various logs for filtering tests
      authLogger.debug(AuthOperation.TOKEN_VALIDATION, 'Debug message');
      authLogger.info(AuthOperation.LOGIN, 'Login message');
      authLogger.warn(AuthOperation.TOKEN_REFRESH, 'Warning message');
      authLogger.error(AuthOperation.LOGOUT, 'Error message');
      authLogger.info(AuthOperation.LOGIN, 'Another login message');
    });

    it('should filter logs by operation', () => {
      const loginLogs = authLogger.getLogsByOperation(AuthOperation.LOGIN);
      expect(loginLogs).toHaveLength(2);
      expect(loginLogs.every(log => log.operation === AuthOperation.LOGIN)).toBe(true);
    });

    it('should get error logs only', () => {
      const errorLogs = authLogger.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(AuthLogLevel.ERROR);
    });

    it('should limit recent logs count', () => {
      const recentLogs = authLogger.getRecentLogs(3);
      expect(recentLogs).toHaveLength(3);
    });
  });

  describe('Log Management', () => {
    it('should export logs in correct format', () => {
      authLogger.info(AuthOperation.LOGIN, 'Test message');
      
      const exportedData = authLogger.exportLogs();
      const parsed = JSON.parse(exportedData);
      
      expect(parsed).toMatchObject({
        sessionId: expect.any(String),
        exportTime: expect.any(String),
        debugInfo: expect.any(Object),
        logs: expect.any(Array)
      });
      
      expect(parsed.logs.length).toBeGreaterThan(0);
    });

    it('should clear logs when requested', () => {
      authLogger.info(AuthOperation.LOGIN, 'Test message');
      expect(authLogger.getRecentLogs().length).toBeGreaterThan(0);
      
      authLogger.clearLogs();
      
      // Should only have the "logs cleared" message
      const logs = authLogger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toContain('cleared');
    });

    it('should maintain maximum log limit', () => {
      // Add more logs than the limit (assuming 1000 is the limit)
      for (let i = 0; i < 1100; i++) {
        authLogger.info(AuthOperation.LOGIN, `Message ${i}`);
      }
      
      const logs = authLogger.getRecentLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      expect(() => {
        authLogger.getDebugInfo();
      }).not.toThrow();
    });

    it('should handle JSON parsing errors gracefully', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'user') return 'invalid json';
        return null;
      });
      
      expect(() => {
        authLogger.getDebugInfo();
      }).not.toThrow();
    });
  });

  describe('Security', () => {
    it('should not log sensitive data in production', () => {
      process.env.NODE_ENV = 'production';
      
      authLogger.info(AuthOperation.LOGIN, 'Login with password: secret123', {
        password: 'secret123',
        token: 'abc123token'
      });
      
      const logs = authLogger.getRecentLogs(1);
      const log = logs[0];
      
      expect(log.message).not.toContain('secret123');
      expect(log.details?.password).toBe('[REDACTED]');
      expect(log.details?.token).toBe('[REDACTED]');
    });

    it('should sanitize error messages', () => {
      const error = new Error('Authentication failed for token: abc123token');
      
      authLogger.error(AuthOperation.LOGIN, 'Login failed', {}, error);
      
      const logs = authLogger.getRecentLogs(1);
      const log = logs[0];
      
      expect(log.error?.message).not.toContain('abc123token');
      expect(log.error?.message).toContain('[REDACTED]');
    });
  });
});