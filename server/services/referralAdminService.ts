/**
 * Referral Admin Service
 * Handles administrative functions for the referrals system
 */

import { getDatabase } from '../database/connection.js';
import { ReferralStatus, RewardStatus } from '../../shared/referrals.js';

export interface ReferralProgramConfig {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  updatedByUserId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkStatusUpdate {
  referralIds: number[];
  newStatus: ReferralStatus;
  notes?: string;
  adminUserId: number;
}

export interface FraudDetectionResult {
  suspiciousReferrals: SuspiciousReferral[];
  patterns: FraudPattern[];
  riskScore: number;
  recommendations: string[];
}

export interface SuspiciousReferral {
  referralId: number;
  referrerId: number;
  referrerName: string;
  referrerEmail: string;
  riskFactors: string[];
  riskScore: number;
  flaggedAt: string;
}

export interface FraudPattern {
  type: 'duplicate_emails' | 'rapid_creation' | 'suspicious_domains' | 'unusual_patterns';
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  affectedReferrals: number[];
}

export interface AdminStats {
  totalReferrals: number;
  pendingApprovals: number;
  flaggedForReview: number;
  programStatus: 'active' | 'paused';
  totalRewards: number;
  pendingPayouts: number;
  fraudAlerts: number;
}

export class ReferralAdminService {
  private db = getDatabase();

  /**
   * Get referral program configuration
   */
  getProgramConfig(): Record<string, string> {
    const configs = this.db.prepare(`
      SELECT config_key, config_value 
      FROM referral_program_config 
      ORDER BY config_key
    `).all() as { config_key: string; config_value: string }[];

    const configMap: Record<string, string> = {};
    configs.forEach(config => {
      configMap[config.config_key] = config.config_value;
    });

    // Set defaults if not configured
    return {
      default_reward_amount: '30.00',
      minimum_payout_threshold: '100.00',
      referral_expiry_days: '30',
      max_referrals_per_day: '10',
      high_value_threshold: '100.00',
      program_status: 'active',
      auto_approve_rewards: 'true',
      fraud_detection_enabled: 'true',
      ...configMap
    };
  }

