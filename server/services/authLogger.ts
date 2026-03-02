/**
 * Server-side Authentication Logger
 * Provides comprehensive logging for authentication operations on the server
 * Requirements: 6.1, 6.2, 6.4
 */

import { Request, Response } from 'express';

export enum ServerAuthLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security'
}

export enum ServerAuthOperation {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  REGISTER_ATTEMPT = 'register_attempt',
  REGISTER_SUCCESS = 'register_success',
  REGISTER_FAILURE = 'register_failure',
  TOKEN_VALIDATION = 'token_validation',
  TOKEN_REFRESH = 'token_refresh',
  LOGOUT = 'logout',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_CONFIRM = 'password_reset_confirm',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_HIT = 'rate_limit_hit',
  DATABASE_ERROR = 'database_error'
}

export interface ServerAuthLogEntry {
  timestamp: string;
  level: ServerAuthLogLevel;
  operation: ServerAuthOperation;
  message: string;
  userId?: number;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  details?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  securityContext?: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    actionTaken?: string;
  };
}

class ServerAuthLogger {
  private isDevelopment: boolean;
  private logToConsole: boolean;
  private logToFile: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logToConsole = process.env.AUTH_LOG_CONSOLE !== 'false';
    this.logToFile = process.env.AUTH_LOG_FILE === 'true';
  }

  /**
   * Main logging method
   */
  public log(
    level: ServerAuthLogLevel,
    operation: ServerAuthOperation,
    message: string,
    context?: {
      req?: Request;
      res?: Response;
      userId?: number;
      email?: string;
      duration?: number;
      details?: Record<string, any>;
      error?: Error;
      securityContext?: ServerAuthLogEntry['securityContext'];
    }
  ): void {
    const logEntry: ServerAuthLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message: this.sanitizeMessage(message),
      userId: context?.userId,
      email: context?.email ? this.sanitizeEmail(context.email) : undefined,
      ipAddress: this.extractIpAddress(context?.req),
      userAgent: context?.req?.get('User-Agent'),
      endpoint: context?.req?.path,
      method: context?.req?.method,
      statusCode: context?.res?.statusCode,
      duration: context?.duration,
      details: this.sanitizeDetails(context?.details),
      error: context?.error ? this.sanitizeError(context.error) : undefined,
      securityContext: context?.securityContext
    };

    // Output to console if enabled
    if (this.logToConsole) {
      this.outputToConsole(logEntry);
    }

    // Log to file if enabled
    if (this.logToFile) {
      this.writeToFile(logEntry);
    }

    // Send security alerts for critical issues
    if (level === ServerAuthLogLevel.SECURITY && logEntry.securityContext?.riskLevel === 'critical') {
      this.sendSecurityAlert(logEntry);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  public debug(operation: ServerAuthOperation, message: string, context?: Parameters<typeof this.log>[3]): void {
    this.log(ServerAuthLogLevel.DEBUG, operation, message, context);
  }

  public info(operation: ServerAuthOperation, message: string, context?: Parameters<typeof this.log>[3]): void {
    this.log(ServerAuthLogLevel.INFO, operation, message, context);
  }

  public warn(operation: ServerAuthOperation, message: string, context?: Parameters<typeof this.log>[3]): void {
    this.log(ServerAuthLogLevel.WARN, operation, message, context);
  }

  public error(operation: ServerAuthOperation, message: string, context?: Parameters<typeof this.log>[3]): void {
    this.log(ServerAuthLogLevel.ERROR, operation, message, context);
  }

  public security(operation: ServerAuthOperation, message: string, context?: Parameters<typeof this.log>[3]): void {
    this.log(ServerAuthLogLevel.SECURITY, operation, message, context);
  }

  /**
   * Log authentication operation with timing
   */
  public async logOperation<T>(
    operation: ServerAuthOperation,
    operationName: string,
    context: { req?: Request; res?: Response; userId?: number; email?: string },
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    this.debug(operation, `Starting ${operationName}`, context);
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(operation, `${operationName} completed successfully`, {
        ...context,
        duration,
        details: { success: true }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(operation, `${operationName} failed`, {
        ...context,
        duration,
        error: error as Error
      });
      
      throw error;
    }
  }

  /**
   * Log login attempt with security analysis
   */
  public logLoginAttempt(
    req: Request,
    res: Response,
    email: string,
    success: boolean,
    error?: Error
  ): void {
    const ipAddress = this.extractIpAddress(req);
    const userAgent = req.get('User-Agent') || '';
    
    // Analyze security context
    const securityContext = this.analyzeSecurityContext(req, email, success);
    
    if (success) {
      this.info(ServerAuthOperation.LOGIN_SUCCESS, `User logged in successfully`, {
        req,
        res,
        email,
        securityContext
      });
    } else {
      const operation = securityContext.riskLevel === 'high' || securityContext.riskLevel === 'critical' 
        ? ServerAuthOperation.SUSPICIOUS_ACTIVITY 
        : ServerAuthOperation.LOGIN_FAILURE;
      
      const level = securityContext.riskLevel === 'critical' 
        ? ServerAuthLogLevel.SECURITY 
        : ServerAuthLogLevel.WARN;
      
      this.log(level, operation, `Login attempt failed`, {
        req,
        res,
        email,
        error,
        securityContext
      });
    }
  }

  /**
   * Log registration attempt
   */
  public logRegistrationAttempt(
    req: Request,
    res: Response,
    email: string,
    success: boolean,
    error?: Error
  ): void {
    const securityContext = this.analyzeRegistrationSecurity(req, email);
    
    if (success) {
      this.info(ServerAuthOperation.REGISTER_SUCCESS, `User registered successfully`, {
        req,
        res,
        email,
        securityContext
      });
    } else {
      this.warn(ServerAuthOperation.REGISTER_FAILURE, `Registration attempt failed`, {
        req,
        res,
        email,
        error,
        securityContext
      });
    }
  }

  /**
   * Log unauthorized access attempt
   */
  public logUnauthorizedAccess(
    req: Request,
    res: Response,
    reason: string,
    token?: string
  ): void {
    const securityContext: ServerAuthLogEntry['securityContext'] = {
      riskLevel: 'medium',
      indicators: ['unauthorized_access', reason],
      actionTaken: 'access_denied'
    };

    this.security(ServerAuthOperation.UNAUTHORIZED_ACCESS, `Unauthorized access attempt: ${reason}`, {
      req,
      res,
      details: {
        reason,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 10) + '...' : undefined
      },
      securityContext
    });
  }

  /**
   * Log token validation
   */
  public logTokenValidation(
    req: Request,
    userId: number,
    success: boolean,
    error?: Error
  ): void {
    if (success) {
      this.debug(ServerAuthOperation.TOKEN_VALIDATION, `Token validated successfully`, {
        req,
        userId
      });
    } else {
      this.warn(ServerAuthOperation.TOKEN_VALIDATION, `Token validation failed`, {
        req,
        userId,
        error
      });
    }
  }

  /**
   * Private helper methods
   */

  private sanitizeMessage(message: string): string {
    return message
      .replace(/token[:\s]*[a-zA-Z0-9._-]+/gi, 'token: [REDACTED]')
      .replace(/password[:\s]*\S+/gi, 'password: [REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  }

  private sanitizeEmail(email: string): string {
    if (!email || !email.includes('@')) return '[INVALID_EMAIL]';
    
    const [localPart, domain] = email.split('@');
    const sanitizedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '***'
      : '***';
    
    return `${sanitizedLocal}@${domain}`;
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined;

    const sanitized = { ...details };
    const sensitiveFields = ['token', 'password', 'email', 'authToken', 'refreshToken', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeError(error: Error): ServerAuthLogEntry['error'] {
    return {
      name: error.name,
      message: this.sanitizeMessage(error.message),
      stack: this.isDevelopment ? error.stack : undefined
    };
  }

  private extractIpAddress(req?: Request): string | undefined {
    if (!req) return undefined;
    
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      undefined
    );
  }

  private analyzeSecurityContext(
    req: Request,
    email: string,
    success: boolean
  ): ServerAuthLogEntry['securityContext'] {
    const indicators: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for suspicious patterns
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = this.extractIpAddress(req);

    // Suspicious user agents
    if (!userAgent || userAgent.length < 10) {
      indicators.push('suspicious_user_agent');
      riskLevel = 'medium';
    }

    // Check for common bot patterns
    if (/bot|crawler|spider|scraper/i.test(userAgent)) {
      indicators.push('bot_user_agent');
      riskLevel = 'high';
    }

    // Check for missing IP
    if (!ipAddress) {
      indicators.push('missing_ip_address');
      riskLevel = 'medium';
    }

    // Failed login attempts are inherently more suspicious
    if (!success) {
      indicators.push('failed_login');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Check for suspicious email patterns
    if (email && (/\+.*@|\.{2,}|[0-9]{5,}/.test(email))) {
      indicators.push('suspicious_email_pattern');
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      indicators,
      actionTaken: success ? 'login_granted' : 'login_denied'
    };
  }

  private analyzeRegistrationSecurity(
    req: Request,
    email: string
  ): ServerAuthLogEntry['securityContext'] {
    const indicators: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Similar analysis to login but for registration
    const userAgent = req.get('User-Agent') || '';
    
    if (!userAgent || userAgent.length < 10) {
      indicators.push('suspicious_user_agent');
      riskLevel = 'medium';
    }

    if (/bot|crawler|spider|scraper/i.test(userAgent)) {
      indicators.push('bot_user_agent');
      riskLevel = 'high';
    }

    // Check for disposable email domains
    const disposableDomains = ['10minutemail', 'tempmail', 'guerrillamail', 'mailinator'];
    if (disposableDomains.some(domain => email.includes(domain))) {
      indicators.push('disposable_email');
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      indicators,
      actionTaken: 'registration_attempt'
    };
  }

  private outputToConsole(logEntry: ServerAuthLogEntry): void {
    const prefix = `🔐 [${logEntry.operation.toUpperCase()}]`;
    const message = `${prefix} ${logEntry.message}`;
    const context = {
      userId: logEntry.userId,
      email: logEntry.email,
      ip: logEntry.ipAddress,
      endpoint: logEntry.endpoint,
      duration: logEntry.duration,
      details: logEntry.details
    };

    switch (logEntry.level) {
      case ServerAuthLogLevel.DEBUG:
        console.debug(message, context);
        break;
      case ServerAuthLogLevel.INFO:
        console.info(message, context);
        break;
      case ServerAuthLogLevel.WARN:
        console.warn(message, context);
        break;
      case ServerAuthLogLevel.ERROR:
        console.error(message, context, logEntry.error);
        break;
      case ServerAuthLogLevel.SECURITY:
        console.error(`🚨 SECURITY ALERT: ${message}`, context, logEntry.securityContext);
        break;
    }
  }

  private writeToFile(logEntry: ServerAuthLogEntry): void {
    // TODO: Implement file logging
    // This could write to a structured log file or send to a logging service
    console.log('Would log to file:', JSON.stringify(logEntry));
  }

  private sendSecurityAlert(logEntry: ServerAuthLogEntry): void {
    // TODO: Implement security alerting
    // This could send to Slack, email, or security monitoring service
    console.error('🚨 CRITICAL SECURITY ALERT:', logEntry);
  }
}

// Export singleton instance
export const serverAuthLogger = new ServerAuthLogger();
export default serverAuthLogger;