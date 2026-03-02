/**
 * Authentication Error Handler
 * Provides comprehensive error handling for authentication operations
 */

export enum AuthErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Registration errors
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',
  
  // Session errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  CONCURRENT_LOGIN = 'CONCURRENT_LOGIN',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, any>;
  retryable: boolean;
  timestamp: Date;
  context?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: AuthErrorType[];
}

export class AuthErrorHandler {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      AuthErrorType.NETWORK_ERROR,
      AuthErrorType.TIMEOUT_ERROR,
      AuthErrorType.CONNECTION_ERROR,
      AuthErrorType.SERVER_ERROR,
      AuthErrorType.SERVICE_UNAVAILABLE
    ]
  };

  private static readonly ERROR_MESSAGES: Record<AuthErrorType, { message: string; userMessage: string }> = {
    // Network errors
    [AuthErrorType.NETWORK_ERROR]: {
      message: 'Network request failed',
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.'
    },
    [AuthErrorType.TIMEOUT_ERROR]: {
      message: 'Request timed out',
      userMessage: 'The request took too long to complete. Please try again.'
    },
    [AuthErrorType.CONNECTION_ERROR]: {
      message: 'Connection error occurred',
      userMessage: 'Connection to the server was lost. Please check your internet connection.'
    },
    
    // Authentication errors
    [AuthErrorType.INVALID_CREDENTIALS]: {
      message: 'Invalid email or password',
      userMessage: 'The email or password you entered is incorrect. Please try again.'
    },
    [AuthErrorType.TOKEN_EXPIRED]: {
      message: 'Authentication token has expired',
      userMessage: 'Your session has expired. Please log in again.'
    },
    [AuthErrorType.TOKEN_INVALID]: {
      message: 'Authentication token is invalid',
      userMessage: 'Your session is invalid. Please log in again.'
    },
    [AuthErrorType.TOKEN_REFRESH_FAILED]: {
      message: 'Failed to refresh authentication token',
      userMessage: 'Unable to refresh your session. Please log in again.'
    },
    [AuthErrorType.UNAUTHORIZED]: {
      message: 'Unauthorized access attempt',
      userMessage: 'You are not authorized to access this resource. Please log in.'
    },
    
    // Registration errors
    [AuthErrorType.EMAIL_ALREADY_EXISTS]: {
      message: 'Email address is already registered',
      userMessage: 'An account with this email address already exists. Please use a different email or try logging in.'
    },
    [AuthErrorType.WEAK_PASSWORD]: {
      message: 'Password does not meet security requirements',
      userMessage: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.'
    },
    [AuthErrorType.INVALID_EMAIL]: {
      message: 'Email address format is invalid',
      userMessage: 'Please enter a valid email address.'
    },
    [AuthErrorType.REGISTRATION_FAILED]: {
      message: 'User registration failed',
      userMessage: 'Unable to create your account. Please try again or contact support.'
    },
    
    // Server errors
    [AuthErrorType.SERVER_ERROR]: {
      message: 'Internal server error occurred',
      userMessage: 'Something went wrong on our end. Please try again in a few moments.'
    },
    [AuthErrorType.SERVICE_UNAVAILABLE]: {
      message: 'Authentication service is temporarily unavailable',
      userMessage: 'The service is temporarily unavailable. Please try again later.'
    },
    [AuthErrorType.RATE_LIMITED]: {
      message: 'Too many requests made in a short time',
      userMessage: 'Too many attempts. Please wait a few minutes before trying again.'
    },
    
    // Validation errors
    [AuthErrorType.VALIDATION_ERROR]: {
      message: 'Input validation failed',
      userMessage: 'Please check your input and try again.'
    },
    [AuthErrorType.MISSING_FIELDS]: {
      message: 'Required fields are missing',
      userMessage: 'Please fill in all required fields.'
    },
    
    // Session errors
    [AuthErrorType.SESSION_EXPIRED]: {
      message: 'User session has expired',
      userMessage: 'Your session has expired. Please log in again.'
    },
    [AuthErrorType.CONCURRENT_LOGIN]: {
      message: 'Account is logged in elsewhere',
      userMessage: 'Your account is being used in another location. Please log in again.'
    },
    
    // Unknown errors
    [AuthErrorType.UNKNOWN_ERROR]: {
      message: 'An unknown error occurred',
      userMessage: 'Something unexpected happened. Please try again or contact support.'
    }
  };

  /**
   * Create an AuthError from various error sources
   */
  public static createError(
    type: AuthErrorType,
    context?: string,
    details?: Record<string, any>,
    originalError?: Error
  ): AuthError {
    const errorInfo = this.ERROR_MESSAGES[type];
    
    return {
      type,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      details: {
        ...details,
        originalError: originalError?.message,
        stack: originalError?.stack
      },
      retryable: this.DEFAULT_RETRY_CONFIG.retryableErrors.includes(type),
      timestamp: new Date(),
      context
    };
  }

  /**
   * Parse HTTP response and create appropriate AuthError
   */
  public static parseHttpError(
    response: Response,
    responseData?: any,
    context?: string
  ): AuthError {
    const status = response.status;
    let errorType: AuthErrorType;
    let details: Record<string, any> = {
      status,
      statusText: response.statusText,
      url: response.url
    };

    // Add response data if available
    if (responseData) {
      details.responseData = responseData;
    }

    // Determine error type based on status code and response data
    switch (status) {
      case 400:
        // Check for "email already exists" error first (most specific)
        if (responseData?.message?.toLowerCase().includes('already exists') || 
            responseData?.error?.toLowerCase().includes('already exists')) {
          errorType = AuthErrorType.EMAIL_ALREADY_EXISTS;
        } else if (responseData?.error?.includes('email') || responseData?.message?.includes('email')) {
          errorType = AuthErrorType.INVALID_EMAIL;
        } else if (responseData?.error?.includes('password') || responseData?.message?.includes('password')) {
          errorType = AuthErrorType.WEAK_PASSWORD;
        } else if (responseData?.error?.includes('validation') || responseData?.errors) {
          errorType = AuthErrorType.VALIDATION_ERROR;
        } else {
          errorType = AuthErrorType.MISSING_FIELDS;
        }
        break;
        
      case 401:
        if (responseData?.error?.includes('credentials') || responseData?.message?.includes('credentials')) {
          errorType = AuthErrorType.INVALID_CREDENTIALS;
        } else if (responseData?.error?.includes('expired') || responseData?.message?.includes('expired')) {
          errorType = AuthErrorType.TOKEN_EXPIRED;
        } else if (responseData?.error?.includes('invalid') || responseData?.message?.includes('invalid')) {
          errorType = AuthErrorType.TOKEN_INVALID;
        } else {
          errorType = AuthErrorType.UNAUTHORIZED;
        }
        break;
        
      case 403:
        errorType = AuthErrorType.UNAUTHORIZED;
        break;
        
      case 409:
        if (responseData?.error?.toLowerCase().includes('email') || responseData?.message?.toLowerCase().includes('email')) {
          errorType = AuthErrorType.EMAIL_ALREADY_EXISTS;
        } else {
          errorType = AuthErrorType.REGISTRATION_FAILED;
        }
        break;
        
      case 429:
        errorType = AuthErrorType.RATE_LIMITED;
        break;
        
      case 500:
      case 502:
      case 503:
        errorType = AuthErrorType.SERVER_ERROR;
        break;
        
      case 504:
        errorType = AuthErrorType.TIMEOUT_ERROR;
        break;
        
      default:
        errorType = AuthErrorType.UNKNOWN_ERROR;
    }

    return this.createError(errorType, context, details);
  }

  /**
   * Parse network/fetch errors
   */
  public static parseNetworkError(error: Error, context?: string): AuthError {
    let errorType: AuthErrorType;
    
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      errorType = AuthErrorType.TIMEOUT_ERROR;
    } else if (error.message.includes('fetch') || error.message.toLowerCase().includes('network')) {
      errorType = AuthErrorType.NETWORK_ERROR;
    } else if (error.message.includes('timeout')) {
      errorType = AuthErrorType.TIMEOUT_ERROR;
    } else {
      errorType = AuthErrorType.CONNECTION_ERROR;
    }

    return this.createError(errorType, context, { originalError: error.message }, error);
  }

  /**
   * Check if an error is retryable
   */
  public static isRetryable(error: AuthError): boolean {
    return error.retryable;
  }

  /**
   * Check if error is an AuthError instance
   */
  public static isAuthError(error: any): error is AuthError {
    return error && typeof error === 'object' && 'type' in error && 'userMessage' in error;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  public static calculateRetryDelay(
    attempt: number,
    config: Partial<RetryConfig> = {}
  ): number {
    const finalConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    
    const delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt);
    return Math.min(delay, finalConfig.maxDelay);
  }

  /**
   * Execute operation with retry logic
   */
  public static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
    let lastError: AuthError | null = null;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Convert error to AuthError if it isn't already
        const authError = this.isAuthError(error)
          ? error as AuthError
          : this.parseNetworkError(error as Error, context);

        lastError = authError;

        // Don't retry if error is not retryable or we've exhausted attempts
        if (!this.isRetryable(authError) || attempt === finalConfig.maxRetries) {
          break;
        }

        // Wait before retrying
        const delay = this.calculateRetryDelay(attempt, finalConfig);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.warn(`Retrying ${context} (attempt ${attempt + 1}/${finalConfig.maxRetries}) after ${delay}ms delay`);
      }
    }

    // If we get here, all retries failed
    throw lastError || this.createError(AuthErrorType.UNKNOWN_ERROR, context);
  }

  /**
   * Log authentication errors for debugging
   */
  public static logError(error: AuthError, level: 'error' | 'warn' | 'info' = 'error'): void {
    const logData = {
      type: error.type,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
      retryable: error.retryable,
      details: error.details
    };

    switch (level) {
      case 'error':
        console.error('Auth Error:', logData);
        break;
      case 'warn':
        console.warn('Auth Warning:', logData);
        break;
      case 'info':
        console.info('Auth Info:', logData);
        break;
    }

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // TODO: Send to logging service (e.g., Sentry, LogRocket, etc.)
    }
  }

  /**
   * Get user-friendly error message
   */
  public static getUserMessage(error: AuthError): string {
    return error.userMessage;
  }

  /**
   * Check if error indicates authentication failure requiring re-login
   */
  public static requiresReauth(error: AuthError): boolean {
    return [
      AuthErrorType.TOKEN_EXPIRED,
      AuthErrorType.TOKEN_INVALID,
      AuthErrorType.TOKEN_REFRESH_FAILED,
      AuthErrorType.UNAUTHORIZED,
      AuthErrorType.SESSION_EXPIRED,
      AuthErrorType.CONCURRENT_LOGIN
    ].includes(error.type);
  }

  /**
   * Check if error indicates a temporary issue that might resolve itself
   */
  public static isTemporary(error: AuthError): boolean {
    return [
      AuthErrorType.NETWORK_ERROR,
      AuthErrorType.TIMEOUT_ERROR,
      AuthErrorType.CONNECTION_ERROR,
      AuthErrorType.SERVER_ERROR,
      AuthErrorType.SERVICE_UNAVAILABLE,
      AuthErrorType.RATE_LIMITED
    ].includes(error.type);
  }
}