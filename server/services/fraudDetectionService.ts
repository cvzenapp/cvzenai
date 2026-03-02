/**
 * Fraud Detection and Prevention Service
 * Advanced fraud detection using pattern analysis and machine learning techniques
 */

import { getDatabase } from '../database/connection.js';
import { ReferralSecurityService } from './referralSecurityService.js';

export interface FraudPattern {
  id: string;
  type: 'sequential_emails' | 'rapid_creation' | 'duplicate_data' | 'suspicious_timing' | 'fake_emails' | 'bot_behavior';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  indicators: string[];
  metadata: Record<string, any>;
}

export interface FraudScore {
  userId: number;
  totalScore: number;
  patterns: FraudPattern[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresManualReview: boolean;
  blockedActions: string[];
}

export interface ManualReviewCase {
  id: number;
  userId: number;
  referralId?: number;
  fraudScore: number;
  patterns: FraudPattern[];
  status: 'pending' | 'investigating' | 'approved' | 'rejected' | 'escalated';
  assignedTo?: number;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export class FraudDetectionService {
  private db = getDatabase();
  private securityService = new ReferralSecurityService();

  // Fraud detection thresholds
  private readonly THRESHOLDS = {
    LOW_RISK: 25,
    MEDIUM_RISK: 50,
    HIGH_RISK: 75,
    CRITICAL_RISK: 90
  };

  /**
   * Analyze user for fraud patterns and calculate fraud score
   */
  analyzeFraudPatterns(userId: number, ipAddress?: string): FraudScore {
    const patterns: FraudPattern[] = [];
    let totalScore = 0;

    // Pattern 1: Sequential email detection
    const sequentialPattern = this.detectSequentialEmails(userId);
    if (sequentialPattern) {
      patterns.push(sequentialPattern);
      totalScore += sequentialPattern.confidence * 0.3;
    }

    // Pattern 2: Rapid referral creation
    const rapidCreationPattern = this.detectRapidCreation(userId);
    if (rapidCreationPattern) {
      patterns.push(rapidCreationPattern);
      totalScore += rapidCreationPattern.confidence * 0.25;
    }

    // Pattern 3: Duplicate data patterns
    const duplicatePattern = this.detectDuplicateData(userId);
    if (duplicatePattern) {
      patterns.push(duplicatePattern);
      totalScore += duplicatePattern.confidence * 0.2;
    }

    // Pattern 4: Suspicious timing patterns
    const timingPattern = this.detectSuspiciousTiming(userId);
    if (timingPattern) {
      patterns.push(timingPattern);
      totalScore += timingPattern.confidence * 0.15;
    }

    // Pattern 5: Fake email detection
    const fakeEmailPattern = this.detectFakeEmails(userId);
    if (fakeEmailPattern) {
      patterns.push(fakeEmailPattern);
      totalScore += fakeEmailPattern.confidence * 0.35;
    }

    // Pattern 6: Bot behavior detection
    if (ipAddress) {
      const botPattern = this.detectBotBehavior(userId, ipAddress);
      if (botPattern) {
        patterns.push(botPattern);
        totalScore += botPattern.confidence * 0.4;
      }
    }

    // Determine risk level and actions
    const riskLevel = this.calculateRiskLevel(totalScore);
    const requiresManualReview = totalScore >= this.THRESHOLDS.MEDIUM_RISK;
    const blockedActions = this.determineBlockedActions(totalScore, patterns);

    return {
      userId,
      totalScore: Math.min(100, totalScore),
      patterns,
      riskLevel,
      requiresManualReview,
      blockedActions
    };
  }

  /**
   * Create manual review case for flagged activity
   */
  createManualReviewCase(
    userId: number, 
    fraudScore: FraudScore, 
    referralId?: number
  ): ManualReviewCase {
    try {
      const insertStmt = this.db.prepare(`
        INSERT INTO manual_review_cases (
          user_id, referral_id, fraud_score, patterns, status, created_at
        ) VALUES (?, ?, ?, ?, 'pending', ?)
      `);

      const result = insertStmt.run(
        userId,
        referralId || null,
        fraudScore.totalScore,
        JSON.stringify(fraudScore.patterns),
        new Date().toISOString()
      );

      const caseId = result.lastInsertRowid as number;

      // Log the case creation
      this.securityService.logAuditEvent({
        userId,
        action: 'manual_review_case_created',
        resourceType: 'fraud_case',
        resourceId: caseId.toString(),
        metadata: {
          fraudScore: fraudScore.totalScore,
          riskLevel: fraudScore.riskLevel,
          patternCount: fraudScore.patterns.length
        },
        timestamp: new Date().toISOString(),
        severity: fraudScore.riskLevel === 'critical' ? 'critical' : 'high'
      });

      return this.getManualReviewCase(caseId);
    } catch (error) {
      console.error('Error creating manual review case:', error);
      throw new Error('Failed to create manual review case');
    }
  }

  /**
   * Get manual review case by ID
   */
  getManualReviewCase(caseId: number): ManualReviewCase {
    try {
      const reviewCase = this.db.prepare(`
        SELECT 
          mrc.*,
          u.first_name || ' ' || u.last_name as user_name,
          reviewer.first_name || ' ' || reviewer.last_name as reviewer_name
        FROM manual_review_cases mrc
        LEFT JOIN users u ON mrc.user_id = u.id
        LEFT JOIN users reviewer ON mrc.assigned_to = reviewer.id
        WHERE mrc.id = ?
      `).get(caseId) as any;

      if (!reviewCase) {
        throw new Error('Manual review case not found');
      }

      return {
        id: reviewCase.id,
        userId: reviewCase.user_id,
        referralId: reviewCase.referral_id,
        fraudScore: reviewCase.fraud_score,
        patterns: JSON.parse(reviewCase.patterns || '[]'),
        status: reviewCase.status,
        assignedTo: reviewCase.assigned_to,
        notes: reviewCase.notes,
        createdAt: reviewCase.created_at,
        reviewedAt: reviewCase.reviewed_at
      };
    } catch (error) {
      console.error('Error getting manual review case:', error);
      throw new Error('Failed to get manual review case');
    }
  }

  /**
   * Update manual review case status
   */
  updateManualReviewCase(
    caseId: number, 
    status: ManualReviewCase['status'], 
    reviewerId: number,
    notes?: string
  ): void {
    try {
      const updateStmt = this.db.prepare(`
        UPDATE manual_review_cases 
        SET status = ?, assigned_to = ?, notes = ?, reviewed_at = ?
        WHERE id = ?
      `);

      updateStmt.run(
        status,
        reviewerId,
        notes || null,
        new Date().toISOString(),
        caseId
      );

      // Log the case update
      this.securityService.logAuditEvent({
        userId: reviewerId,
        action: 'manual_review_case_updated',
        resourceType: 'fraud_case',
        resourceId: caseId.toString(),
        metadata: {
          newStatus: status,
          notes: notes
        },
        timestamp: new Date().toISOString(),
        severity: 'medium'
      });
    } catch (error) {
      console.error('Error updating manual review case:', error);
      throw new Error('Failed to update manual review case');
    }
  }

  /**
   * Get pending manual review cases
   */
  getPendingReviewCases(limit: number = 50): ManualReviewCase[] {
    try {
      return this.db.prepare(`
        SELECT 
          mrc.*,
          u.first_name || ' ' || u.last_name as user_name
        FROM manual_review_cases mrc
        LEFT JOIN users u ON mrc.user_id = u.id
        WHERE mrc.status = 'pending'
        ORDER BY mrc.fraud_score DESC, mrc.created_at ASC
        LIMIT ?
      `).all(limit).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        referralId: row.referral_id,
        fraudScore: row.fraud_score,
        patterns: JSON.parse(row.patterns || '[]'),
        status: row.status,
        assignedTo: row.assigned_to,
        notes: row.notes,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at
      }));
    } catch (error) {
      console.error('Error getting pending review cases:', error);
      return [];
    }
  }

  /**
   * Track IP address and geolocation for analysis
   */
  trackIPGeolocation(userId: number, ipAddress: string, userAgent?: string): void {
    try {
      // Simple IP tracking - in production, you'd use a geolocation service
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO ip_tracking (
          user_id, ip_address, user_agent, first_seen, last_seen, access_count
        ) VALUES (
          ?, ?, ?, 
          COALESCE((SELECT first_seen FROM ip_tracking WHERE user_id = ? AND ip_address = ?), ?),
          ?, 
          COALESCE((SELECT access_count FROM ip_tracking WHERE user_id = ? AND ip_address = ?), 0) + 1
        )
      `);

      const now = new Date().toISOString();
      insertStmt.run(
        userId, ipAddress, userAgent || null,
        userId, ipAddress, now,
        now,
        userId, ipAddress
      );
    } catch (error) {
      console.error('Error tracking IP geolocation:', error);
    }
  }

  /**
   * Get fraud detection metrics for monitoring
   */
  getFraudMetrics(): {
    totalCases: number;
    pendingCases: number;
    approvedCases: number;
    rejectedCases: number;
    averageFraudScore: number;
    topPatterns: Array<{ pattern: string; count: number }>;
  } {
    try {
      const totalCases = this.db.prepare(`
        SELECT COUNT(*) as count FROM manual_review_cases
      `).get() as { count: number };

      const statusCounts = this.db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM manual_review_cases
        GROUP BY status
      `).all() as Array<{ status: string; count: number }>;

      const avgScore = this.db.prepare(`
        SELECT AVG(fraud_score) as avg_score FROM manual_review_cases
      `).get() as { avg_score: number };

      // Get top fraud patterns
      const topPatterns = this.db.prepare(`
        SELECT 
          json_extract(value, '$.type') as pattern,
          COUNT(*) as count
        FROM manual_review_cases, json_each(patterns)
        GROUP BY json_extract(value, '$.type')
        ORDER BY count DESC
        LIMIT 10
      `).all() as Array<{ pattern: string; count: number }>;

      const statusMap = statusCounts.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCases: totalCases.count,
        pendingCases: statusMap.pending || 0,
        approvedCases: statusMap.approved || 0,
        rejectedCases: statusMap.rejected || 0,
        averageFraudScore: avgScore.avg_score || 0,
        topPatterns
      };
    } catch (error) {
      console.error('Error getting fraud metrics:', error);
      return {
        totalCases: 0,
        pendingCases: 0,
        approvedCases: 0,
        rejectedCases: 0,
        averageFraudScore: 0,
        topPatterns: []
      };
    }
  }

  /**
   * Detect sequential email patterns
   */
  private detectSequentialEmails(userId: number): FraudPattern | null {
    try {
      const recentEmails = this.db.prepare(`
        SELECT referee_email 
        FROM referrals 
        WHERE referrer_id = ? AND created_at >= datetime('now', '-7 days')
        ORDER BY created_at DESC
        LIMIT 20
      `).all(userId) as Array<{ referee_email: string }>;

      if (recentEmails.length < 3) return null;

      const emails = recentEmails.map(r => r.referee_email);
      const hasSequential = this.hasSequentialEmailPattern(emails);

      if (hasSequential) {
        return {
          id: `sequential_emails_${userId}_${Date.now()}`,
          type: 'sequential_emails',
          description: 'Sequential email pattern detected (e.g., user1@domain.com, user2@domain.com)',
          severity: 'high',
          confidence: 85,
          indicators: [
            `Found ${emails.length} emails with sequential patterns`,
            'Suggests automated or bot-generated referrals'
          ],
          metadata: {
            emailCount: emails.length,
            sampleEmails: emails.slice(0, 5)
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting sequential emails:', error);
      return null;
    }
  }

  /**
   * Detect rapid referral creation patterns
   */
  private detectRapidCreation(userId: number): FraudPattern | null {
    try {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM referrals 
        WHERE referrer_id = ? AND created_at >= ?
      `).get(userId, hourAgo.toISOString()) as { count: number };

      if (recentCount.count >= 10) {
        return {
          id: `rapid_creation_${userId}_${Date.now()}`,
          type: 'rapid_creation',
          description: 'Unusually rapid referral creation detected',
          severity: 'medium',
          confidence: Math.min(95, 60 + (recentCount.count * 5)),
          indicators: [
            `${recentCount.count} referrals created in the last hour`,
            'Exceeds normal user behavior patterns'
          ],
          metadata: {
            referralCount: recentCount.count,
            timeWindow: '1 hour'
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting rapid creation:', error);
      return null;
    }
  }

  /**
   * Detect duplicate data patterns
   */
  private detectDuplicateData(userId: number): FraudPattern | null {
    try {
      const duplicates = this.db.prepare(`
        SELECT 
          referee_email,
          referee_name,
          company_name,
          COUNT(*) as count
        FROM referrals 
        WHERE referrer_id = ? AND created_at >= datetime('now', '-30 days')
        GROUP BY referee_email, referee_name, company_name
        HAVING COUNT(*) > 1
        ORDER BY count DESC
        LIMIT 5
      `).all(userId) as Array<{
        referee_email: string;
        referee_name: string;
        company_name: string;
        count: number;
      }>;

      if (duplicates.length > 0) {
        const totalDuplicates = duplicates.reduce((sum, dup) => sum + dup.count, 0);
        
        return {
          id: `duplicate_data_${userId}_${Date.now()}`,
          type: 'duplicate_data',
          description: 'Duplicate referral data detected',
          severity: 'medium',
          confidence: Math.min(90, 40 + (duplicates.length * 10)),
          indicators: [
            `${duplicates.length} sets of duplicate referral data found`,
            `Total ${totalDuplicates} duplicate referrals`
          ],
          metadata: {
            duplicateCount: duplicates.length,
            totalDuplicates,
            examples: duplicates.slice(0, 3)
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting duplicate data:', error);
      return null;
    }
  }

  /**
   * Detect suspicious timing patterns
   */
  private detectSuspiciousTiming(userId: number): FraudPattern | null {
    try {
      const referrals = this.db.prepare(`
        SELECT created_at 
        FROM referrals 
        WHERE referrer_id = ? AND created_at >= datetime('now', '-7 days')
        ORDER BY created_at
      `).all(userId) as Array<{ created_at: string }>;

      if (referrals.length < 5) return null;

      // Check for referrals created at exact intervals
      const intervals: number[] = [];
      for (let i = 1; i < referrals.length; i++) {
        const prev = new Date(referrals[i - 1].created_at).getTime();
        const curr = new Date(referrals[i].created_at).getTime();
        intervals.push(curr - prev);
      }

      // Check for suspiciously regular intervals (within 10 seconds)
      const regularIntervals = intervals.filter((interval, index) => {
        if (index === 0) return false;
        return Math.abs(interval - intervals[index - 1]) < 10000;
      });

      if (regularIntervals.length >= 3) {
        return {
          id: `suspicious_timing_${userId}_${Date.now()}`,
          type: 'suspicious_timing',
          description: 'Referrals created at suspiciously regular intervals',
          severity: 'medium',
          confidence: 75,
          indicators: [
            `${regularIntervals.length} referrals with regular timing intervals`,
            'Suggests automated creation'
          ],
          metadata: {
            regularIntervalCount: regularIntervals.length,
            averageInterval: intervals.reduce((a, b) => a + b, 0) / intervals.length
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting suspicious timing:', error);
      return null;
    }
  }

  /**
   * Detect fake or suspicious email patterns
   */
  private detectFakeEmails(userId: number): FraudPattern | null {
    try {
      const emails = this.db.prepare(`
        SELECT referee_email 
        FROM referrals 
        WHERE referrer_id = ? AND created_at >= datetime('now', '-30 days')
      `).all(userId) as Array<{ referee_email: string }>;

      if (emails.length === 0) return null;

      const suspiciousEmails: string[] = [];
      const suspiciousPatterns: string[] = [];

      emails.forEach(({ referee_email }) => {
        // Check for temporary email domains
        const tempDomains = [
          '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
          'mailinator.com', 'throwaway.email', 'temp-mail.org'
        ];
        
        const domain = referee_email.split('@')[1]?.toLowerCase();
        if (tempDomains.includes(domain)) {
          suspiciousEmails.push(referee_email);
          suspiciousPatterns.push('Temporary email domain');
        }

        // Check for suspicious patterns
        if (/\d{5,}/.test(referee_email)) {
          suspiciousEmails.push(referee_email);
          suspiciousPatterns.push('Contains long number sequences');
        }

        if (/^[a-z]+\d+@/.test(referee_email)) {
          suspiciousEmails.push(referee_email);
          suspiciousPatterns.push('Simple name + number pattern');
        }
      });

      if (suspiciousEmails.length > 0) {
        const suspiciousRatio = suspiciousEmails.length / emails.length;
        
        return {
          id: `fake_emails_${userId}_${Date.now()}`,
          type: 'fake_emails',
          description: 'Suspicious or fake email addresses detected',
          severity: suspiciousRatio > 0.5 ? 'high' : 'medium',
          confidence: Math.min(95, 50 + (suspiciousRatio * 50)),
          indicators: [
            `${suspiciousEmails.length} suspicious emails out of ${emails.length} total`,
            ...Array.from(new Set(suspiciousPatterns))
          ],
          metadata: {
            suspiciousCount: suspiciousEmails.length,
            totalCount: emails.length,
            suspiciousRatio,
            examples: suspiciousEmails.slice(0, 5)
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting fake emails:', error);
      return null;
    }
  }

  /**
   * Detect bot behavior patterns
   */
  private detectBotBehavior(userId: number, ipAddress: string): FraudPattern | null {
    try {
      // Check for multiple users from same IP
      const ipUsers = this.db.prepare(`
        SELECT COUNT(DISTINCT user_id) as user_count
        FROM ip_tracking 
        WHERE ip_address = ? AND last_seen >= datetime('now', '-24 hours')
      `).get(ipAddress) as { user_count: number };

      // Check for rapid actions from this IP
      const ipActions = this.db.prepare(`
        SELECT COUNT(*) as action_count
        FROM audit_logs 
        WHERE ip_address = ? AND created_at >= datetime('now', '-1 hour')
      `).get(ipAddress) as { action_count: number };

      const indicators: string[] = [];
      let confidence = 0;

      if (ipUsers.user_count > 5) {
        indicators.push(`${ipUsers.user_count} different users from same IP`);
        confidence += 30;
      }

      if (ipActions.action_count > 50) {
        indicators.push(`${ipActions.action_count} actions from IP in last hour`);
        confidence += 40;
      }

      // Check user agent patterns (simplified)
      const userAgents = this.db.prepare(`
        SELECT DISTINCT user_agent
        FROM audit_logs 
        WHERE user_id = ? AND created_at >= datetime('now', '-24 hours')
        AND user_agent IS NOT NULL
      `).all(userId) as Array<{ user_agent: string }>;

      if (userAgents.length === 1 && userAgents[0].user_agent.includes('bot')) {
        indicators.push('Bot-like user agent detected');
        confidence += 50;
      }

      if (confidence >= 40) {
        return {
          id: `bot_behavior_${userId}_${Date.now()}`,
          type: 'bot_behavior',
          description: 'Automated or bot-like behavior detected',
          severity: confidence >= 70 ? 'high' : 'medium',
          confidence,
          indicators,
          metadata: {
            ipAddress,
            usersFromIP: ipUsers.user_count,
            actionsFromIP: ipActions.action_count,
            userAgents: userAgents.map(ua => ua.user_agent)
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting bot behavior:', error);
      return null;
    }
  }

  /**
   * Calculate risk level based on fraud score
   */
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.THRESHOLDS.CRITICAL_RISK) return 'critical';
    if (score >= this.THRESHOLDS.HIGH_RISK) return 'high';
    if (score >= this.THRESHOLDS.MEDIUM_RISK) return 'medium';
    return 'low';
  }

  /**
   * Determine which actions should be blocked based on fraud score
   */
  private determineBlockedActions(score: number, patterns: FraudPattern[]): string[] {
    const blockedActions: string[] = [];

    if (score >= this.THRESHOLDS.MEDIUM_RISK) {
      blockedActions.push('create_high_value_referral');
    }

    if (score >= this.THRESHOLDS.HIGH_RISK) {
      blockedActions.push('create_referral', 'request_payout');
    }

    if (score >= this.THRESHOLDS.CRITICAL_RISK) {
      blockedActions.push('all_actions');
    }

    // Pattern-specific blocks
    const hasSequentialEmails = patterns.some(p => p.type === 'sequential_emails');
    const hasBotBehavior = patterns.some(p => p.type === 'bot_behavior');

    if (hasSequentialEmails || hasBotBehavior) {
      blockedActions.push('create_referral');
    }

    return Array.from(new Set(blockedActions));
  }

  /**
   * Check for sequential email patterns (reused from security service)
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