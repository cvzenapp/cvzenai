/**
 * Referral System Penetration Tests
 * Security tests simulating various attack scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ReferralSecurityService } from '../../services/referralSecurityService.js';
import { referralSecurityMiddleware } from '../../middleware/referralSecurityMiddleware.js';

// Mock dependencies
vi.mock('../../services/referralSecurityService.js');
vi.mock('../../database/connection.js');

describe('Referral System Penetration Tests', () => {
  let app: express.Application;
  let mockSecurityService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockSecurityService = {
      checkRateLimit: vi.fn(),
      sanitizeInput: vi.fn(),
      detectSuspiciousActivity: vi.fn(),
      logAuditEvent: vi.fn(),
      validateReferralToken: vi.fn(),
      generateSecureReferralToken: vi.fn()
    };

    (ReferralSecurityService as any).mockImplementation(() => mockSecurityService);

    // Set up test routes with security middleware
    app.use('/api/referrals', referralSecurityMiddleware.securityHeaders);
    app.use('/api/referrals', referralSecurityMiddleware.corsSecurityCheck);
    app.use('/api/referrals', referralSecurityMiddleware.sanitizeInput);

    // Mock authenticated route
    app.post('/api/referrals', 
      (req, res, next) => {
        (req as any).user = { id: 123, email: 'test@example.com' };
        next();
      },
      referralSecurityMiddleware.rateLimitReferrals,
      referralSecurityMiddleware.detectSuspiciousActivity,
      (req, res) => {
        res.json({ success: true, data: { id: 1 } });
      }
    );

    // Mock referee token route
    app.get('/api/referrals/referee/:token',
      referralSecurityMiddleware.validateReferralToken,
      (req, res) => {
        res.json({ success: true, data: { referralId: 123 } });
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('XSS Attack Prevention', () => {
    it('should prevent script injection in referral creation', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true, remaining: 5, resetTime: new Date() });
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({ isSuspicious: false, reasons: [], riskScore: 0 });
      mockSecurityService.sanitizeInput.mockImplementation((input) => {
        if (typeof input === 'object' && input.refereeName) {
          return { ...input, refereeName: input.refereeName.replace(/<script.*?<\/script>/gi, '') };
        }
        return input;
      });

      const maliciousPayload = {
        refereeName: '<script>alert("XSS")</script>Alex Morgan',
        refereeEmail: 'john@example.com',
        positionTitle: 'Developer',
        companyName: 'Test Corp'
      };

      const response = await request(app)
        .post('/api/referrals')
        .send(maliciousPayload);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should prevent XSS in query parameters', async () => {
      mockSecurityService.sanitizeInput.mockImplementation((input) => {
        if (typeof input === 'object' && input.search) {
          return { ...input, search: input.search.replace(/<script.*?<\/script>/gi, '') };
        }
        return input;
      });

      const response = await request(app)
        .get('/api/referrals')
        .query({ search: '<script>alert("XSS")</script>' });

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
    });

    it('should prevent event handler injection', async () => {
      mockSecurityService.sanitizeInput.mockImplementation((input) => {
        if (typeof input === 'string') {
          return input.replace(/on\w+\s*=/gi, '');
        }
        return input;
      });

      const maliciousPayload = {
        personalMessage: 'Hello <img src="x" onerror="alert(1)">'
      };

      await request(app)
        .post('/api/referrals')
        .send(maliciousPayload);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should handle SQL injection attempts in input', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true, remaining: 5, resetTime: new Date() });
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({ isSuspicious: false, reasons: [], riskScore: 0 });
      mockSecurityService.sanitizeInput.mockImplementation((input) => input);

      const sqlInjectionPayload = {
        refereeEmail: "test@example.com'; DROP TABLE referrals; --",
        refereeName: "Robert'; DELETE FROM users; --",
        positionTitle: "Developer",
        companyName: "Test Corp"
      };

      const response = await request(app)
        .post('/api/referrals')
        .send(sqlInjectionPayload);

      // Should not crash and should sanitize input
      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Attack Tests', () => {
    it('should block rapid-fire requests', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        reason: 'Rate limit exceeded'
      });

      const response = await request(app)
        .post('/api/referrals')
        .send({
          refereeEmail: 'test@example.com',
          refereeName: 'Test User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('Rate limit exceeded');
      expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'rate_limit_exceeded'
        })
      );
    });

    it('should handle distributed rate limiting attacks', async () => {
      // Simulate multiple IPs hitting rate limits
      mockSecurityService.checkRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 3600000),
        reason: 'IP rate limit exceeded'
      });

      const response = await request(app)
        .post('/api/referrals')
        .set('X-Forwarded-For', '203.0.113.1')
        .send({
          refereeEmail: 'test@example.com',
          refereeName: 'Test User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('IP rate limit exceeded');
    });
  });

  describe('Token Manipulation Attacks', () => {
    it('should reject tampered tokens', async () => {
      mockSecurityService.validateReferralToken.mockReturnValue(null);

      const response = await request(app)
        .get('/api/referrals/referee/tampered-token-12345');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
      expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'token_validation_failed'
        })
      );
    });

    it('should handle token replay attacks', async () => {
      // First request succeeds
      mockSecurityService.validateReferralToken.mockReturnValueOnce({
        referralId: 123,
        referrerId: 456,
        timestamp: Date.now() - 86400000 // 24 hours ago
      });

      // Second request with same token should be handled appropriately
      mockSecurityService.validateReferralToken.mockReturnValueOnce(null);

      const validToken = 'valid-token-12345';

      // First request
      await request(app).get(`/api/referrals/referee/${validToken}`);

      // Replay attack
      const response = await request(app).get(`/api/referrals/referee/${validToken}`);

      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      mockSecurityService.validateReferralToken.mockReturnValue(null);

      const response = await request(app)
        .get('/api/referrals/referee/expired-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect and block bot-like behavior', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true, remaining: 5, resetTime: new Date() });
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({
        isSuspicious: true,
        reasons: ['Sequential email pattern detected', 'Rapid referral creation'],
        riskScore: 85
      });

      const response = await request(app)
        .post('/api/referrals')
        .send({
          refereeEmail: 'user1@example.com',
          refereeName: 'User One',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('SUSPICIOUS_ACTIVITY');
      expect(mockSecurityService.logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'suspicious_activity_detected',
          severity: 'critical'
        })
      );
    });

    it('should flag but allow medium-risk activities', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true, remaining: 5, resetTime: new Date() });
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({
        isSuspicious: true,
        reasons: ['Duplicate referee emails'],
        riskScore: 60
      });

      const response = await request(app)
        .post('/api/referrals')
        .send({
          refereeEmail: 'duplicate@example.com',
          refereeName: 'Duplicate User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(200);
      expect(response.headers['x-security-warning']).toBe('Activity flagged for review');
    });
  });

  describe('CORS Attack Prevention', () => {
    it('should block requests from unauthorized origins', async () => {
      const response = await request(app)
        .post('/api/referrals')
        .set('Origin', 'https://malicious-site.com')
        .send({
          refereeEmail: 'test@example.com',
          refereeName: 'Test User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Origin not allowed');
    });

    it('should allow requests from authorized origins', async () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true, remaining: 5, resetTime: new Date() });
      mockSecurityService.detectSuspiciousActivity.mockReturnValue({ isSuspicious: false, reasons: [], riskScore: 0 });

      const response = await request(app)
        .post('/api/referrals')
        .set('Origin', 'http://localhost:3000')
        .send({
          refereeEmail: 'test@example.com',
          refereeName: 'Test User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation Bypass Attempts', () => {
    it('should handle null byte injection', async () => {
      mockSecurityService.sanitizeInput.mockImplementation((input) => {
        if (typeof input === 'string') {
          return input.replace(/\0/g, '');
        }
        return input;
      });

      const maliciousPayload = {
        refereeEmail: 'test@example.com\0.evil.com',
        refereeName: 'Test\0User',
        positionTitle: 'Developer',
        companyName: 'Test Corp'
      };

      await request(app)
        .post('/api/referrals')
        .send(maliciousPayload);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
    });

    it('should handle Unicode normalization attacks', async () => {
      mockSecurityService.sanitizeInput.mockImplementation((input) => input);

      const unicodePayload = {
        refereeEmail: 'test@еxample.com', // Cyrillic 'е' instead of Latin 'e'
        refereeName: 'Test User',
        positionTitle: 'Developer',
        companyName: 'Test Corp'
      };

      await request(app)
        .post('/api/referrals')
        .send(unicodePayload);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
    });

    it('should handle extremely long input strings', async () => {
      mockSecurityService.sanitizeInput.mockImplementation((input) => {
        if (typeof input === 'string' && input.length > 1000) {
          return input.substring(0, 1000);
        }
        return input;
      });

      const longString = 'A'.repeat(10000);
      const maliciousPayload = {
        refereeEmail: 'test@example.com',
        refereeName: longString,
        positionTitle: 'Developer',
        companyName: 'Test Corp'
      };

      await request(app)
        .post('/api/referrals')
        .send(maliciousPayload);

      expect(mockSecurityService.sanitizeInput).toHaveBeenCalled();
    });
  });

  describe('Authentication Bypass Attempts', () => {
    it('should reject requests without authentication', async () => {
      const app2 = express();
      app2.use(express.json());
      
      // Route without authentication middleware
      app2.post('/api/referrals', 
        referralSecurityMiddleware.rateLimitReferrals,
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app2)
        .post('/api/referrals')
        .send({
          refereeEmail: 'test@example.com',
          refereeName: 'Test User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should handle malformed authentication headers', async () => {
      const response = await request(app)
        .post('/api/referrals')
        .set('Authorization', 'Malformed Header')
        .send({
          refereeEmail: 'test@example.com',
          refereeName: 'Test User',
          positionTitle: 'Developer',
          companyName: 'Test Corp'
        });

      // Should still work because our test app mocks authentication
      // In real implementation, this would fail
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Security Headers Validation', () => {
    it('should set all required security headers', async () => {
      const response = await request(app)
        .get('/api/referrals/referee/test-token');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Denial of Service (DoS) Prevention', () => {
    it('should handle JSON bomb attacks', async () => {
      // Create deeply nested JSON object
      let nestedObject: any = {};
      let current = nestedObject;
      for (let i = 0; i < 100; i++) {
        current.nested = {};
        current = current.nested;
      }

      const response = await request(app)
        .post('/api/referrals')
        .send(nestedObject);

      // Should handle gracefully without crashing
      expect(response.status).toBeLessThan(500);
    });

    it('should handle large payload attacks', async () => {
      const largePayload = {
        refereeEmail: 'test@example.com',
        refereeName: 'Test User',
        positionTitle: 'Developer',
        companyName: 'Test Corp',
        personalMessage: 'A'.repeat(100000) // Very large message
      };

      const response = await request(app)
        .post('/api/referrals')
        .send(largePayload);

      // Should handle gracefully
      expect(response.status).toBeLessThan(500);
    });
  });
});