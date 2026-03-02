/**
 * Enhanced Reward Engine with Payment Processing
 * Extends the base RewardEngine with Stripe payment integration
 */

import { RewardEngine } from './rewardEngine.js';
import { PaymentProcessor, PayoutRequest } from './paymentProcessor.js';
import { getDatabase } from '../database/connection.js';

export class EnhancedRewardEngine extends RewardEngine {
  private paymentProcessor = new PaymentProcessor();
  private db = getDatabase();

  /**
   * Process individual user payout using payment processor
   */
  protected async processUserPayout(userId: number, amount: number): Promise<void> {
    try {
      // Log payout initiation
      this.logPaymentAudit(userId, null, 'payout_initiated', { amount });

      // Create payout request
      const payoutRequest: PayoutRequest = {
        userId,
        amount,
        currency: 'USD',
        description: `Referral rewards payout - ${amount} USD`
      };

      // Process payout through payment processor
      const result = await this.paymentProcessor.processPayout(payoutRequest);

      if (result.success && result.transactionId) {
        // Update all earned rewards to paid status
        const updateStmt = this.db.prepare(`
          UPDATE rewards 
          SET status = 'paid', paid_at = CURRENT_TIMESTAMP, 
              payment_method = 'stripe_transfer', transaction_id = ?,
              payout_transaction_id = (
                SELECT id FROM payout_transactions WHERE transaction_id = ?
              )
          WHERE user_id = ? AND status = 'earned'
        `);

        updateStmt.run(result.transactionId, result.transactionId, userId);

        // Log successful payout
        this.logPaymentAudit(userId, result.transactionId, 'payout_completed', {
          amount,
          stripeTransferId: result.stripeTransferId,
          estimatedArrival: result.estimatedArrival
        });

        console.log(`Successfully processed payout of ${amount} for user ${userId} with transaction ${result.transactionId}`);
      } else {
        // Handle payout failure
        throw new Error(result.error || 'Unknown payout error');
      }
    } catch (error) {
      // Log failed payout attempt
      this.logPaymentAudit(userId, null, 'payout_failed', {
        amount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      console.error(`Failed to process payout for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process payout with retry mechanism
   */
  async processPayoutWithRetry(userId: number, amount: number, maxRetries: number = 3): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.processUserPayout(userId, amount);
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Payout attempt ${attempt} failed for user ${userId}:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw new Error(`Payout failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Log payment audit trail
   */
  private logPaymentAudit(
    userId: number, 
    transactionId: string | null, 
    action: string, 
    details: any
  ): void {
    this.db.prepare(`
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
   * Set default payment method for user
   */
  async setDefaultPaymentMethod(userId: number, paymentMethodId: string) {
    await this.paymentProcessor.setDefaultPaymentMethod(userId, paymentMethodId);
    
    // Log the action
    this.logPaymentAudit(userId, null, 'method_set_default', {
      paymentMethodId
    });
  }

  /**
   * Validate payment method with micro-deposits
   */
  async validatePaymentMethod(userId: number, paymentMethodId: string, amounts: number[]): Promise<boolean> {
    const result = await this.paymentProcessor.validatePaymentMethod(userId, paymentMethodId, amounts);
    
    // Log the validation attempt
    this.logPaymentAudit(userId, null, 'method_validation', {
      paymentMethodId,
      success: result
    });

    return result;
  }

  /**
   * Generate tax document for user
   */
  async generateTaxDocument(userId: number, year: number) {
    const document = await this.paymentProcessor.generateTaxDocument(userId, year);
    
    // Log tax document generation
    this.logPaymentAudit(userId, null, 'tax_document_generated', {
      year,
      documentType: document.documentType,
      totalAmount: document.totalAmount
    });

    return document;
  }

  /**
   * Get tax documents for user
   */
  getUserTaxDocuments(userId: number) {
    return this.paymentProcessor.getUserTaxDocuments(userId);
  }

  /**
   * Get payout history for user
   */
  getPayoutHistory(userId: number, limit: number = 50, offset: number = 0) {
    return this.paymentProcessor.getPayoutHistory(userId, limit, offset);
  }

  /**
   * Retry failed payout
   */
  async retryFailedPayout(transactionId: string) {
    const result = await this.paymentProcessor.retryPayout(transactionId);
    
    // Log retry attempt
    const transaction = this.db.prepare(`
      SELECT user_id FROM payout_transactions WHERE transaction_id = ?
    `).get(transactionId) as { user_id: number } | undefined;

    if (transaction) {
      this.logPaymentAudit(transaction.user_id, transactionId, 'payout_retry', {
        success: result.success,
        error: result.error
      });
    }

    return result;
  }

  /**
   * Get payment reconciliation data for admin
   */
  getPaymentReconciliation(startDate: string, endDate: string) {
    return this.paymentProcessor.getReconciliationData(startDate, endDate);
  }

  /**
   * Get payment audit log for user
   */
  getPaymentAuditLog(userId: number, limit: number = 50, offset: number = 0): {
    logs: any[];
    total: number;
  } {
    const total = this.db.prepare(`
      SELECT COUNT(*) as count FROM payment_audit_log WHERE user_id = ?
    `).get(userId) as { count: number };

    const logs = this.db.prepare(`
      SELECT * FROM payment_audit_log 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    return {
      logs: logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      })),
      total: total.count
    };
  }

  /**
   * Get system-wide payment statistics
   */
  getPaymentStatistics(): {
    totalPayouts: number;
    totalAmount: number;
    successRate: number;
    averagePayoutAmount: number;
    pendingPayouts: number;
    failedPayouts: number;
  } {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalPayouts,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as averagePayoutAmount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as successfulPayouts,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pendingPayouts,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failedPayouts
      FROM payout_transactions
    `).get() as any;

    const successRate = stats.totalPayouts > 0 
      ? (stats.successfulPayouts / stats.totalPayouts) * 100 
      : 0;

    return {
      totalPayouts: stats.totalPayouts,
      totalAmount: stats.totalAmount,
      successRate: Math.round(successRate * 100) / 100,
      averagePayoutAmount: Math.round(stats.averagePayoutAmount * 100) / 100,
      pendingPayouts: stats.pendingPayouts,
      failedPayouts: stats.failedPayouts
    };
  }

  /**
   * Process bulk payouts for multiple users
   */
  async processBulkPayouts(userPayouts: { userId: number; amount: number }[]): Promise<{
    successful: number;
    failed: number;
    results: Array<{ userId: number; success: boolean; error?: string; transactionId?: string }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;

    for (const payout of userPayouts) {
      try {
        await this.processUserPayout(payout.userId, payout.amount);
        results.push({
          userId: payout.userId,
          success: true
        });
        successful++;
      } catch (error) {
        results.push({
          userId: payout.userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        failed++;
      }
    }

    return {
      successful,
      failed,
      results
    };
  }
}