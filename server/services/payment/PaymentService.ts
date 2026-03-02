import { getDatabase } from '../../database/connection';
import { PaymentGatewayFactory } from './PaymentGatewayFactory';
import type { PaymentInitiateRequest, PaymentVerifyRequest, PaymentTransaction } from '@shared/payment';

export class PaymentService {
  /**
   * Initiate payment
   */
  static async initiatePayment(request: PaymentInitiateRequest) {
    const db = await getDatabase();
    const gateway = PaymentGatewayFactory.getGateway();

    try {
      // Initiate payment with gateway
      const response = await gateway.initiatePayment(request);

      if (!response.success) {
        return { success: false, error: response.error };
      }

      // Store transaction in database
      await db.query(
        `INSERT INTO payment_transactions 
         (user_id, plan_id, order_id, transaction_id, gateway, amount, currency, status, gateway_response, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          request.userId,
          request.planId,
          response.orderId,
          response.transactionId,
          gateway.getGatewayName(),
          request.amount,
          request.currency,
          'initiated',
          JSON.stringify(response.paymentData || {}),
          JSON.stringify({ billingCycle: request.billingCycle })
        ]
      );

      return {
        success: true,
        transactionId: response.transactionId,
        orderId: response.orderId,
        redirectUrl: response.redirectUrl
      };
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error.message || 'Payment initiation failed'
      };
    }
  }

  /**
   * Verify payment
   */
  static async verifyPayment(request: PaymentVerifyRequest) {
    const db = await getDatabase();
    const gateway = PaymentGatewayFactory.getGateway(request.gateway);

    try {
      // Verify with gateway
      const response = await gateway.verifyPayment(request);

      // Update transaction status
      await db.query(
        `UPDATE payment_transactions 
         SET status = $1, gateway_response = $2, updated_at = NOW()
         WHERE transaction_id = $3`,
        [response.status, JSON.stringify(request.gatewayResponse), request.transactionId]
      );

      // If payment successful, activate subscription
      if (response.verified && response.status === 'success') {
        await this.activateSubscription(request.transactionId);
      }

      return response;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        verified: false,
        transactionId: request.transactionId,
        orderId: request.orderId,
        amount: 0,
        status: 'failed' as const,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Activate subscription after successful payment
   */
  private static async activateSubscription(transactionId: string) {
    const db = await getDatabase();

    try {
      // Get transaction details
      const txnResult = await db.query(
        `SELECT user_id, plan_id, metadata FROM payment_transactions WHERE transaction_id = $1`,
        [transactionId]
      );

      if (!txnResult.rows[0]) {
        throw new Error('Transaction not found');
      }

      const { user_id, plan_id, metadata } = txnResult.rows[0];
      const billingCycle = metadata?.billingCycle || 'monthly';

      // Calculate period end
      const periodEnd = new Date();
      if (billingCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Check if user already has an active subscription
      const existingResult = await db.query(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = $1 AND status = 'active'`,
        [user_id]
      );

      if (existingResult.rows[0]) {
        // Update existing subscription
        await db.query(
          `UPDATE user_subscriptions 
           SET plan_id = $1, 
               billing_cycle = $2,
               current_period_start = NOW(),
               current_period_end = $3,
               payment_id = $4,
               updated_at = NOW()
           WHERE user_id = $5 AND status = 'active'`,
          [plan_id, billingCycle, periodEnd, transactionId, user_id]
        );
      } else {
        // Create new subscription
        await db.query(
          `INSERT INTO user_subscriptions 
           (user_id, plan_id, status, billing_cycle, current_period_end, payment_id)
           VALUES ($1, $2, 'active', $3, $4, $5)`,
          [user_id, plan_id, billingCycle, periodEnd, transactionId]
        );
      }

      console.log(`Subscription activated for user ${user_id}, transaction ${transactionId}`);
    } catch (error) {
      console.error('Subscription activation error:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    const db = await getDatabase();

    const result = await db.query(
      `SELECT * FROM payment_transactions WHERE transaction_id = $1`,
      [transactionId]
    );

    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      orderId: row.order_id,
      transactionId: row.transaction_id,
      gateway: row.gateway,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      gatewayResponse: row.gateway_response,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Get user's payment history
   */
  static async getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    const db = await getDatabase();

    const result = await db.query(
      `SELECT * FROM payment_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      planId: row.plan_id,
      orderId: row.order_id,
      transactionId: row.transaction_id,
      gateway: row.gateway,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      gatewayResponse: row.gateway_response,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
}
