/**
 * Referral Security Service Tests
 * Tests for security measures, rate limiting, token encryption, and audit logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReferralSecurityService } from './referralSecurityService.js';
import { getDatabase } from '../database/connection.js';

// Mock the database
vi.mock('../database/connection.js');

describe('ReferralSecurityService', () => {
  let securityService: ReferralSecurityService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn(),
        all: vi.fn(),
        run: vi.fn()
      })
    };
    (getDatabase as any).mockReturnValue(mockDb);
    
    securityService = new ReferralSecurityService({
      maxReferralsPerHour: 5,
      maxReferralsPerDay: 20,
      tokenEncryptionKey: 'test-key-for-testing',
      suspiciousActivityThreshold: 3
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Security', () => {
    it('should generate secure referral token', () => {
      const referralId = 123;
      const referrerId = 456;

      const token = securityService.generateSecureReferralToken(referralId, referrerId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(50); // Encrypted tokens should be long
      expect(token).toContain('.'); // Should have checksum separator
    });

    it('should validate secure referral token', () => {
      const referralId = 123;
      const referrerId = 456;

      const token = securityService.generateSecureReferralToken(referralId, referrerId);
      const validatedData = securityService.validateReferralToken(token);

      expect(validatedData).toBeDefined();
      expect(validatedData?.referralId).toBe(referralId);
      expect(validatedData?.referrerId).toBe(referrerId);
      expect(validatedData?.timestamp).toBeDefined();
    });

    it('should reject invalid tokens', () => {
      const invalidTokens = [
        'invalid-token',
        'invalid.checksum',
        '',
        'too.short',
        'valid-looking-but-wrong-checksum.12345678'
      ];

      invalidTokens.forEach(token => {
        const result = securityService.validateReferralToken(token);
        expect(result).toBeNull();
      });
    });

    it('should reject tokens with tampered checksums', () => {
      const referralId = 123;
      const referrerId = 456;

      const validToken = securityService.generateSecureReferralToken(referralId, referrerId);
      const [encrypted] = validToken.split('.');
      const tamperedToken = `${encrypted}.tampered`;

      const result = securityService.validateReferralToken(tamperedToken);
      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow referrals within limits', () => {
      const userId = 123;
      const ipAddress = '192.168.1.1';

      // Mock database to return counts within limits
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ count: 2 }) // 2 referrals in the last hour/day
      });

      const result = securityService.checkRateLimit(userId, ipAddress);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('should block referrals when hourly limit exceeded', () => {
      const userId = 123;
      const ipAddress = '192.168.1.1';

      // Mock database to return hourly count at limit
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 5 }) // At hourly limit
      });

      const result = securityService.checkRateLimit(userId, ipAddress);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain('Hourly rate limit exceeded');
    });

    it('should block referrals when daily limit exceeded', () => {
      const userId = 123;
      const ipAddress = '192.168.1.1';

      // Mock database to return counts
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 3 }) // Within hourly limit
      }).mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 20 }) // At daily limit
      });

      const result = securityService.checkRateLimit(userId, ipAddress);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain('Daily rate limit exceeded');
    });

    it('should block referrals when IP limit exceeded', () => {
      const userId = 123;
      const ipAddress = '192.168.1.1';

      // Mock database to return user limits OK but IP limit exceeded
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 2 }) // User hourly OK
      }).mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 5 }) // User daily OK
      }).mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 15 }) // IP limit exceeded
      });

      const result = securityService.checkRateLimit(userId, ipAddress);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP rate limit exceeded');
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize string inputs', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        'onclick="alert(1)"'
      ];

      maliciousInputs.forEach(input => {
        const sanitized = securityService.sanitizeInput(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onclick=');
      });
    });

    it('should sanitize object inputs recursively', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        nested: {
          field: 'javascript:alert("xss")'
        }
      };

      const sanitized = securityService.sanitizeInput(maliciousObject);

      expect(sanitized.name).not.toContain('<script');
      expect(sanitized.email).toBe('test@example.com'); // Safe input unchanged
      expect(sanitized.nested.field).not.toContain('javascript:');
    });

    it('should sanitize array inputs', () => {
      const maliciousArray = [
        '<script>alert("xss")</script>',
        'safe-input',
        'javascript:alert("xss")'
      ];

      const sanitized = securityService.sanitizeInput(maliciousArray);

      expect(sanitized[0]).not.toContain('<script');
      expect(sanitized[1]).toBe('safe-input');
      expect(sanitized[2]).not.toContain('javascript:');
    });

    it('should limit string length', () => {
      const longString = 'a'.repeat(2000);
      const sanitized = securityService.sanitizeInput(longString);

      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect rapid referral creation', () => {
      const userId = 123;
      const ipAddress = '192.168.1.1';

      // Mock database to return high referral count
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ count: 5 }), // Above threshold
        all: vi.fn().mockReturnValue([]) // No other suspicious patterns
      });

      const result = securityService.detectSuspiciousActivity(userId, ipAddress);

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('Rapid referral creation detected');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should detect duplicate email patterns', () => {
      const userId = 123;

      // Mock database responses
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 2 }) // Normal referral count
      }).mockReturnValueOnce({
        all: vi.fn().mockReturnValue([
          { referee_email: 'test@example.com', count: 3 }
        ]) // Duplicate emails
      }).mockReturnValueOnce({
        all: vi.fn().mockReturnValue([]) // No sequential patterns
      });

      const result = securityService.detectSuspiciousActivity(userId);

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('Duplicate referee emails detected');
    });

    it('should detect sequential email patterns', () => {
      const userId = 123;

      // Mock database responses
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 2 }) // Normal referral count
      }).mockReturnValueOnce({
        all: vi.fn().mockReturnValue([]) // No duplicates
      }).mockReturnValueOnce({
        all: vi.fn().mockReturnValue([
          { referee_email: 'user1@example.com' },
          { referee_email: 'user2@example.com' },
          { referee_email: 'user3@example.com' }
        ]) // Sequential pattern
      });

      const result = securityService.detectSuspiciousActivity(userId);

      expect(result.isSuspicious).toBe(true);
      expect(result.reasons).toContain('Sequential email pattern detected');
    });

    it('should not flag normal activity as suspicious', () => {
      const userId = 123;

      // Mock database to return normal activity
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ count: 1 }), // Low counts
        all: vi.fn().mockReturnValue([]) // No suspicious patterns
      });

      const result = securityService.detectSuspiciousActivity(userId);

      expect(result.isSuspicious).toBe(false);
      expect(result.reasons).toHaveLength(0);
      expect(result.riskScore).toBeLessThan(50);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', () => {
      const mockRun = vi.fn();
      mockDb.prepare.mockReturnValue({ run: mockRun });

      const auditEntry = {
        userId: 123,
        action: 'create_referral',
        resourceType: 'referral',
        resourceId: '456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        metadata: { test: 'data' },
        timestamp: new Date().toISOString(),
        severity: 'low' as const
      };

      securityService.logAuditEvent(auditEntry);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO audit_logs'));
      expect(mockRun).toHaveBeenCalledWith(
        auditEntry.userId,
        auditEntry.action,
        auditEntry.resourceType,
        auditEntry.resourceId,
        auditEntry.ipAddress,
        auditEntry.userAgent,
        JSON.stringify(auditEntry.metadata),
        auditEntry.severity,
        auditEntry.timestamp
      );
    });

    it('should handle logging errors gracefully', () => {
      const mockRun = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      mockDb.prepare.mockReturnValue({ run: mockRun });

      const auditEntry = {
        userId: 123,
        action: 'test_action',
        resourceType: 'test',
        timestamp: new Date().toISOString(),
        severity: 'low' as const
      };

      // Should not throw error
      expect(() => {
        securityService.logAuditEvent(auditEntry);
      }).not.toThrow();
    });
  });

  describe('Security Metrics', () => {
    it('should return security metrics', () => {
      // Mock database responses for metrics
      mockDb.prepare.mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 100 }) // Total audit logs
      }).mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 5 }) // Suspicious activities
      }).mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 3 }) // Rate limit violations
      }).mockReturnValueOnce({
        get: vi.fn().mockReturnValue({ count: 2 }) // Token validation failures
      });

      const metrics = securityService.getSecurityMetrics();

      expect(metrics).toEqual({
        totalAuditLogs: 100,
        suspiciousActivities: 5,
        rateLimitViolations: 3,
        tokenValidationFailures: 2
      });
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up old audit logs', () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 50 });
      mockDb.prepare.mockReturnValue({ run: mockRun });

      const deletedCount = securityService.cleanupAuditLogs();

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM audit_logs'));
      expect(deletedCount).toBe(50);
    });
  });

  describe('Sequential Email Pattern Detection', () => {
    it('should detect sequential email patterns', () => {
      const emails = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
        'user4@example.com'
      ];

      // Access private method through type assertion for testing
      const hasPattern = (securityService as any).hasSequentialEmailPattern(emails);
      expect(hasPattern).toBe(true);
    });

    it('should not flag non-sequential patterns', () => {
      const emails = [
        'john@example.com',
        'jane@example.com',
        'bob@different.com'
      ];

      const hasPattern = (securityService as any).hasSequentialEmailPattern(emails);
      expect(hasPattern).toBe(false);
    });

    it('should handle insufficient data', () => {
      const emails = ['user1@example.com', 'user2@example.com'];

      const hasPattern = (securityService as any).hasSequentialEmailPattern(emails);
      expect(hasPattern).toBe(false);
    });
  });
});