/**
 * Referral Security Service
 * Handles security measures, rate limiting, token encryption, and audit logging
 */

import crypto from 'crypto';
import { getDatabase } from '../database/connection.js';

export interface SecurityConfig {
  maxReferralsPerHour: number;
  maxReferralsPerDay: number;
  tokenEncryptionKey: string;
  auditLogRetentionDays: number;
  suspiciousActivityThreshold: number;
}

export interface AuditLogEntry {
  id?: number;
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  reason?: string;
}

export class ReferralSecurityService {
  private db = getDatabase();
  private config: SecurityConfig;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      maxReferralsPerHour: 10,
      maxReferralsPerDay: 50,
      tokenEncryptionKey: process.env.REFERRAL_TOKEN_KEY || 'default-key-change-in-production',
      auditLogRetentionDays: 90,
      suspiciousActivityThreshold: 5,
      ...config
    };
  }

  /**
   * Generate secure referral token with encryption
   */
  generateSecureReferralToken(referralId: number, referrerId: number): string {
    try {
      const payload = {
        referralId,
        referrerId,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
      };

      const payloadString = JSON.stringify(payload);
      const cipher = crypto.createCipher('aes-256-ctr', this.config.tokenEncryptionKey);
      let encrypted = cipher.update(payloadString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Add checksum for integrity
      const checksum = crypto.createHash('sha256')
        .update(encrypted + this.config.tokenEncryptionKey)
        .digest('hex')
        .substring(0, 8);

      return `${encrypted}.${checksum}`;
    } catch (error) {
      console.error('Error generating secure token:', error);
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Decrypt and validate referral token
   */
  validateReferralToken(token: string): { referralId: number; referrerId: number; timestamp: number } | null {
    try {
      const [encrypted, checksum] = token.split('.');
      if (!encrypted || !checksum) {
        return null;
      }

      // Verify checksum
      const expectedChecksum = crypto.createHash('sha256')
        .update(encrypted + this.config.tokenEncryptionKey)
        .digest('hex')
        .substring(0, 8);

      if (checksum !== expectedChecksum) {
        return null;
      }

      // Decrypt payload
      const decipher = crypto.createDecipher('aes-256-ctr', this.config.tokenEncryptionKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const payload = JSON.parse(decrypted);

      // Validate payload structure
      if (!payload.referralId || !payload.referrerId || !payload.timestamp) {
        return null;
      }

      // Check token age (tokens expire after 30 days)
      const tokenAge = Date.now() - payload.timestamp;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (tokenAge > maxAge) {
        return null;
      }

      return {
        referralId: payload.referralId,
        referrerId: payload.referrerId,
        timestamp: payload.timestamp
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  /**
   * Check rate limits for referral creation
   */
  checkRateLimit(userId: number, ipAddress?: string): RateLimitResult {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check hourly limit
    const hourlyCount = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE referrer_id = ? AND created_at >= ?
    `).get(userId, hourAgo.toISOString()) as { count: number };

    if (hourlyCount.count >= this.config.maxReferralsPerHour) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + 60 * 60 * 1000),
        reason: 'Hourly rate limit exceeded'
      };
    }

    // Check daily limit
    const dailyCount = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE referrer_id = ? AND created_at >= ?
    `).get(userId, dayAgo.toISOString()) as { count: number };

    if (dailyCount.count >= this.config.maxReferralsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reason: 'Daily rate limit exceeded'
      };
    }

    // Check IP-based rate limiting if provided
    if (ipAddress) {
      const ipHourlyCount = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE ip_address = ? AND action = 'create_referral' AND created_at >= ?
      `).get(ipAddress, hourAgo.toISOString()) as { count: number };

      if (ipHourlyCount.count >= this.config.maxReferralsPerHour * 2) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(now.getTime() + 60 * 60 * 1000),
          reason: 'IP rate limit exceeded'
        };
      }
    }

    return {
      allowed: true,
      remaining: Math.min(
        this.config.maxReferralsPerHour - hourlyCount.count,
        this.config.maxReferralsPerDay - dailyCount.count
      ),
      resetTime: new Date(now.getTime() + 60 * 60 * 1000)
    };
  }

  /**
   * Sanitize and validate input data
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters and scripts
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
        .substring(0, 1000); // Limit length
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Log audit event
   */
  logAuditEvent(entry: AuditLogEntry): void {
    try {
      const insertStmt = this.db.prepare(`
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, 
          ip_address, user_agent, metadata, severity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        entry.userId,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.severity,
        entry.timestamp
      );
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  detectSuspiciousActivity(userId: number, ipAddress?: string): {
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for rapid referral creation
    const recentReferrals = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE referrer_id = ? AND created_at >= ?
    `).get(userId, hourAgo.toISOString()) as { count: number };

    if (recentReferrals.count > this.config.suspiciousActivityThreshold) {
      reasons.push('Rapid referral creation detected');
      riskScore += 30;
    }

    // Check for duplicate email patterns
    const duplicateEmails = this.db.prepare(`
      SELECT referee_email, COUNT(*) as count 
      FROM referrals 
      WHERE referrer_id = ? AND created_at >= ?
      GROUP BY referee_email 
      HAVING COUNT(*) > 1
    `).all(userId, dayAgo.toISOString()) as { referee_email: string; count: number }[];

    if (duplicateEmails.length > 0) {
      reasons.push('Duplicate referee emails detected');
      riskScore += 20;
    }

    // Check for suspicious email patterns (e.g., sequential emails)
    const recentEmails = this.db.prepare(`
      SELECT referee_email 
      FROM referrals 
      WHERE referrer_id = ? AND created_at >= ?
      ORDER BY created_at DESC
    `).all(userId, dayAgo.toISOString()) as { referee_email: string }[];

    if (this.hasSequentialEmailPattern(recentEmails.map(r => r.referee_email))) {
      reasons.push('Sequential email pattern detected');
      riskScore += 25;
    }

    // Check IP-based suspicious activity
    if (ipAddress) {
      const ipActivity = this.db.prepare(`
        SELECT COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs 
        WHERE ip_address = ? AND action = 'create_referral' AND created_at >= ?
      `).get(ipAddress, hourAgo.toISOString()) as { unique_users: number };

      if (ipActivity.unique_users > 3) {
        reasons.push('Multiple users from same IP');
        riskScore += 40;
      }
    }

    // Check for failed validation attempts
    const failedAttempts = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE user_id = ? AND action = 'referral_validation_failed' AND created_at >= ?
    `).get(userId, hourAgo.toISOString()) as { count: number };

    if (failedAttempts.count > 5) {
      reasons.push('Multiple validation failures');
      riskScore += 15;
    }

    return {
      isSuspicious: riskScore >= 50,
      reasons,
      riskScore
    };
  }

  /**
   * Clean up old audit logs
   */
  cleanupAuditLogs(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.auditLogRetentionDays);

    const deleteStmt = this.db.prepare(`
      DELETE FROM audit_logs 
      WHERE created_at < ?
    `);

    const result = deleteStmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics(): {
    totalAuditLogs: number;
    suspiciousActivities: number;
    rateLimitViolations: number;
    tokenValidationFailures: number;
  } {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const totalAuditLogs = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= ?
    `).get(dayAgo.toISOString()) as { count: number };

    const suspiciousActivities = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE severity IN ('high', 'critical') AND created_at >= ?
    `).get(dayAgo.toISOString()) as { count: number };

    const rateLimitViolations = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE action = 'rate_limit_exceeded' AND created_at >= ?
    `).get(dayAgo.toISOString()) as { count: number };

    const tokenValidationFailures = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE action = 'token_validation_failed' AND created_at >= ?
    `).get(dayAgo.toISOString()) as { count: number };

    return {
      totalAuditLogs: totalAuditLogs.count,
      suspiciousActivities: suspiciousActivities.count,
      rateLimitViolations: rateLimitViolations.count,
      tokenValidationFailures: tokenValidationFailures.count
    };
  }

  /**
   * Check for sequential email patterns (potential bot activity)
   */
  private hasSequentialEmailPattern(emails: string[]): boolean {
    if (emails.length < 3) return false;

    // Check for patterns like user1@domain.com, user2@domain.com, user3@domain.com
    const patterns = emails.map(email => {
      const match = email.match(/^(.+?)(\d+)(@.+)$/);
      return match ? { prefix: match[1], number: parseInt(match[2]), suffix: match[3] } : null;
    }).filter(Boolean);

    if (patterns.length < 3) return false;

    // Group by prefix and suffix
    const groups = new Map<string, number[]>();
    patterns.forEach(pattern => {
      if (pattern) {
        const key = `${pattern.prefix}${pattern.suffix}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(pattern.number);
      }
    });

    // Check for sequential numbers in any group
    for (const numbers of groups.values()) {
      if (numbers.length >= 3) {
        numbers.sort((a, b) => a - b);
        let sequential = 1;
        for (let i = 1; i < numbers.length; i++) {
          if (numbers[i] === numbers[i - 1] + 1) {
            sequential++;
            if (sequential >= 3) return true;
          } else {
            sequential = 1;
          }
        }
      }
    }

    return false;
  }
}