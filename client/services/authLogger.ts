/**
 * Authentication Logger Service
 * Provides comprehensive logging and debugging for authentication operations
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

export enum AuthLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum AuthOperation {
  LOGIN = 'login',
  REGISTER = 'register',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_VALIDATION = 'token_validation',
  USER_FETCH = 'user_fetch',
  STATE_CHANGE = 'state_change',
  STORAGE_ACCESS = 'storage_access',
  API_CALL = 'api_call',
  NAVIGATION = 'navigation'
}

export interface AuthLogEntry {
  timestamp: string;
  level: AuthLogLevel;
  operation: AuthOperation;
  message: string;
  details?: Record<string, any>;
  userId?: number;
  sessionId?: string;
  error?: Error;
  duration?: number;
  metadata?: {
    userAgent?: string;
    url?: string;
    referrer?: string;
    tokenExpiry?: string;
    retryCount?: number;
  };
}

export interface AuthDebugInfo {
  sessionId: string;
  isAuthenticated: boolean;
  tokenExists: boolean;
  tokenExpiry: string | null;
  userExists: boolean;
  storageAvailable: boolean;
  lastActivity: string | null;
  authStateHistory: AuthLogEntry[];
  performanceMetrics: {
    averageLoginTime: number;
    averageTokenRefreshTime: number;
    failureRate: number;
  };
}

class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries
  private sessionId: string;
  private isDevelopment: boolean;
  private performanceMetrics: Map<AuthOperation, number[]> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.initializeLogger();
  }

  /**
   * Generate unique session ID for tracking
   */
  private generateSessionId(): string {
    return `auth_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize logger with environment detection
   */
  private initializeLogger(): void {
    this.log(AuthLogLevel.INFO, AuthOperation.STATE_CHANGE, 'Authentication logger initialized', {
      sessionId: this.sessionId,
      isDevelopment: this.isDevelopment,
      timestamp: new Date().toISOString()
    });

    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Set up performance monitoring for auth operations
   */
  private setupPerformanceMonitoring(): void {
    // Monitor page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.log(
          AuthLogLevel.DEBUG,
          AuthOperation.STATE_CHANGE,
          `Page visibility changed: ${document.hidden ? 'hidden' : 'visible'}`
        );
      });
    }

    // Monitor storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'authToken' || event.key === 'user') {
          this.log(
            AuthLogLevel.DEBUG,
            AuthOperation.STORAGE_ACCESS,
            'Auth storage changed in another tab',
            {
              key: event.key,
              oldValue: event.oldValue ? '[REDACTED]' : null,
              newValue: event.newValue ? '[REDACTED]' : null
            }
          );
        }
      });
    }
  }

  /**
   * Main logging method
   */
  public log(
    level: AuthLogLevel,
    operation: AuthOperation,
    message: string,
    details?: Record<string, any>,
    error?: Error,
    duration?: number
  ): void {
    const logEntry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message: this.sanitizeMessage(message),
      details: this.sanitizeDetails(details),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      error: error ? this.sanitizeError(error) : undefined,
      duration,
      metadata: this.collectMetadata()
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Record performance metrics
    if (duration !== undefined) {
      this.recordPerformanceMetric(operation, duration);
    }

    // Output to console in development
    if (this.isDevelopment) {
      this.outputToConsole(logEntry);
    }

    // Send to external logging service in production (if configured)
    if (!this.isDevelopment && this.shouldLogToExternal(level)) {
      this.sendToExternalLogger(logEntry);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  public debug(operation: AuthOperation, message: string, details?: Record<string, any>): void {
    this.log(AuthLogLevel.DEBUG, operation, message, details);
  }

  public info(operation: AuthOperation, message: string, details?: Record<string, any>): void {
    this.log(AuthLogLevel.INFO, operation, message, details);
  }

  public warn(operation: AuthOperation, message: string, details?: Record<string, any>): void {
    this.log(AuthLogLevel.WARN, operation, message, details);
  }

  public error(operation: AuthOperation, message: string, details?: Record<string, any>, error?: Error): void {
    this.log(AuthLogLevel.ERROR, operation, message, details, error);
  }

  /**
   * Log authentication operation with timing
   */
  public async logOperation<T>(
    operation: AuthOperation,
    operationName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    this.debug(operation, `Starting ${operationName}`);
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.info(operation, `${operationName} completed successfully`, {
        duration: Math.round(duration)
      }, undefined, duration);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.error(operation, `${operationName} failed`, {
        duration: Math.round(duration)
      }, error as Error);
      
      throw error;
    }
  }

  /**
   * Get current debug information
   */
  public getDebugInfo(): AuthDebugInfo {
    const tokenExists = !!localStorage.getItem('authToken');
    const userExists = !!localStorage.getItem('user');
    const tokenExpiry = this.getTokenExpiry();
    
    return {
      sessionId: this.sessionId,
      isAuthenticated: tokenExists && userExists,
      tokenExists,
      tokenExpiry,
      userExists,
      storageAvailable: this.isStorageAvailable(),
      lastActivity: this.getLastActivity(),
      authStateHistory: this.getRecentLogs(50),
      performanceMetrics: this.getPerformanceMetrics()
    };
  }

  /**
   * Get recent logs for debugging
   */
  public getRecentLogs(count: number = 100): AuthLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by operation type
   */
  public getLogsByOperation(operation: AuthOperation): AuthLogEntry[] {
    return this.logs.filter(log => log.operation === operation);
  }

  /**
   * Get error logs
   */
  public getErrorLogs(): AuthLogEntry[] {
    return this.logs.filter(log => log.level === AuthLogLevel.ERROR);
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      debugInfo: this.getDebugInfo(),
      logs: this.logs
    }, null, 2);
  }

  /**
   * Clear logs (for privacy/memory management)
   */
  public clearLogs(): void {
    this.logs = [];
    this.performanceMetrics.clear();
    this.info(AuthOperation.STATE_CHANGE, 'Authentication logs cleared');
  }

  /**
   * Private helper methods
   */

  private sanitizeMessage(message: string): string {
    // Remove sensitive information from log messages
    return message
      .replace(/token[:\s]*[a-zA-Z0-9._-]+/gi, 'token: [REDACTED]')
      .replace(/password[:\s]*\S+/gi, 'password: [REDACTED]')
      .replace(/email[:\s]*\S+@\S+/gi, 'email: [REDACTED]');
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined;

    const sanitized = { ...details };
    
    // Remove or redact sensitive fields
    const sensitiveFields = ['token', 'password', 'email', 'authToken', 'refreshToken'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        if (typeof sanitized[field] === 'string') {
          sanitized[field] = '[REDACTED]';
        } else {
          sanitized[field] = '[REDACTED_OBJECT]';
        }
      }
    }

    // Redact nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeDetails(sanitized[key]);
      }
    }

    return sanitized;
  }

  private sanitizeError(error: Error): Error {
    const sanitizedError = new Error(this.sanitizeMessage(error.message));
    sanitizedError.name = error.name;
    sanitizedError.stack = error.stack;
    return sanitizedError;
  }

  private getCurrentUserId(): number | undefined {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return undefined;
  }

  private collectMetadata(): AuthLogEntry['metadata'] {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      tokenExpiry: this.getTokenExpiry(),
    };
  }

  private getTokenExpiry(): string | null {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000).toISOString();
    } catch (error) {
      return null;
    }
  }

  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  private getLastActivity(): string | null {
    try {
      return localStorage.getItem('lastAuthActivity');
    } catch (error) {
      return null;
    }
  }

  private recordPerformanceMetric(operation: AuthOperation, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements per operation
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  private getPerformanceMetrics(): AuthDebugInfo['performanceMetrics'] {
    const loginTimes = this.performanceMetrics.get(AuthOperation.LOGIN) || [];
    const refreshTimes = this.performanceMetrics.get(AuthOperation.TOKEN_REFRESH) || [];
    
    const errorCount = this.logs.filter(log => log.level === AuthLogLevel.ERROR).length;
    const totalOperations = this.logs.length;
    
    return {
      averageLoginTime: loginTimes.length > 0 ? 
        Math.round(loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length) : 0,
      averageTokenRefreshTime: refreshTimes.length > 0 ? 
        Math.round(refreshTimes.reduce((a, b) => a + b, 0) / refreshTimes.length) : 0,
      failureRate: totalOperations > 0 ? 
        Math.round((errorCount / totalOperations) * 100) / 100 : 0
    };
  }

  private outputToConsole(logEntry: AuthLogEntry): void {
    const prefix = `🔐 [${logEntry.operation.toUpperCase()}]`;
    const message = `${prefix} ${logEntry.message}`;
    
    switch (logEntry.level) {
      case AuthLogLevel.DEBUG:
        console.debug(message, logEntry.details);
        break;
      case AuthLogLevel.INFO:
        console.info(message, logEntry.details);
        break;
      case AuthLogLevel.WARN:
        console.warn(message, logEntry.details);
        break;
      case AuthLogLevel.ERROR:
        console.error(message, logEntry.details, logEntry.error);
        break;
    }
  }

  private shouldLogToExternal(level: AuthLogLevel): boolean {
    // Only log warnings and errors to external services in production
    return level === AuthLogLevel.WARN || level === AuthLogLevel.ERROR;
  }

  private sendToExternalLogger(logEntry: AuthLogEntry): void {
    // TODO: Implement external logging service integration
    // This could be Sentry, LogRocket, or custom logging endpoint
    console.log('Would send to external logger:', logEntry);
  }
}

// Export singleton instance
export const authLogger = new AuthLogger();
export default authLogger;