  /**
   * Update program configuration
   */
  updateProgramConfig(updates: Record<string, string>, adminUserId: number): void {
    const transaction = this.db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        const existing = this.db.prepare(`
          SELECT id FROM referral_program_config WHERE config_key = ?
        `).get(key);

        if (existing) {
          this.db.prepare(`
            UPDATE referral_program_config 
            SET config_value = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE config_key = ?
          `).run(value, adminUserId, key);
        } else {
          this.db.prepare(`
            INSERT INTO referral_program_config (config_key, config_value, updated_by_user_id)
            VALUES (?, ?, ?)
          `).run(key, value, adminUserId);
        }
      }
    });

    transaction();
  }

  /**
   * Get referrals pending approval
   */
  getPendingApprovals(): any[] {
    return this.db.prepare(`
      SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as referrer_name,
        u.email as referrer_email,
        rw.amount as reward_amount,
        rw.status as reward_status
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      LEFT JOIN rewards rw ON r.id = rw.referral_id
      WHERE r.status = 'hired' 
        AND r.reward_amount >= (
          SELECT CAST(config_value AS DECIMAL) 
          FROM referral_program_config 
          WHERE config_key = 'high_value_threshold'
        )
        AND (rw.status IS NULL OR rw.status = 'pending')
      ORDER BY r.created_at DESC
    `).all();
  }

  /**
   * Approve or reject high-value rewards
   */
  processRewardApproval(referralId: number, approved: boolean, adminUserId: number, notes?: string): void {
    const transaction = this.db.transaction(() => {
      if (approved) {
        // Create or update reward
        const existingReward = this.db.prepare(`
          SELECT id FROM rewards WHERE referral_id = ?
        `).get(referralId);

        if (existingReward) {
          this.db.prepare(`
            UPDATE rewards 
            SET status = 'earned', updated_at = CURRENT_TIMESTAMP
            WHERE referral_id = ?
          `).run(referralId);
        } else {
          const referral = this.db.prepare(`
            SELECT referrer_id, reward_amount FROM referrals WHERE id = ?
          `).get(referralId) as any;

          this.db.prepare(`
            INSERT INTO rewards (user_id, referral_id, amount, status)
            VALUES (?, ?, ?, 'earned')
          `).run(referral.referrer_id, referralId, referral.reward_amount);
        }
      } else {
        // Mark as rejected
        this.db.prepare(`
          UPDATE rewards 
          SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
          WHERE referral_id = ?
        `).run(referralId);
      }

      // Log approval decision
      this.db.prepare(`
        INSERT INTO referral_admin_actions (
          referral_id, admin_user_id, action_type, notes, created_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(referralId, adminUserId, approved ? 'approve_reward' : 'reject_reward', notes);
    });

    transaction();
  }

  /**
   * Bulk update referral statuses
   */
  bulkUpdateStatus(update: BulkStatusUpdate): { updated: number; errors: string[] } {
    const errors: string[] = [];
    let updated = 0;

    const transaction = this.db.transaction(() => {
      for (const referralId of update.referralIds) {
        try {
          // Validate referral exists
          const referral = this.db.prepare(`
            SELECT id, status FROM referrals WHERE id = ?
          `).get(referralId) as any;

          if (!referral) {
            errors.push(`Referral ${referralId} not found`);
            continue;
          }

          // Update status
          this.db.prepare(`
            UPDATE referrals 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(update.newStatus, referralId);

          // Log status change
          this.db.prepare(`
            INSERT INTO referral_status_history (
              referral_id, previous_status, new_status, changed_by_user_id, notes
            ) VALUES (?, ?, ?, ?, ?)
          `).run(referralId, referral.status, update.newStatus, update.adminUserId, update.notes);

          // Log admin action
          this.db.prepare(`
            INSERT INTO referral_admin_actions (
              referral_id, admin_user_id, action_type, notes, created_at
            ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(referralId, update.adminUserId, 'bulk_status_update', update.notes);

          updated++;
        } catch (error) {
          errors.push(`Failed to update referral ${referralId}: ${error}`);
        }
      }
    });

    transaction();

    return { updated, errors };
  }

  /**
   * Detect fraudulent patterns
   */
  detectFraud(): FraudDetectionResult {
    const patterns: FraudPattern[] = [];
    const suspiciousReferrals: SuspiciousReferral[] = [];

    // Pattern 1: Duplicate email domains
    const duplicateDomains = this.db.prepare(`
      SELECT 
        SUBSTR(referee_email, INSTR(referee_email, '@') + 1) as domain,
        COUNT(*) as count,
        GROUP_CONCAT(id) as referral_ids
      FROM referrals 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY domain
      HAVING count > 5
      ORDER BY count DESC
    `).all() as any[];

    duplicateDomains.forEach(domain => {
      patterns.push({
        type: 'suspicious_domains',
        description: `High volume of referrals from domain: ${domain.domain}`,
        count: domain.count,
        severity: domain.count > 20 ? 'high' : domain.count > 10 ? 'medium' : 'low',
        affectedReferrals: domain.referral_ids.split(',').map(Number)
      });
    });

    // Pattern 2: Rapid referral creation
    const rapidCreation = this.db.prepare(`
      SELECT 
        referrer_id,
        COUNT(*) as count,
        GROUP_CONCAT(id) as referral_ids,
        u.first_name || ' ' || u.last_name as referrer_name,
        u.email as referrer_email
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      WHERE r.created_at >= date('now', '-1 day')
      GROUP BY referrer_id
      HAVING count >= 5
      ORDER BY count DESC
    `).all() as any[];

    rapidCreation.forEach(user => {
      patterns.push({
        type: 'rapid_creation',
        description: `User created ${user.count} referrals in 24 hours`,
        count: user.count,
        severity: user.count > 10 ? 'high' : 'medium',
        affectedReferrals: user.referral_ids.split(',').map(Number)
      });

      suspiciousReferrals.push({
        referralId: 0, // Multiple referrals
        referrerId: user.referrer_id,
        referrerName: user.referrer_name,
        referrerEmail: user.referrer_email,
        riskFactors: ['rapid_creation'],
        riskScore: user.count > 10 ? 90 : 70,
        flaggedAt: new Date().toISOString()
      });
    });

    // Pattern 3: Duplicate referee emails
    const duplicateEmails = this.db.prepare(`
      SELECT 
        referee_email,
        COUNT(*) as count,
        GROUP_CONCAT(id) as referral_ids
      FROM referrals 
      WHERE created_at >= date('now', '-30 days')
      GROUP BY referee_email
      HAVING count > 1
      ORDER BY count DESC
    `).all() as any[];

    duplicateEmails.forEach(email => {
      patterns.push({
        type: 'duplicate_emails',
        description: `Referee email used in multiple referrals: ${email.referee_email}`,
        count: email.count,
        severity: email.count > 3 ? 'high' : 'medium',
        affectedReferrals: email.referral_ids.split(',').map(Number)
      });
    });

    // Calculate overall risk score
    const riskScore = Math.min(100, patterns.reduce((score, pattern) => {
      const patternScore = pattern.severity === 'high' ? 30 : pattern.severity === 'medium' ? 20 : 10;
      return score + patternScore;
    }, 0));

    // Generate recommendations
    const recommendations: string[] = [];
    if (patterns.some(p => p.type === 'rapid_creation')) {
      recommendations.push('Consider implementing stricter rate limiting for referral creation');
    }
    if (patterns.some(p => p.type === 'duplicate_emails')) {
      recommendations.push('Review referrals with duplicate referee emails for legitimacy');
    }
    if (patterns.some(p => p.type === 'suspicious_domains')) {
      recommendations.push('Investigate high-volume domains for potential abuse');
    }
    if (riskScore > 50) {
      recommendations.push('Enable manual review for all new referrals temporarily');
    }

    return {
      suspiciousReferrals,
      patterns,
      riskScore,
      recommendations
    };
  }

  /**
   * Pause or resume the referral program
   */
  setProgramStatus(status: 'active' | 'paused', adminUserId: number, reason?: string): void {
    this.updateProgramConfig({ program_status: status }, adminUserId);

    // Log the action
    this.db.prepare(`
      INSERT INTO referral_admin_actions (
        admin_user_id, action_type, notes, created_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(adminUserId, `program_${status}`, reason);
  }

  /**
   * Get admin dashboard statistics
   */
  getAdminStats(): AdminStats {
    const config = this.getProgramConfig();

    const totalReferrals = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals
    `).get() as { count: number };

    const pendingApprovals = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals r
      LEFT JOIN rewards rw ON r.id = rw.referral_id
      WHERE r.status = 'hired' 
        AND r.reward_amount >= ?
        AND (rw.status IS NULL OR rw.status = 'pending')
    `).get(parseFloat(config.high_value_threshold)) as { count: number };

    const flaggedForReview = this.db.prepare(`
      SELECT COUNT(DISTINCT referral_id) as count 
      FROM referral_admin_actions 
      WHERE action_type = 'flag_for_review'
        AND created_at >= date('now', '-7 days')
    `).get() as { count: number };

    const totalRewards = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM rewards WHERE status = 'paid'
    `).get() as { total: number };

    const pendingPayouts = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM rewards WHERE status = 'earned'
    `).get() as { total: number };

    const fraudDetection = this.detectFraud();

    return {
      totalReferrals: totalReferrals.count,
      pendingApprovals: pendingApprovals.count,
      flaggedForReview: flaggedForReview.count,
      programStatus: config.program_status as 'active' | 'paused',
      totalRewards: totalRewards.total,
      pendingPayouts: pendingPayouts.total,
      fraudAlerts: fraudDetection.patterns.filter(p => p.severity === 'high').length
    };
  }

  /**
   * Get admin action history
   */
  getAdminActionHistory(limit: number = 50): any[] {
    return this.db.prepare(`
      SELECT 
        raa.*,
        u.first_name || ' ' || u.last_name as admin_name,
        r.referee_name,
        r.position_title,
        r.company_name
      FROM referral_admin_actions raa
      JOIN users u ON raa.admin_user_id = u.id
      LEFT JOIN referrals r ON raa.referral_id = r.id
      ORDER BY raa.created_at DESC
      LIMIT ?
    `).all(limit);
  }

  /**
   * Flag referral for manual review
   */
  flagForReview(referralId: number, adminUserId: number, reason: string): void {
    this.db.prepare(`
      INSERT INTO referral_admin_actions (
        referral_id, admin_user_id, action_type, notes, created_at
      ) VALUES (?, ?, 'flag_for_review', ?, CURRENT_TIMESTAMP)
    `).run(referralId, adminUserId, reason);
  }

  /**
   * Get referrals flagged for review
   */
  getFlaggedReferrals(): any[] {
    return this.db.prepare(`
      SELECT DISTINCT
        r.*,
        u.first_name || ' ' || u.last_name as referrer_name,
        u.email as referrer_email,
        raa.notes as flag_reason,
        raa.created_at as flagged_at
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      JOIN referral_admin_actions raa ON r.id = raa.referral_id
      WHERE raa.action_type = 'flag_for_review'
        AND raa.created_at >= date('now', '-30 days')
      ORDER BY raa.created_at DESC
    `).all();
  }
}