/**
 * Referral Security Middleware Tests
 * Tests for security middleware including rate limiting, input validation, and audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ReferralSecurityMiddleware } from './referralSecurityMiddleware.js';
import { ReferralSecurityService } from '../services/referralSecurityService.js';

// Mock the security service
vi.mock('../services/referralSecurityService.js');

describe('ReferralSecurityMiddleware', () => {
  let middleware: ReferralSecurityMiddleware;
  let mockSecurityService: any;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockSecurityService = {
      checkRateLimit: vi.fn(),
      sanitizeInput: vi.fn(),
      detectSuspiciousActivity: vi.fn(),
      logAuditEvent: vi.fn(),
      validateReferralToken: vi.fn()
    };

    (ReferralSecurityService as any).mockImplementation(() => mockSecurityService);

    middleware = new ReferralSecurityMiddleware();

    mockReq = {
      user: { id: 123, email: 'test@example.com' },
      headers: {},
      get: vi.fn(),
      connection: { remoteAddress: '192.168.1.1' },
      socket: {},
      body: {},
      query: {},
      params: {},
      method: 'POST',
      path: '/api/referrals'
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      on: vi.fn()
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limits', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({
        allowed: true,
        remaining: 5,
        resetTime: new Date(Date.now() + 3600000)
      });

      await middleware.rateLimitReferrals(mockReq as any, mockRes as Response, mockNext);

      expect(mockSecurityService.checkRateLimit).toHaveBeenCalledWith(123, '192.168.1.1');
      expect(mockRes.set).toHaveBeenCalledWith({
        'X-RateLimit-Remaining': '5',
        'X-RateLimit-Reset': expect.any(String)
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block requests when rate limit exceeded', async () => {
      const resetTime = new Date(Date.now() + 3600000);
      mockSecurityService.checkRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime,
        reason: 'Hourly rate limit exceeded'
      });

      await middleware.rateLimitReferrals(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Hourly rate limit exceeded',
        retryAfter: expect.any(Number)
      });
      expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'rate_limit_exceeded',
          severity: 'medium'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockReq.user = undefined;

      await middleware.rateLimitReferrals(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rate limiting errors gracefully', async () => {
      mockSecurityService.checkRateLimit.mockImplementation(() => {
        throw new Error('Database error');
      });

      await middleware.rateLimitReferrals(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limiting check failed'
      });
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize request body', () => {
      const maliciousBody = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com'
      };
      mockReq.body = maliciousBody;

      mockSecurityService.sanitizeInput.mockImplementation((input) => {
        if (typeof input === 'object') {
          return { ...input, name: 'alert("xss")' }; // Simulated sanitization
        }
        return input;
      });

      middleware.sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalledWith(maliciousBody);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      const maliciousQuery = {
        search: '<script>alert("xss")</script>'
      };
      mockReq.query = maliciousQuery;

      mockSecurityService.sanitizeInput.mockReturnValue({ search: 'alert("xss")' });

      middleware.sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalledWith(maliciousQuery);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle sanitization errors', () => {
      mockSecurityService.sanitizeInput.mockImplementation(() => {
        throw new Error('Sanitization error');
      });

      middleware.sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input data'
      });
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should allow normal activity', async () => {
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({
        isSuspicious: false,
        reasons: [],
        riskScore: 10
      });

      await middleware.detectSuspiciousActivity(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should flag high-risk suspicious activity', async () => {
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({
        isSuspicious: true,
        reasons: ['Rapid referral creation', 'Sequential email pattern'],
        riskScore: 80
      });

      await middleware.detectSuspiciousActivity(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account flagged for suspicious activity. Please contact support.',
        code: 'SUSPICIOUS_ACTIVITY'
      });
      expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'suspicious_activity_detected',
          severity: 'critical'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should warn about medium-risk suspicious activity', async () => {
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({
        isSuspicious: true,
        reasons: ['Duplicate emails'],
        riskScore: 60
      });

      await middleware.detectSuspiciousActivity(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith('X-Security-Warning', 'Activity flagged for review');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should continue on detection errors', async () => {
      mockSecurityService.detectSuspiciousActivity.mockImplementation(() => {
        throw new Error('Detection error');
      });

      await middleware.detectSuspiciousActivity(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Token Validation', () => {
    it('should validate valid tokens', async () => {
      const token = 'valid-encrypted-token';
      mockReq.params = { token };

      mockSecurityService.validateReferralToken.mockReturnValue({
        referralId: 123,
        referrerId: 456,
        timestamp: Date.now()
      });

      await middleware.validateReferralToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSecurityService.validateReferralToken).toHaveBeenCalledWith(token);
      expect((mockReq as any).tokenData).toEqual({
        referralId: 123,
        referrerId: 456,
        timestamp: expect.any(Number)
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid tokens', async () => {
      const token = 'invalid-token';
      mockReq.params = { token };

      mockSecurityService.validateReferralToken.mockReturnValue(null);

      await middleware.validateReferralToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'token_validation_failed',
          severity: 'medium'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should require token parameter', async () => {
      mockReq.params = {};

      await middleware.validateReferralToken(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token is required'
      });
    });
  });

  describe('Audit Logging', () => {
    it('should log successful requests', async () => {
      const auditMiddleware = middleware.auditLog('create_referral');
      mockReq.params = { id: '123' };

      // Mock response methods
      const originalJson = mockRes.json;
      mockRes.json = vi.fn().mockImplementation((data) => {
        mockRes.statusCode = 201;
        return originalJson?.call(mockRes, data);
      });

      await auditMiddleware(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Simulate response finish event
      const finishCallback = (mockRes.on as any).mock.calls.find(
        (call: any) => call[0] === 'finish'
      )?.[1];

      if (finishCallback) {
        finishCallback();
        expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'create_referral',
            resourceType: 'referral',
            severity: 'low'
          })
        );
      }
    });

    it('should log failed requests with medium severity', async () => {
      const auditMiddleware = middleware.auditLog('create_referral');

      mockRes.json = vi.fn().mockImplementation((data) => {
        mockRes.statusCode = 400;
        return data;
      });

      await auditMiddleware(mockReq as any, mockRes as Response, mockNext);

      // Simulate response finish event
      const finishCallback = (mockRes.on as any).mock.calls.find(
        (call: any) => call[0] === 'finish'
      )?.[1];

      if (finishCallback) {
        finishCallback();
        expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'medium'
          })
        );
      }
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', () => {
      middleware.securityHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.set).toHaveBeenCalledWith({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': expect.stringContaining("default-src 'self'")
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('CORS Security Check', () => {
    it('should allow requests without origin/referer', () => {
      mockReq.get = vi.fn().mockReturnValue(undefined);

      middleware.corsSecurityCheck(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow requests from allowed origins', () => {
      mockReq.get = vi.fn().mockImplementation((header) => {
        if (header === 'Origin') return 'http://localhost:3000';
        return undefined;
      });

      middleware.corsSecurityCheck(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests from disallowed origins', () => {
      mockReq.get = vi.fn().mockImplementation((header) => {
        if (header === 'Origin') return 'https://malicious-site.com';
        return undefined;
      });

      middleware.corsSecurityCheck(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Origin not allowed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('IP Address Extraction', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      mockReq.get = vi.fn().mockImplementation((header) => {
        if (header === 'X-Forwarded-For') return '203.0.113.1, 192.168.1.1';
        return undefined;
      });

      const ip = (middleware as any).getClientIP(mockReq);
      expect(ip).toBe('203.0.113.1');
    });

    it('should extract IP from X-Real-IP header', () => {
      mockReq.get = vi.fn().mockImplementation((header) => {
        if (header === 'X-Real-IP') return '203.0.113.2';
        return undefined;
      });

      const ip = (middleware as any).getClientIP(mockReq);
      expect(ip).toBe('203.0.113.2');
    });

    it('should fallback to connection remote address', () => {
      mockReq.get = vi.fn().mockReturnValue(undefined);
      mockReq.connection = { remoteAddress: '192.168.1.100' };

      const ip = (middleware as any).getClientIP(mockReq);
      expect(ip).toBe('192.168.1.100');
    });

    it('should return unknown for missing IP', () => {
      mockReq.get = vi.fn().mockReturnValue(undefined);
      mockReq.connection = {};
      mockReq.socket = {};

      const ip = (middleware as any).getClientIP(mockReq);
      expect(ip).toBe('unknown');
    });
  });
});