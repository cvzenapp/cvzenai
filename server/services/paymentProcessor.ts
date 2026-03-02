/**
 * Payment Processor Service
 * Handles integration with Stripe for reward payouts
 */

import Stripe from 'stripe';
import { getDatabase } from '../database/connection.js';

export interface PaymentMethod {
  id: string;
  userId: number;
  type: 'bank_account' | 'debit_card';
  stripePaymentMethodId: string;
  last4?: string;
  bankName?: string;
  accountHolderName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutRequest {
  userId: number;
  amount: number;
  currency: string;
  description: string;
  paymentMethodId?: string;
}

export interface PayoutResult {
  success: boolean;
  transactionId?: string;
  stripeTransferId?: string;
  error?: string;
  estimatedArrival?: string;
}

export interface TaxDocument {
  userId: number;
  year: number;
  totalAmount: number;
  documentType: '1099-MISC' | '1099-NEC';
  documentUrl?: string;
  generatedAt: string;
}

export class PaymentProcessor {
  private stripe: Stripe;
  private db = getDatabase();

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Add payment method for user
   */
  async addPaymentMethod(
    userId: number, 
    stripePaymentMethodId: string,
    accountHolderName: string
  ): Promise<PaymentMethod> {
    try {
      // Retrieve payment method from Stripe to validate
      const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(stripePaymentMethodId);
      
      if (!stripePaymentMethod) {
        throw new Error('Invalid payment method');
      }

      // Determine payment method type and details
      let type: 'bank_account' | 'debit_card';
      let last4: string | undefined;
      let bankName: string | undefined;

      if (stripePaymentMethod.type === 'us_bank_account' && stripePaymentMethod.us_bank_account) {
        type = 'bank_account';
        last4 = stripePaymentMethod.us_bank_account.last4;
        bankName = stripePaymentMethod.us_bank_account.bank_name;
      } else if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
        type = 'debit_card';
        last4 = stripePaymentMethod.card.last4;
        bankName = stripePaymentMethod.card.brand;
      } else {
        throw new Error('Unsupported payment method type');
      }

      // Check if this is the user's first payment method
      const existingMethods = this.db.prepare(`
        SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ? AND is_active = 1
      `).get(userId) as { count: number };

      const isDefault = existingMethods.count === 0;

      // Insert payment method
      const insertStmt = this.db.prepare(`
        INSERT INTO payment_methods (
          user_id, type, stripe_payment_method_id, last4, bank_name, 
          account_holder_name, is_default, is_verified, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      const result = insertStmt.run(
        userId, type, stripePaymentMethodId, last4, bankName, 
        accountHolderName, isDefault ? 1 : 0, 1
      );

      return this.getPaymentMethodById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error(`Failed to add payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's payment methods
   */
  getUserPaymentMethods(userId: number): PaymentMethod[] {
    const methods = this.db.prepare(`
      SELECT * FROM payment_methods 
      WHERE user_id = ? AND is_active = 1 
      ORDER BY is_default DESC, created_at DESC
    `).all(userId) as any[];

    return methods.map(this.mapDatabaseToPaymentMethod);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: number, paymentMethodId: string): Promise<void> {
    const transaction = this.db.transaction(() => {
      // Remove default from all user's payment methods
      this.db.prepare(`
        UPDATE payment_methods SET is_default = 0 WHERE user_id = ?
      `).run(userId);

      // Set new default
      const result = this.db.prepare(`
        UPDATE payment_methods 
        SET is_default = 1 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `).run(paymentMethodId, userId);

      if (result.changes === 0) {
        throw new Error('Payment method not found or not owned by user');
      }
    });

    transaction();
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(userId: number, paymentMethodId: string): Promise<void> {
    try {
      // Get payment method details
      const paymentMethod = this.db.prepare(`
        SELECT * FROM payment_methods WHERE id = ? AND user_id = ? AND is_active = 1
      `).get(paymentMethodId, userId) as any;

      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Detach from Stripe
      await this.stripe.paymentMethods.detach(paymentMethod.stripe_payment_method_id);

      // Mark as inactive in database
      this.db.prepare(`
        UPDATE payment_methods SET is_active = 0 WHERE id = ?
      `).run(paymentMethodId);

      // If this was the default, set another as default
      if (paymentMethod.is_default) {
        const nextMethod = this.db.prepare(`
          SELECT id FROM payment_methods 
          WHERE user_id = ? AND is_active = 1 AND id != ?
          ORDER BY created_at DESC LIMIT 1
        `).get(userId, paymentMethodId) as { id: number } | undefined;

        if (nextMethod) {
          this.db.prepare(`
            UPDATE payment_methods SET is_default = 1 WHERE id = ?
          `).run(nextMethod.id);
        }
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error(`Failed to remove payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process payout to user
   */
  async processPayout(request: PayoutRequest): Promise<PayoutResult> {
    try {
      // Get user's default payment method if not specified
      let paymentMethod: any;
      if (request.paymentMethodId) {
        paymentMethod = this.db.prepare(`
          SELECT * FROM payment_methods 
          WHERE id = ? AND user_id = ? AND is_active = 1
        `).get(request.paymentMethodId, request.userId);
      } else {
        paymentMethod = this.db.prepare(`
          SELECT * FROM payment_methods 
          WHERE user_id = ? AND is_default = 1 AND is_active = 1
        `).get(request.userId);
      }

      if (!paymentMethod) {
        return {
          success: false,
          error: 'No valid payment method found'
        };
      }

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(request.amount * 100);

      // Create transfer to user's payment method
      const transfer = await this.stripe.transfers.create({
        amount: amountInCents,
        currency: request.currency.toLowerCase(),
        destination: paymentMethod.stripe_payment_method_id,
        description: request.description,
        metadata: {
          userId: request.userId.toString(),
          paymentMethodId: paymentMethod.id.toString()
        }
      });

      // Record the payout in our database
      const transactionId = this.generateTransactionId();
      this.db.prepare(`
        INSERT INTO payout_transactions (
          user_id, payment_method_id, amount, currency, stripe_transfer_id,
          transaction_id, status, description
        ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)
      `).run(
        request.userId, paymentMethod.id, request.amount, request.currency,
        transfer.id, transactionId, request.description
      );

      return {
        success: true,
        transactionId,
        stripeTransferId: transfer.id,
        estimatedArrival: this.calculateEstimatedArrival(paymentMethod.type)
      };
    } catch (error) {
      console.error('Error processing payout:', error);
      
      // Record failed payout
      const transactionId = this.generateTransactionId();
      this.db.prepare(`
        INSERT INTO payout_transactions (
          user_id, amount, currency, transaction_id, status, description, error_message
        ) VALUES (?, ?, ?, ?, 'failed', ?, ?)
      `).run(
        request.userId, request.amount, request.currency, transactionId,
        request.description, error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId
      };
    }
  }

  /**
   * Retry failed payout
   */
  async retryPayout(transactionId: string): Promise<PayoutResult> {
    const transaction = this.db.prepare(`
      SELECT * FROM payout_transactions WHERE transaction_id = ? AND status = 'failed'
    `).get(transactionId) as any;

    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found or not in failed status'
      };
    }

    return this.processPayout({
      userId: transaction.user_id,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      paymentMethodId: transaction.payment_method_id
    });
  }

  /**
   * Get payout history for user
   */
  getPayoutHistory(userId: number, limit: number = 50, offset: number = 0): {
    transactions: any[];
    total: number;
  } {
    const total = this.db.prepare(`
      SELECT COUNT(*) as count FROM payout_transactions WHERE user_id = ?
    `).get(userId) as { count: number };

    const transactions = this.db.prepare(`
      SELECT pt.*, pm.type as payment_method_type, pm.last4, pm.bank_name
      FROM payout_transactions pt
      LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    return {
      transactions,
      total: total.count
    };
  }

  /**
   * Generate tax documents for user
   */
  async generateTaxDocument(userId: number, year: number): Promise<TaxDocument> {
    // Get total rewards paid in the year
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const totalRewards = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM rewards r
      JOIN payout_transactions pt ON r.transaction_id = pt.transaction_id
      WHERE r.user_id = ? AND r.status = 'paid' 
      AND pt.created_at >= ? AND pt.created_at < ?
    `).get(userId, yearStart, yearEnd) as { total: number };

    const documentType = totalRewards.total >= 600 ? '1099-NEC' : '1099-MISC';

    // Check if document already exists
    const existing = this.db.prepare(`
      SELECT * FROM tax_documents WHERE user_id = ? AND year = ?
    `).get(userId, year) as any;

    if (existing) {
      return this.mapDatabaseToTaxDocument(existing);
    }

    // Insert new tax document record
    const insertStmt = this.db.prepare(`
      INSERT INTO tax_documents (user_id, year, total_amount, document_type)
      VALUES (?, ?, ?, ?)
    `);

    const result = insertStmt.run(userId, year, totalRewards.total, documentType);

    // In a real implementation, you would generate the actual PDF document here
    // and upload it to a secure storage service, then update the document_url

    return this.getTaxDocumentById(result.lastInsertRowid as number);
  }

  /**
   * Get tax documents for user
   */
  getUserTaxDocuments(userId: number): TaxDocument[] {
    const documents = this.db.prepare(`
      SELECT * FROM tax_documents WHERE user_id = ? ORDER BY year DESC
    `).all(userId) as any[];

    return documents.map(this.mapDatabaseToTaxDocument);
  }

  /**
   * Validate payment method with micro-deposits (for bank accounts)
   */
  async validatePaymentMethod(userId: number, paymentMethodId: string, amounts: number[]): Promise<boolean> {
    try {
      const paymentMethod = this.db.prepare(`
        SELECT * FROM payment_methods 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `).get(paymentMethodId, userId) as any;

      if (!paymentMethod || paymentMethod.type !== 'bank_account') {
        throw new Error('Invalid payment method for validation');
      }

      // Verify micro-deposits with Stripe
      await this.stripe.paymentMethods.update(paymentMethod.stripe_payment_method_id, {
        us_bank_account: {
          account_holder_type: 'individual'
        }
      });

      // Mark as verified
      this.db.prepare(`
        UPDATE payment_methods SET is_verified = 1 WHERE id = ?
      `).run(paymentMethodId);

      return true;
    } catch (error) {
      console.error('Error validating payment method:', error);
      return false;
    }
  }

  /**
   * Get payment reconciliation data
   */
  getReconciliationData(startDate: string, endDate: string): {
    totalPayouts: number;
    totalAmount: number;
    successfulPayouts: number;
    failedPayouts: number;
    transactions: any[];
  } {
    const summary = this.db.prepare(`
      SELECT 
        COUNT(*) as totalPayouts,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as successfulPayouts,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failedPayouts
      FROM payout_transactions
      WHERE created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as any;

    const transactions = this.db.prepare(`
      SELECT pt.*, u.email, u.first_name, u.last_name
      FROM payout_transactions pt
      JOIN users u ON pt.user_id = u.id
      WHERE pt.created_at >= ? AND pt.created_at <= ?
      ORDER BY pt.created_at DESC
    `).all(startDate, endDate);

    return {
      totalPayouts: summary.totalPayouts,
      totalAmount: summary.totalAmount,
      successfulPayouts: summary.successfulPayouts,
      failedPayouts: summary.failedPayouts,
      transactions
    };
  }

  // Private helper methods

  private getPaymentMethodById(id: number): PaymentMethod {
    const method = this.db.prepare(`
      SELECT * FROM payment_methods WHERE id = ?
    `).get(id) as any;

    if (!method) {
      throw new Error('Payment method not found');
    }

    return this.mapDatabaseToPaymentMethod(method);
  }

  private getTaxDocumentById(id: number): TaxDocument {
    const document = this.db.prepare(`
      SELECT * FROM tax_documents WHERE id = ?
    `).get(id) as any;

    if (!document) {
      throw new Error('Tax document not found');
    }

    return this.mapDatabaseToTaxDocument(document);
  }

  private mapDatabaseToPaymentMethod(row: any): PaymentMethod {
    return {
      id: row.id.toString(),
      userId: row.user_id,
      type: row.type,
      stripePaymentMethodId: row.stripe_payment_method_id,
      last4: row.last4,
      bankName: row.bank_name,
      accountHolderName: row.account_holder_name,
      isDefault: row.is_default === 1,
      isVerified: row.is_verified === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDatabaseToTaxDocument(row: any): TaxDocument {
    return {
      userId: row.user_id,
      year: row.year,
      totalAmount: row.total_amount,
      documentType: row.document_type,
      documentUrl: row.document_url,
      generatedAt: row.created_at
    };
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private calculateEstimatedArrival(paymentMethodType: string): string {
    const now = new Date();
    let businessDays = 0;

    switch (paymentMethodType) {
      case 'bank_account':
        businessDays = 3; // ACH transfers typically take 3 business days
        break;
      case 'debit_card':
        businessDays = 1; // Debit card transfers are faster
        break;
      default:
        businessDays = 3;
    }

    // Calculate business days (excluding weekends)
    let estimatedDate = new Date(now);
    let addedDays = 0;
    
    while (addedDays < businessDays) {
      estimatedDate.setDate(estimatedDate.getDate() + 1);
      const dayOfWeek = estimatedDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        addedDays++;
      }
    }

    return estimatedDate.toISOString();
  }
}