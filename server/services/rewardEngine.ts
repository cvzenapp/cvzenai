/**
 * Reward Engine
 * Handles reward calculations, balance tracking, and payout processing
 */

import { getDatabase } from '../database/connection.js';
import { 
  Reward, 
  RewardStatus, 
  RewardBalance,
  Referral,
  canReferralBeReversed
} from '../../shared/referrals.js';
import { PaymentProcessor } from './paymentProcessor.js';

export class RewardEngine {
  private dbPromise = getDatabase();
  private _paymentProcessor?: PaymentProcessor;

  private get paymentProcessor(): PaymentProcessor {
    if (!this._paymentProcessor) {
      this._paymentProcessor = new PaymentProcessor();
    }
    return this._paymentProcessor;
  }

  private async getDb() {
    return await this.dbPromise;
  }

  /**
   * Calculate reward amount for a referral
   */
  async calculateReward(referral: Referral): Promise<number> {
    // Get base reward amount
    let rewardAmount = referral.rewardAmount;

    // Check for bonus multipliers from configuration
    const bonusMultiplier = await this.getConfigValue('bonus_reward_multiplier', '1.0');
    rewardAmount *= parseFloat(bonusMultiplier);

    // Apply any special rules based on position or company
    // This could be extended with more complex business logic
    // if (referral.?.position?.toLowerCase().includes('senior')) {
    //   rewardAmount *= 1.1; // 10% bonus for senior positions
    // }
    // if (referral.company?.toLowerCase().includes('tech')) {
    //   rewardAmount *= 1.05; // 5% bonus for tech companies
    // }

    return Math.round(rewardAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Credit reward to user's balance
   */
  async creditReward(userId: number, referralId: number, amount: number): Promise<Reward> {
    const db = await this.getDb();
    
    // Check if reward already exists
    const existingReward = db.prepare(`
      SELECT id FROM rewards WHERE referral_id = ?
    `).get(referralId);

    if (existingReward) {
      throw new Error('Reward already exists for this referral');
    }

    // Insert reward
    const insertStmt = db.prepare(`
      INSERT INTO rewards (user_id, referral_id, amount, status)
      VALUES (?, ?, ?, 'earned')
    `);

    const result = insertStmt.run(userId, referralId, amount);

    // Get and return the created reward
    return this.getRewardById(result.lastInsertRowid as number);
  }

  /**
   * Process payouts for users who meet minimum threshold
   */
  async processPayouts(): Promise<{ processed: number; totalAmount: number }> {
    const db = await this.getDb();
    const minimumThreshold = parseFloat(await this.getConfigValue('minimum_payout_threshold', '100.00'));
    
    // Get users with earned rewards above threshold
    const usersForPayout = db.prepare(`
      SELECT 
        user_id,
        SUM(amount) as total_earned
      FROM rewards 
      WHERE status = 'earned'
      GROUP BY user_id
      HAVING total_earned >= ?
    `).all(minimumThreshold) as { user_id: number; total_earned: number }[];

    let processedCount = 0;
    let totalAmount = 0;

    for (const userPayout of usersForPayout) {
      try {
        await this.processUserPayout(userPayout.user_id, userPayout.total_earned);
        processedCount++;
        totalAmount += userPayout.total_earned;
      } catch (error) {
        console.error(`Failed to process payout for user ${userPayout.user_id}:`, error);
      }
    }

    return { processed: processedCount, totalAmount };
  }

  /**
   * Reverse reward (e.g., when hire is reversed within 90 days)
   */
  async reverseReward(referralId: number, reason: string): Promise<void> {
    const db = await this.getDb();
    
    // Get the reward
    const reward = db.prepare(`
      SELECT * FROM rewards WHERE referral_id = ?
    `).get(referralId) as any;

    if (!reward) {
      throw new Error('Reward not found for this referral');
    }

    if (reward.status === 'reversed') {
      throw new Error('Reward is already reversed');
    }

    // Check if reversal is allowed (within 90 days)
    const referral = db.prepare(`
      SELECT * FROM referrals WHERE id = ?
    `).get(referralId) as any;

    if (!canReferralBeReversed(referral)) {
      throw new Error('Reward reversal period has expired');
    }

    // Update reward status
    const updateStmt = db.prepare(`
      UPDATE rewards 
      SET status = 'reversed', reversed_at = CURRENT_TIMESTAMP, reversal_reason = ?
      WHERE id = ?
    `);

    updateStmt.run(reason, reward.id);

    // If reward was already paid, we need to handle the negative balance
    if (reward.status === 'paid') {
      // Create a negative reward entry to offset the payment
      const insertNegativeReward = db.prepare(`
        INSERT INTO rewards (user_id, referral_id, amount, status, reversal_reason)
        VALUES (?, ?, ?, 'reversed', ?)
      `);

      insertNegativeReward.run(reward.user_id, referralId, -reward.amount, reason);
    }
  }

  /**
   * Get reward balance for a user
   */
  async getRewardBalance(userId: number): Promise<RewardBalance> {
    const db = await this.getDb();
    
    const balanceData = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalEarnings,
        COALESCE(SUM(CASE WHEN status = 'earned' THEN amount ELSE 0 END), 0) as pendingRewards,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paidRewards
      FROM rewards 
      WHERE user_id = ? AND status != 'reversed'
    `).get(userId) as any;

    const minimumThreshold = parseFloat(await this.getConfigValue('minimum_payout_threshold', '100.00'));
    const availableForPayout = balanceData.pendingRewards >= minimumThreshold ? balanceData.pendingRewards : 0;

    // Calculate next payout date (assuming weekly payouts)
    const nextPayoutDate = this.calculateNextPayoutDate();

    return {
      totalEarnings: balanceData.totalEarnings,
      pendingRewards: balanceData.pendingRewards,
      availableForPayout,
      paidRewards: balanceData.paidRewards,
      nextPayoutDate: availableForPayout > 0 ? nextPayoutDate : undefined,
      minimumPayoutThreshold: minimumThreshold
    };
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: number, limit: number = 50, offset: number = 0): Promise<{ rewards: Reward[]; total: number }> {
    const db = await this.getDb();
    
    // Get total count
    const totalResult = db.prepare(`
      SELECT COUNT(*) as total FROM rewards WHERE user_id = ?
    `).get(userId) as { total: number };

    // Get rewards with pagination
    const rewards = db.prepare(`
      SELECT * FROM rewards 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset) as any[];

    return {
      rewards: rewards.map(this.mapDatabaseToReward),
      total: totalResult.total
    };
  }

  /**
   * Get reward by ID
   */
  async getRewardById(rewardId: number): Promise<Reward> {
    const db = await this.getDb();
    
    const reward = db.prepare(`
      SELECT * FROM rewards WHERE id = ?
    `).get(rewardId) as any;

    if (!reward) {
      throw new Error('Reward not found');
    }

    return this.mapDatabaseToReward(reward);
  }

  /**
   * Get rewards by referral ID
   */
  async getRewardsByReferral(referralId: number): Promise<Reward[]> {
    const db = await this.getDb();
    
    const rewards = db.prepare(`
      SELECT * FROM rewards WHERE referral_id = ? ORDER BY created_at DESC
    `).all(referralId) as any[];

    return rewards.map(this.mapDatabaseToReward);
  }

  /**
   * Get total rewards statistics
   */
  async getRewardsStatistics(): Promise<{
    totalRewards: number;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    reversedAmount: number;
  }> {
    const db = await this.getDb();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalRewards,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN status = 'earned' THEN amount ELSE 0 END), 0) as pendingAmount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paidAmount,
        COALESCE(SUM(CASE WHEN status = 'reversed' THEN ABS(amount) ELSE 0 END), 0) as reversedAmount
      FROM rewards
    `).get() as any;

    return {
      totalRewards: stats.totalRewards,
      totalAmount: stats.totalAmount,
      pendingAmount: stats.pendingAmount,
      paidAmount: stats.paidAmount,
      reversedAmount: stats.reversedAmount
    };
  }

  /**
   * Process individual user payout
   */
  private async processUserPayout(userId: number, amount: number): Promise<void> {
    // In a real implementation, this would integrate with a payment processor
    // For now, we'll simulate the payout process
    
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const paymentMethod = 'bank_transfer'; // Default payment method

    const db = await this.getDb();
    
    // Update all earned rewards to paid status
    const updateStmt = db.prepare(`
      UPDATE rewards 
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP, payment_method = ?, transaction_id = ?
      WHERE user_id = ? AND status = 'earned'
    `);

    updateStmt.run(paymentMethod, transactionId, userId);

    // Log the payout (could be extended with more detailed logging)
    console.log(`Processed payout of $${amount} for user ${userId} with transaction ${transactionId}`);
  }

  /**
   * Calculate next payout date (assuming weekly payouts on Fridays)
   */
  private calculateNextPayoutDate(): string {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(now.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
    
    // If today is Friday and it's before 5 PM, payout today
    if (dayOfWeek === 5 && now.getHours() < 17) {
      return now.toISOString();
    }
    
    return nextFriday.toISOString();
  }

  /**
   * Get configuration value
   */
  private async getConfigValue(key: string, defaultValue: string): Promise<string> {
    const db = await this.getDb();
    
    const config = db.prepare(`
      SELECT config_value FROM referral_program_config WHERE config_key = ?
    `).get(key) as { config_value: string } | undefined;

    return config?.config_value || defaultValue;
  }

  /**
   * Map database row to Reward interface
   */
  private mapDatabaseToReward(row: any): Reward {
    return {
      id: row.id,
      userId: row.user_id,
      referralId: row.referral_id,
      amount: row.amount,
      status: row.status as RewardStatus,
      earnedAt: row.earned_at,
      paidAt: row.paid_at,
      paymentMethod: row.payment_method,
      transactionId: row.transaction_id,
      reversedAt: row.reversed_at,
      reversalReason: row.reversal_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }



  /**
   * Check if user is eligible for rewards
   */
  async isUserEligibleForRewards(userId: number): Promise<boolean> {
    const db = await this.getDb();
    
    // Check if user account is active and verified
    const user = db.prepare(`
      SELECT is_active, email_verified FROM users WHERE id = ?
    `).get(userId) as { is_active: number; email_verified: number } | undefined;

    if (!user) {
      return false;
    }

    return user.is_active === 1 && user.email_verified === 1;
  }

  /**
   * Get pending rewards that need manual review
   */
  async getPendingRewardsForReview(): Promise<Reward[]> {
    const db = await this.getDb();
    
    // Get rewards for referrals with high amounts that might need review
    const highValueThreshold = 100; // Rewards above $100 need review
    
    const rewards = db.prepare(`
      SELECT r.* FROM rewards r
      WHERE r.status = 'earned' AND r.amount >= ?
      ORDER BY r.created_at DESC
    `).all(highValueThreshold) as any[];

    return rewards.map(this.mapDatabaseToReward);
  }

  /**
   * Log payment audit trail
   */
  private async logPaymentAudit(
    userId: number, 
    transactionId: string | null, 
    action: string, 
    details: any
  ): Promise<void> {
    const db = await this.getDb();
    
    db.prepare(`
      INSERT INTO payment_audit_log (user_id, transaction_id, action, details)
      VALUES (?, ?, ?, ?)
    `).run(userId, transactionId, action, JSON.stringify(details));
  }

  /**
   * Get payment methods for user
   */
  getUserPaymentMethods(userId: number) {
    return this.paymentProcessor.getUserPaymentMethods(userId);
  }

  /**
   * Add payment method for user
   */
  async addPaymentMethod(userId: number, stripePaymentMethodId: string, accountHolderName: string) {
    const result = await this.paymentProcessor.addPaymentMethod(userId, stripePaymentMethodId, accountHolderName);
    
    // Log the action
    this.logPaymentAudit(userId, null, 'method_added', {
      paymentMethodId: result.id,
      type: result.type,
      last4: result.last4
    });

    return result;
  }

  /**
   * Remove payment method for user
   */
  async removePaymentMethod(userId: number, paymentMethodId: string) {
    await this.paymentProcessor.removePaymentMethod(userId, paymentMethodId);
    
    // Log the action
    this.logPaymentAudit(userId, null, 'method_removed', {
      paymentMethodId
    });
  }

  /**
   * Generate tax document for user
   */
  async generateTaxDocument(userId: number, year: number) {
    return this.paymentProcessor.generateTaxDocument(userId, year);
  }

  /**
   * Get tax documents for user
   */
  getUserTaxDocuments(userId: number) {
    return this.paymentProcessor.getUserTaxDocuments(userId);
  }

  /**
   * Get payment reconciliation data
   */
  getPaymentReconciliation(startDate: string, endDate: string) {
    return this.paymentProcessor.getReconciliationData(startDate, endDate);
  }
}