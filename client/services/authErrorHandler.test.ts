/**
 * Authentication Error Handler Tests
 * Tests comprehensive error handling for authentication operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthErrorHandler, AuthErrorType, AuthError } from './authErrorHandler';

describe('AuthErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createError', () => {
    it('should create an AuthError with correct properties', () => {
      const error = AuthErrorHandler.createError(
        AuthErrorType.INVALID_CREDENTIALS,
        'login_test',
        { userId: 123 }
      );

      expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(error.message).toBe('Invalid email or password');
      expect(error.userMessage).toBe('The email or password you entered is incorrect. Please try again.');
      expect(error.context).toBe('login_test');
      expect(error.details).toEqual({ userId: 123 });
      expect(error.retryable).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should mark network errors as retryable', () => {
      const error = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('should mark authentication errors as non-retryable', () => {
      const error = AuthErrorHandler.createError(AuthErrorType.INVALID_CREDENTIALS);
      expect(error.retryable).toBe(false);
    });
  });

  describe('parseHttpError', () => {
    it('should parse 401 unauthorized error correctly', () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        url: '/api/login'
      } as Response;

      const responseData = {
        error: 'Invalid credentials provided'
      };

      const error = AuthErrorHandler.parseHttpError(mockResponse, responseData, 'login');

      expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(error.context).toBe('login');
      expect(error.details?.status).toBe(401);
      expect(error.details?.responseData).toEqual(responseData);
    });

    it('should parse 409 email conflict error correctly', () => {
      const mockResponse = {
        status: 409,
        statusText: 'Conflict',
        url: '/api/register'
      } as Response;

      const responseData = {
        error: 'Email already exists'
      };

      const error = AuthErrorHandler.parseHttpError(mockResponse, responseData, 'registration');

      expect(error.type).toBe(AuthErrorType.EMAIL_ALREADY_EXISTS);
      expect(error.context).toBe('registration');
    });

    it('should parse 429 rate limit error correctly', () => {
      const mockResponse = {
        status: 429,
        statusText: 'Too Many Requests',
        url: '/api/login'
      } as Response;

      const error = AuthErrorHandler.parseHttpError(mockResponse, null, 'login');

      expect(error.type).toBe(AuthErrorType.RATE_LIMITED);
      expect(error.retryable).toBe(false); // Rate limit errors should not be immediately retried
    });

    it('should parse 500 server error correctly', () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/login'
      } as Response;

      const error = AuthErrorHandler.parseHttpError(mockResponse, null, 'login');

      expect(error.type).toBe(AuthErrorType.SERVER_ERROR);
      expect(error.retryable).toBe(true);
    });
  });

  describe('parseNetworkError', () => {
    it('should parse fetch network error correctly', () => {
      const networkError = new Error('fetch failed');
      const error = AuthErrorHandler.parseNetworkError(networkError, 'api_call');

      expect(error.type).toBe(AuthErrorType.NETWORK_ERROR);
      expect(error.context).toBe('api_call');
      expect(error.retryable).toBe(true);
      expect(error.details?.originalError).toBe('fetch failed');
    });

    it('should parse timeout error correctly', () => {
      const timeoutError = new Error('Request timeout');
      const error = AuthErrorHandler.parseNetworkError(timeoutError, 'api_call');

      expect(error.type).toBe(AuthErrorType.TIMEOUT_ERROR);
      expect(error.retryable).toBe(true);
    });

    it('should parse abort error correctly', () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      const error = AuthErrorHandler.parseNetworkError(abortError, 'api_call');

      expect(error.type).toBe(AuthErrorType.TIMEOUT_ERROR);
      expect(error.retryable).toBe(true);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay0 = AuthErrorHandler.calculateRetryDelay(0);
      const delay1 = AuthErrorHandler.calculateRetryDelay(1);
      const delay2 = AuthErrorHandler.calculateRetryDelay(2);

      expect(delay0).toBe(1000); // Base delay
      expect(delay1).toBe(2000); // Base * 2^1
      expect(delay2).toBe(4000); // Base * 2^2
    });

    it('should respect maximum delay', () => {
      const delay = AuthErrorHandler.calculateRetryDelay(10, { maxDelay: 5000 });
      expect(delay).toBe(5000);
    });

    it('should use custom base delay', () => {
      const delay = AuthErrorHandler.calculateRetryDelay(1, { baseDelay: 500 });
      expect(delay).toBe(1000); // 500 * 2^1
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await AuthErrorHandler.withRetry(operation, 'test_operation');
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryableError = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR);
      const operation = vi.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');
      
      const result = await AuthErrorHandler.withRetry(
        operation, 
        'test_operation',
        { maxRetries: 3, baseDelay: 10 } // Fast retry for testing
      );
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = AuthErrorHandler.createError(AuthErrorType.INVALID_CREDENTIALS);
      const operation = vi.fn().mockRejectedValue(nonRetryableError);
      
      await expect(
        AuthErrorHandler.withRetry(operation, 'test_operation')
      ).rejects.toEqual(nonRetryableError);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const retryableError = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR, 'test_operation');
      const operation = vi.fn().mockRejectedValue(retryableError);
      
      await expect(
        AuthErrorHandler.withRetry(
          operation, 
          'test_operation',
          { maxRetries: 2, baseDelay: 10 }
        )
      ).rejects.toEqual(retryableError);
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle non-AuthError exceptions', async () => {
      const genericError = new Error('Generic error');
      const operation = vi.fn().mockRejectedValue(genericError);
      
      await expect(
        AuthErrorHandler.withRetry(
          operation, 
          'test_operation',
          { maxRetries: 1, baseDelay: 10 } // Limit retries to avoid timeout
        )
      ).rejects.toMatchObject({
        type: AuthErrorType.CONNECTION_ERROR,
        context: 'test_operation'
      });
      
      expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry for CONNECTION_ERROR
    });
  });

  describe('utility methods', () => {
    it('should identify retryable errors correctly', () => {
      const retryableError = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR);
      const nonRetryableError = AuthErrorHandler.createError(AuthErrorType.INVALID_CREDENTIALS);

      expect(AuthErrorHandler.isRetryable(retryableError)).toBe(true);
      expect(AuthErrorHandler.isRetryable(nonRetryableError)).toBe(false);
    });

    it('should identify errors requiring re-authentication', () => {
      const reauthError = AuthErrorHandler.createError(AuthErrorType.TOKEN_EXPIRED);
      const normalError = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR);

      expect(AuthErrorHandler.requiresReauth(reauthError)).toBe(true);
      expect(AuthErrorHandler.requiresReauth(normalError)).toBe(false);
    });

    it('should identify temporary errors', () => {
      const temporaryError = AuthErrorHandler.createError(AuthErrorType.SERVER_ERROR);
      const permanentError = AuthErrorHandler.createError(AuthErrorType.INVALID_CREDENTIALS);

      expect(AuthErrorHandler.isTemporary(temporaryError)).toBe(true);
      expect(AuthErrorHandler.isTemporary(permanentError)).toBe(false);
    });

    it('should get user-friendly messages', () => {
      const error = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR);
      const message = AuthErrorHandler.getUserMessage(error);

      expect(message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
    });
  });

  describe('logError', () => {
    it('should log error with correct level', () => {
      const error = AuthErrorHandler.createError(AuthErrorType.NETWORK_ERROR);
      
      AuthErrorHandler.logError(error, 'error');
      expect(console.error).toHaveBeenCalledWith('Auth Error:', expect.objectContaining({
        type: AuthErrorType.NETWORK_ERROR,
        message: error.message
      }));
    });

    it('should log warning with correct level', () => {
      const error = AuthErrorHandler.createError(AuthErrorType.RATE_LIMITED);
      
      AuthErrorHandler.logError(error, 'warn');
      expect(console.warn).toHaveBeenCalledWith('Auth Warning:', expect.objectContaining({
        type: AuthErrorType.RATE_LIMITED
      }));
    });

    it('should log info with correct level', () => {
      const error = AuthErrorHandler.createError(AuthErrorType.TOKEN_REFRESH_FAILED);
      
      AuthErrorHandler.logError(error, 'info');
      expect(console.info).toHaveBeenCalledWith('Auth Info:', expect.objectContaining({
        type: AuthErrorType.TOKEN_REFRESH_FAILED
      }));
    });
  });
});

describe('Error Type Coverage', () => {
  it('should have user messages for all error types', () => {
    // Get all error types from the enum
    const errorTypes = Object.values(AuthErrorType);
    
    errorTypes.forEach(errorType => {
      const error = AuthErrorHandler.createError(errorType);
      expect(error.message).toBeTruthy();
      expect(error.userMessage).toBeTruthy();
      expect(error.userMessage).not.toBe(error.message); // User message should be different from technical message
    });
  });

  it('should properly categorize all error types', () => {
    const errorTypes = Object.values(AuthErrorType);
    
    errorTypes.forEach(errorType => {
      const error = AuthErrorHandler.createError(errorType);
      
      // Each error should have a defined retryable status
      expect(typeof error.retryable).toBe('boolean');
      
      // Each error should be categorizable
      const isRetryable = AuthErrorHandler.isRetryable(error);
      const requiresReauth = AuthErrorHandler.requiresReauth(error);
      const isTemporary = AuthErrorHandler.isTemporary(error);
      
      expect(typeof isRetryable).toBe('boolean');
      expect(typeof requiresReauth).toBe('boolean');
      expect(typeof isTemporary).toBe('boolean');
    });
  });
});