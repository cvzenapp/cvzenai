/**
 * Referral Security Middleware
 * Enhanced security middleware with rate limiting, input validation, and audit logging
 */

import { Request, Response, NextFunction } from 'express';
import { ReferralSecurityService } from '../services/referralSecurityService.js';
import { AuthenticatedRequest } from './referralAuth.js';

export class ReferralSecurityMiddleware {
  private securityService: ReferralSecurityService;

  constructor() {
    this.securityService = new ReferralSecurityService();
  }

  /**
   * Rate limiting middleware for referral creation
   */
  rateLimitReferrals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const ipAddress = this.getClientIP(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const rateLimitResult = this.securityService.checkRateLimit(userId, ipAddress);

      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        this.securityService.logAuditEvent({
          userId,
          action: 'rate_limit_exceeded',
          resourceType: 'referral',
          ipAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            reason: rateLimitResult.reason,
            resetTime: rateLimitResult.resetTime
          },
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });

        return res.status(429).json({
          success: false,
          error: rateLimitResult.reason,
          retryAfter: Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000)
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime.getTime() / 1000).toString()
      });

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      return res.status(500).json({
        success: false,
        error: 'Rate limiting check failed'
      });
    }
  };

  /**
   * Input sanitization middleware
   */
  sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (req.body) {
        req.body = this.securityService.sanitizeInput(req.body);
      }

      // Sanitize query parameters
      if (req.query) {
        req.query = this.securityService.sanitizeInput(req.query);
      }

      // Sanitize URL parameters
      if (req.params) {
        req.params = this.securityService.sanitizeInput(req.params);
      }

      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid input data'
      });
    }
  };

  /**
   * Suspicious activity detection middleware
   */
  detectSuspiciousActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const ipAddress = this.getClientIP(req);

      if (!userId) {
        return next();
      }

      const suspiciousActivity = this.securityService.detectSuspiciousActivity(userId, ipAddress);

      if (suspiciousActivity.isSuspicious) {
        // Log suspicious activity
        this.securityService.logAuditEvent({
          userId,
          action: 'suspicious_activity_detected',
          resourceType: 'referral',
          ipAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            reasons: suspiciousActivity.reasons,
            riskScore: suspiciousActivity.riskScore
          },
          timestamp: new Date().toISOString(),
          severity: suspiciousActivity.riskScore >= 75 ? 'critical' : 'high'
        });

        // For high-risk activities, require additional verification
        if (suspiciousActivity.riskScore >= 75) {
          return res.status(403).json({
            success: false,
            error: 'Account flagged for suspicious activity. Please contact support.',
            code: 'SUSPICIOUS_ACTIVITY'
          });
        }

        // For medium-risk activities, add warning but allow continuation
        res.set('X-Security-Warning', 'Activity flagged for review');
      }

      next();
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      next(); // Don't block request on detection error
    }
  };

  /**
   * Audit logging middleware
   */
  auditLog = (action: string, resourceType: string = 'referral') => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      const ipAddress = this.getClientIP(req);
      const userAgent = req.get('User-Agent');
      const startTime = Date.now();

      // Store original res.json to intercept response
      const originalJson = res.json;
      let responseData: any;
      let statusCode: number;

      res.json = function(data: any) {
        responseData = data;
        statusCode = res.statusCode;
        return originalJson.call(this, data);
      };

      // Continue with request
      next();

      // Log after response is sent
      res.on('finish', () => {
        try {
          const duration = Date.now() - startTime;
          const severity = statusCode >= 400 ? 'medium' : 'low';

          if (userId) {
            this.securityService.logAuditEvent({
              userId,
              action,
              resourceType,
              resourceId: req.params.id || req.params.referralId,
              ipAddress,
              userAgent,
              metadata: {
                method: req.method,
                path: req.path,
                statusCode,
                duration,
                success: statusCode < 400,
                requestSize: JSON.stringify(req.body || {}).length,
                responseSize: JSON.stringify(responseData || {}).length
              },
              timestamp: new Date().toISOString(),
              severity
            });
          }
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });
    };
  };

  /**
   * Token validation middleware for referee endpoints
   */
  validateReferralToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.token;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        });
      }

      const tokenData = this.securityService.validateReferralToken(token);

      if (!tokenData) {
        // Log token validation failure
        this.securityService.logAuditEvent({
          userId: 0, // Anonymous user
          action: 'token_validation_failed',
          resourceType: 'referral_token',
          resourceId: token.substring(0, 10) + '...', // Log partial token for debugging
          ipAddress: this.getClientIP(req),
          userAgent: req.get('User-Agent'),
          metadata: {
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 10)
          },
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });

        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Add token data to request for use in route handlers
      (req as any).tokenData = tokenData;

      next();
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Token validation failed'
      });
    }
  };

  /**
   * Security headers middleware
   */
  securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    });

    next();
  };

  /**
   * CORS security middleware for referral endpoints
   */
  corsSecurityCheck = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('Origin');
    const referer = req.get('Referer');

    // Allow requests without origin/referer (direct API calls)
    if (!origin && !referer) {
      return next();
    }

    // Define allowed origins (should be configurable)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://cvzen.com',
      'https://www.cvzen.com',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL
    ].filter(Boolean); // Remove undefined values

    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || referer?.startsWith(allowedOrigin)
    );

    if (!isAllowed) {
      console.log('CORS blocked:', { origin, referer, allowedOrigins });
      return res.status(403).json({
        success: false,
        error: 'Origin not allowed'
      });
    }

    next();
  };

  /**
   * Get client IP address from request
   */
  private getClientIP(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

// Export singleton instance
export const referralSecurityMiddleware = new ReferralSecurityMiddleware();