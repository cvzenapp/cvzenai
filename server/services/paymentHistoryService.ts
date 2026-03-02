import { getDatabase } from '../database/connection';
import type { PaymentHistory, Invoice, PaymentSummary, SubscriptionWithDetails, InvoiceLineItem } from '@shared/payment';

class PaymentHistoryService {
  /**
   * Record a payment
   */
  static async recordPayment(data: {
    subscriptionId: string;
    subscriptionType: 'user' | 'company';
    amount: number;
    currency?: string;
    paymentMethod?: string;
    paymentGatewayId?: string;
    transactionId?: string;
    billingEmail?: string;
    billingName?: string;
    billingAddress?: any;
    metadata?: any;
  }): Promise<PaymentHistory> {
    const db = await getDatabase();
    
    const result = await db.query(
      `INSERT INTO payment_history 
       (subscription_id, subscription_type, amount, currency, payment_method, 
        payment_gateway_id, transaction_id, billing_email, billing_name, 
        billing_address, metadata, payment_status, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completed', NOW())
       RETURNING *`,
      [
        data.subscriptionId,
        data.subscriptionType,
        data.amount,
        data.currency || 'INR',
        data.paymentMethod,
        data.paymentGatewayId,
        data.transactionId,
        data.billingEmail,
        data.billingName,
        JSON.stringify(data.billingAddress),
        JSON.stringify(data.metadata)
      ]
    );
    
    return this.mapPaymentFromDb(result.rows[0]);
  }

  /**
   * Get payment history for a subscription
   */
  static async getPaymentHistory(
    subscriptionId: string,
    subscriptionType: 'user' | 'company'
  ): Promise<PaymentHistory[]> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT * FROM payment_history
       WHERE subscription_id = $1 AND subscription_type = $2
       ORDER BY payment_date DESC`,
      [subscriptionId, subscriptionType]
    );
    
    return result.rows.map(this.mapPaymentFromDb);
  }

  /**
   * Get payment history for a company (all subscriptions)
   */
  static async getCompanyPaymentHistory(companyId: string): Promise<PaymentHistory[]> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT ph.* FROM payment_history ph
       JOIN company_subscriptions cs ON ph.subscription_id = cs.id
       WHERE cs.company_id = $1 AND ph.subscription_type = 'company'
       ORDER BY ph.payment_date DESC`,
      [companyId]
    );
    
    return result.rows.map(this.mapPaymentFromDb);
  }

  static async getUserPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT ph.* FROM payment_history ph
       JOIN user_subscriptions us ON ph.subscription_id = us.id
       WHERE us.user_id = $1 AND ph.subscription_type = 'user'
       ORDER BY ph.payment_date DESC`,
      [userId]
    );
    
    return result.rows.map(this.mapPaymentFromDb);
  }

  /**
   * Get payment summary
   */
  static async getPaymentSummary(
    subscriptionId: string,
    subscriptionType: 'user' | 'company'
  ): Promise<PaymentSummary> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN refund_amount ELSE 0 END), 0) as total_refunded,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as payment_count,
        MAX(CASE WHEN payment_status = 'completed' THEN payment_date END) as last_payment_date,
        currency
       FROM payment_history
       WHERE subscription_id = $1 AND subscription_type = $2
       GROUP BY currency`,
      [subscriptionId, subscriptionType]
    );
    
    const row = result.rows[0];
    if (!row) {
      return {
        totalPaid: 0,
        totalRefunded: 0,
        paymentCount: 0,
        currency: 'INR'
      };
    }
    
    // Get next billing date from subscription
    const table = subscriptionType === 'user' ? 'user_subscriptions' : 'company_subscriptions';
    const subResult = await db.query(
      `SELECT current_period_end FROM ${table} WHERE id = $1`,
      [subscriptionId]
    );
    
    return {
      totalPaid: parseInt(row.total_paid),
      totalRefunded: parseInt(row.total_refunded),
      paymentCount: parseInt(row.payment_count),
      lastPaymentDate: row.last_payment_date,
      nextBillingDate: subResult.rows[0]?.current_period_end,
      currency: row.currency || 'INR'
    };
  }

  /**
   * Create an invoice
   */
  static async createInvoice(data: {
    subscriptionId: string;
    subscriptionType: 'user' | 'company';
    paymentId?: string;
    amount: number;
    taxAmount?: number;
    discountAmount?: number;
    billingName: string;
    billingEmail: string;
    billingAddress?: any;
    billingGstin?: string;
    lineItems: InvoiceLineItem[];
    dueDate?: Date;
    notes?: string;
  }): Promise<Invoice> {
    const db = await getDatabase();
    
    const totalAmount = data.amount + (data.taxAmount || 0) - (data.discountAmount || 0);
    
    const result = await db.query(
      `INSERT INTO invoices 
       (subscription_id, subscription_type, payment_id, status, amount, tax_amount, 
        discount_amount, total_amount, billing_name, billing_email, billing_address, 
        billing_gstin, line_items, due_date, notes)
       VALUES ($1, $2, $3, 'sent', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.subscriptionId,
        data.subscriptionType,
        data.paymentId,
        data.amount,
        data.taxAmount || 0,
        data.discountAmount || 0,
        totalAmount,
        data.billingName,
        data.billingEmail,
        JSON.stringify(data.billingAddress),
        data.billingGstin,
        JSON.stringify(data.lineItems),
        data.dueDate,
        data.notes
      ]
    );
    
    return this.mapInvoiceFromDb(result.rows[0]);
  }

  /**
   * Get invoices for a subscription
   */
  static async getInvoices(
    subscriptionId: string,
    subscriptionType: 'user' | 'company'
  ): Promise<Invoice[]> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT * FROM invoices
       WHERE subscription_id = $1 AND subscription_type = $2
       ORDER BY issue_date DESC`,
      [subscriptionId, subscriptionType]
    );
    
    return result.rows.map(this.mapInvoiceFromDb);
  }

  /**
   * Get invoices for a company (all subscriptions)
   */
  static async getCompanyInvoices(companyId: string): Promise<Invoice[]> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT i.* FROM invoices i
       JOIN company_subscriptions cs ON i.subscription_id = cs.id
       WHERE cs.company_id = $1 AND i.subscription_type = 'company'
       ORDER BY i.issue_date DESC`,
      [companyId]
    );
    
    return result.rows.map(this.mapInvoiceFromDb);
  }

  static async getUserInvoices(userId: string): Promise<Invoice[]> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT i.* FROM invoices i
       JOIN user_subscriptions us ON i.subscription_id = us.id
       WHERE us.user_id = $1 AND i.subscription_type = 'user'
       ORDER BY i.issue_date DESC`,
      [userId]
    );
    
    return result.rows.map(this.mapInvoiceFromDb);
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT * FROM invoices WHERE id = $1`,
      [invoiceId]
    );
    
    return result.rows[0] ? this.mapInvoiceFromDb(result.rows[0]) : null;
  }

  /**
   * Mark invoice as paid
   */
  static async markInvoicePaid(invoiceId: string, paymentId: string): Promise<Invoice> {
    const db = await getDatabase();
    
    const result = await db.query(
      `UPDATE invoices 
       SET status = 'paid', payment_id = $1, paid_date = CURRENT_DATE, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [paymentId, invoiceId]
    );
    
    return this.mapInvoiceFromDb(result.rows[0]);
  }

  /**
   * Get subscription details with expiry info
   */
  static async getSubscriptionDetails(
    subscriptionId: string,
    subscriptionType: 'user' | 'company'
  ): Promise<SubscriptionWithDetails | null> {
    const db = await getDatabase();
    const table = subscriptionType === 'user' ? 'user_subscriptions' : 'company_subscriptions';
    
    const result = await db.query(
      `SELECT s.*, sp.name as plan_name, sp.display_name as plan_display_name
       FROM ${table} s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.id = $1`,
      [subscriptionId]
    );
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    const now = new Date();
    const periodEnd = new Date(row.current_period_end);
    const daysUntilExpiry = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      id: row.id,
      planName: row.plan_name,
      planDisplayName: row.plan_display_name,
      status: row.status,
      billingCycle: row.billing_cycle,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      cancelledAt: row.cancelled_at,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
      isCancelled: row.status === 'cancelled'
    };
  }

  // Mapping helpers
  private static mapPaymentFromDb(row: any): PaymentHistory {
    return {
      id: row.id,
      subscriptionId: row.subscription_id,
      subscriptionType: row.subscription_type,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      paymentGatewayId: row.payment_gateway_id,
      paymentStatus: row.payment_status,
      transactionId: row.transaction_id,
      invoiceId: row.invoice_id,
      billingEmail: row.billing_email,
      billingName: row.billing_name,
      billingAddress: row.billing_address,
      metadata: row.metadata,
      paymentDate: row.payment_date,
      refundDate: row.refund_date,
      refundAmount: row.refund_amount,
      refundReason: row.refund_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static mapInvoiceFromDb(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      subscriptionId: row.subscription_id,
      subscriptionType: row.subscription_type,
      paymentId: row.payment_id,
      status: row.status,
      amount: row.amount,
      taxAmount: row.tax_amount,
      discountAmount: row.discount_amount,
      totalAmount: row.total_amount,
      currency: row.currency,
      billingName: row.billing_name,
      billingEmail: row.billing_email,
      billingAddress: row.billing_address,
      billingGstin: row.billing_gstin,
      lineItems: row.line_items,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      paidDate: row.paid_date,
      pdfUrl: row.pdf_url,
      notes: row.notes,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export { PaymentHistoryService };
export default PaymentHistoryService;
