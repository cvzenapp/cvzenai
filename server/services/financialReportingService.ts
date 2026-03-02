/**
 * Financial Reporting Service
 * Handles tax document generation, compliance reporting, and financial audit trails
 */

import { getDatabase } from '../database/connection.js';
import { PaymentProcessor } from './paymentProcessor.js';

export interface TaxDocumentData {
  userId: number;
  year: number;
  totalAmount: number;
  documentType: '1099-MISC' | '1099-NEC';
  recipientInfo: {
    name: string;
    address: string;
    tin: string; // Tax Identification Number
  };
  payerInfo: {
    name: string;
    address: string;
    tin: string;
  };
  transactions: Array<{
    date: string;
    amount: number;
    description: string;
    transactionId: string;
  }>;
}

export interface ComplianceReport {
  reportType: 'quarterly' | 'annual' | 'monthly';
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalPayouts: number;
    totalAmount: number;
    totalRecipients: number;
    taxableAmount: number;
    nonTaxableAmount: number;
  };
  recipients: Array<{
    userId: number;
    name: string;
    tin: string;
    totalAmount: number;
    requiresTaxDocument: boolean;
  }>;
  transactions: Array<{
    transactionId: string;
    userId: number;
    amount: number;
    date: string;
    status: string;
    taxable: boolean;
  }>;
}

export interface PaymentDispute {
  id: number;
  userId: number;
  transactionId: string;
  disputeType: 'incorrect_amount' | 'unauthorized_payment' | 'duplicate_payment' | 'other';
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  description: string;
  evidence: Array<{
    type: 'document' | 'screenshot' | 'email';
    url: string;
    description: string;
  }>;
  resolution?: {
    action: 'refund' | 'adjustment' | 'no_action';
    amount?: number;
    notes: string;
    resolvedBy: number;
    resolvedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditTrailEntry {
  id: number;
  userId: number;
  action: string;
  entityType: 'referral' | 'reward' | 'payment' | 'dispute' | 'tax_document';
  entityId: number;
  oldValues?: any;
  newValues?: any;
  metadata: any;
  ipAddress?: string;
  userAgent?: string;
  performedBy: number;
  createdAt: string;
}

export class FinancialReportingService {
  private db = getDatabase();
  private paymentProcessor = new PaymentProcessor();

  /**
   * Generate 1099 tax document for a user
   */
  async generateTaxDocument(userId: number, year: number): Promise<TaxDocumentData> {
    // Get user information
    const user = this.db.prepare(`
      SELECT id, first_name, last_name, email, tax_id, address_line1, address_line2, 
             city, state, zip_code, country
      FROM users 
      WHERE id = ?
    `).get(userId) as any;

    if (!user) {
      throw new Error('User not found');
    }

    // Get all taxable transactions for the year
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const transactions = this.db.prepare(`
      SELECT pt.transaction_id, pt.amount, pt.created_at, pt.description,
             r.id as reward_id, ref.position_title, ref.company_name
      FROM payout_transactions pt
      JOIN rewards r ON pt.transaction_id = r.transaction_id
      JOIN referrals ref ON r.referral_id = ref.id
      WHERE pt.user_id = ? AND pt.status = 'completed'
      AND pt.created_at >= ? AND pt.created_at <= ?
      ORDER BY pt.created_at
    `).all(userId, yearStart, yearEnd) as any[];

    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Determine document type based on amount
    const documentType = totalAmount >= 600 ? '1099-NEC' : '1099-MISC';

    // Get company information (payer)
    const companyInfo = this.getCompanyInfo();

    const taxDocumentData: TaxDocumentData = {
      userId,
      year,
      totalAmount,
      documentType,
      recipientInfo: {
        name: `${user.first_name} ${user.last_name}`,
        address: this.formatAddress(user),
        tin: user.tax_id || 'Not Provided'
      },
      payerInfo: companyInfo,
      transactions: transactions.map(tx => ({
        date: tx.created_at,
        amount: tx.amount,
        description: `Referral reward - ${tx.position_title} at ${tx.company_name}`,
        transactionId: tx.transaction_id
      }))
    };

    // Store tax document record
    await this.storeTaxDocumentRecord(taxDocumentData);

    // Log audit trail
    await this.logAuditTrail({
      userId,
      action: 'tax_document_generated',
      entityType: 'tax_document',
      entityId: userId,
      metadata: { year, documentType, totalAmount },
      performedBy: 0 // System generated
    });

    return taxDocumentData;
  }

  /**
   * Generate compliance report for a specific period
   */
  async generateComplianceReport(
    reportType: 'quarterly' | 'annual' | 'monthly',
    startDate: string,
    endDate: string
  ): Promise<ComplianceReport> {
    // Get summary statistics
    const summary = this.db.prepare(`
      SELECT 
        COUNT(DISTINCT pt.id) as totalPayouts,
        COALESCE(SUM(pt.amount), 0) as totalAmount,
        COUNT(DISTINCT pt.user_id) as totalRecipients,
        COALESCE(SUM(CASE WHEN pt.amount >= 600 THEN pt.amount ELSE 0 END), 0) as taxableAmount,
        COALESCE(SUM(CASE WHEN pt.amount < 600 THEN pt.amount ELSE 0 END), 0) as nonTaxableAmount
      FROM payout_transactions pt
      WHERE pt.status = 'completed' 
      AND pt.created_at >= ? AND pt.created_at <= ?
    `).get(startDate, endDate) as any;

    // Get recipient details
    const recipients = this.db.prepare(`
      SELECT 
        u.id as userId,
        u.first_name || ' ' || u.last_name as name,
        u.tax_id as tin,
        COALESCE(SUM(pt.amount), 0) as totalAmount,
        CASE WHEN COALESCE(SUM(pt.amount), 0) >= 600 THEN 1 ELSE 0 END as requiresTaxDocument
      FROM users u
      JOIN payout_transactions pt ON u.id = pt.user_id
      WHERE pt.status = 'completed'
      AND pt.created_at >= ? AND pt.created_at <= ?
      GROUP BY u.id, u.first_name, u.last_name, u.tax_id
      ORDER BY totalAmount DESC
    `).all(startDate, endDate) as any[];

    // Get all transactions
    const transactions = this.db.prepare(`
      SELECT 
        pt.transaction_id,
        pt.user_id as userId,
        pt.amount,
        pt.created_at as date,
        pt.status,
        CASE WHEN pt.amount >= 600 THEN 1 ELSE 0 END as taxable
      FROM payout_transactions pt
      WHERE pt.status = 'completed'
      AND pt.created_at >= ? AND pt.created_at <= ?
      ORDER BY pt.created_at DESC
    `).all(startDate, endDate) as any[];

    const report: ComplianceReport = {
      reportType,
      period: { startDate, endDate },
      summary: {
        totalPayouts: summary.totalPayouts,
        totalAmount: summary.totalAmount,
        totalRecipients: summary.totalRecipients,
        taxableAmount: summary.taxableAmount,
        nonTaxableAmount: summary.nonTaxableAmount
      },
      recipients: recipients.map(r => ({
        userId: r.userId,
        name: r.name,
        tin: r.tin || 'Not Provided',
        totalAmount: r.totalAmount,
        requiresTaxDocument: r.requiresTaxDocument === 1
      })),
      transactions: transactions.map(t => ({
        transactionId: t.transaction_id,
        userId: t.userId,
        amount: t.amount,
        date: t.date,
        status: t.status,
        taxable: t.taxable === 1
      }))
    };

    // Log audit trail
    await this.logAuditTrail({
      userId: 0, // System report
      action: 'compliance_report_generated',
      entityType: 'payment',
      entityId: 0,
      metadata: { reportType, startDate, endDate, summary },
      performedBy: 0 // System generated
    });

    return report;
  }

  /**
   * Create a payment dispute
   */
  async createPaymentDispute(
    userId: number,
    transactionId: string,
    disputeType: PaymentDispute['disputeType'],
    description: string,
    evidence: PaymentDispute['evidence'] = []
  ): Promise<PaymentDispute> {
    // Verify transaction exists and belongs to user
    const transaction = this.db.prepare(`
      SELECT * FROM payout_transactions 
      WHERE transaction_id = ? AND user_id = ?
    `).get(transactionId, userId) as any;

    if (!transaction) {
      throw new Error('Transaction not found or does not belong to user');
    }

    // Check if dispute already exists
    const existingDispute = this.db.prepare(`
      SELECT id FROM payment_disputes 
      WHERE transaction_id = ? AND status IN ('open', 'investigating')
    `).get(transactionId) as any;

    if (existingDispute) {
      throw new Error('A dispute for this transaction is already open');
    }

    // Create dispute
    const insertStmt = this.db.prepare(`
      INSERT INTO payment_disputes (
        user_id, transaction_id, dispute_type, status, description, evidence
      ) VALUES (?, ?, ?, 'open', ?, ?)
    `);

    const result = insertStmt.run(
      userId,
      transactionId,
      disputeType,
      description,
      JSON.stringify(evidence)
    );

    const dispute = this.getPaymentDispute(result.lastInsertRowid as number);

    // Log audit trail
    await this.logAuditTrail({
      userId,
      action: 'dispute_created',
      entityType: 'dispute',
      entityId: dispute.id,
      metadata: { disputeType, transactionId },
      performedBy: userId
    });

    // Send notification to admin
    await this.notifyAdminOfDispute(dispute);

    return dispute;
  }

  /**
   * Update payment dispute status
   */
  async updatePaymentDispute(
    disputeId: number,
    status: PaymentDispute['status'],
    resolution?: PaymentDispute['resolution'],
    performedBy: number = 0
  ): Promise<PaymentDispute> {
    const dispute = this.getPaymentDispute(disputeId);
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const oldValues = { status: dispute.status, resolution: dispute.resolution };

    // Update dispute
    const updateStmt = this.db.prepare(`
      UPDATE payment_disputes 
      SET status = ?, resolution = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(status, resolution ? JSON.stringify(resolution) : null, disputeId);

    const updatedDispute = this.getPaymentDispute(disputeId);

    // Log audit trail
    await this.logAuditTrail({
      userId: dispute.userId,
      action: 'dispute_updated',
      entityType: 'dispute',
      entityId: disputeId,
      oldValues,
      newValues: { status, resolution },
      metadata: { disputeId },
      performedBy
    });

    // Process resolution if provided
    if (resolution && status === 'resolved') {
      await this.processDisputeResolution(updatedDispute, resolution);
    }

    return updatedDispute;
  }

  /**
   * Get payment disputes with filtering
   */
  getPaymentDisputes(
    filters: {
      userId?: number;
      status?: PaymentDispute['status'];
      disputeType?: PaymentDispute['disputeType'];
      startDate?: string;
      endDate?: string;
    } = {},
    limit: number = 50,
    offset: number = 0
  ): { disputes: PaymentDispute[]; total: number } {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      whereClause += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.disputeType) {
      whereClause += ' AND dispute_type = ?';
      params.push(filters.disputeType);
    }

    if (filters.startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    // Get total count
    const totalResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM payment_disputes ${whereClause}
    `).get(...params) as { total: number };

    // Get disputes with pagination
    const disputes = this.db.prepare(`
      SELECT * FROM payment_disputes 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    return {
      disputes: disputes.map(this.mapDatabaseToDispute),
      total: totalResult.total
    };
  }

  /**
   * Get audit trail entries
   */
  getAuditTrail(
    filters: {
      userId?: number;
      action?: string;
      entityType?: AuditTrailEntry['entityType'];
      entityId?: number;
      startDate?: string;
      endDate?: string;
    } = {},
    limit: number = 100,
    offset: number = 0
  ): { entries: AuditTrailEntry[]; total: number } {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      whereClause += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.action) {
      whereClause += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.entityType) {
      whereClause += ' AND entity_type = ?';
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      whereClause += ' AND entity_id = ?';
      params.push(filters.entityId);
    }

    if (filters.startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    // Get total count
    const totalResult = this.db.prepare(`
      SELECT COUNT(*) as total FROM financial_audit_trail ${whereClause}
    `).get(...params) as { total: number };

    // Get entries with pagination
    const entries = this.db.prepare(`
      SELECT * FROM financial_audit_trail 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    return {
      entries: entries.map(this.mapDatabaseToAuditEntry),
      total: totalResult.total
    };
  }

  /**
   * Generate financial summary report
   */
  getFinancialSummary(startDate: string, endDate: string): {
    totalPayouts: number;
    totalAmount: number;
    averagePayoutAmount: number;
    totalDisputes: number;
    resolvedDisputes: number;
    pendingDisputes: number;
    taxDocumentsGenerated: number;
    complianceScore: number;
  } {
    const payoutStats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalPayouts,
        COALESCE(SUM(amount), 0) as totalAmount,
        COALESCE(AVG(amount), 0) as averagePayoutAmount
      FROM payout_transactions
      WHERE status = 'completed' AND created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as any;

    const disputeStats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalDisputes,
        COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolvedDisputes,
        COALESCE(SUM(CASE WHEN status IN ('open', 'investigating') THEN 1 ELSE 0 END), 0) as pendingDisputes
      FROM payment_disputes
      WHERE created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as any;

    const taxDocStats = this.db.prepare(`
      SELECT COUNT(*) as taxDocumentsGenerated
      FROM tax_documents
      WHERE created_at >= ? AND created_at <= ?
    `).get(startDate, endDate) as any;

    // Calculate compliance score (percentage of resolved disputes and generated tax docs)
    const complianceScore = this.calculateComplianceScore(
      disputeStats.totalDisputes,
      disputeStats.resolvedDisputes,
      taxDocStats.taxDocumentsGenerated,
      payoutStats.totalPayouts
    );

    return {
      totalPayouts: payoutStats.totalPayouts,
      totalAmount: payoutStats.totalAmount,
      averagePayoutAmount: Math.round(payoutStats.averagePayoutAmount * 100) / 100,
      totalDisputes: disputeStats.totalDisputes,
      resolvedDisputes: disputeStats.resolvedDisputes,
      pendingDisputes: disputeStats.pendingDisputes,
      taxDocumentsGenerated: taxDocStats.taxDocumentsGenerated,
      complianceScore: Math.round(complianceScore * 100) / 100
    };
  }

  // Private helper methods

  private getPaymentDispute(disputeId: number): PaymentDispute {
    const dispute = this.db.prepare(`
      SELECT * FROM payment_disputes WHERE id = ?
    `).get(disputeId) as any;

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    return this.mapDatabaseToDispute(dispute);
  }

  private mapDatabaseToDispute(row: any): PaymentDispute {
    return {
      id: row.id,
      userId: row.user_id,
      transactionId: row.transaction_id,
      disputeType: row.dispute_type,
      status: row.status,
      description: row.description,
      evidence: row.evidence ? JSON.parse(row.evidence) : [],
      resolution: row.resolution ? JSON.parse(row.resolution) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDatabaseToAuditEntry(row: any): AuditTrailEntry {
    return {
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      oldValues: row.old_values ? JSON.parse(row.old_values) : undefined,
      newValues: row.new_values ? JSON.parse(row.new_values) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      performedBy: row.performed_by,
      createdAt: row.created_at
    };
  }

  private async logAuditTrail(entry: Omit<AuditTrailEntry, 'id' | 'createdAt'>): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT INTO financial_audit_trail (
        user_id, action, entity_type, entity_id, old_values, new_values, 
        metadata, ip_address, user_agent, performed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      entry.userId,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      entry.newValues ? JSON.stringify(entry.newValues) : null,
      JSON.stringify(entry.metadata),
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.performedBy
    );
  }

  private async storeTaxDocumentRecord(data: TaxDocumentData): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO tax_documents (
        user_id, year, total_amount, document_type, document_data
      ) VALUES (?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      data.userId,
      data.year,
      data.totalAmount,
      data.documentType,
      JSON.stringify(data)
    );
  }

  private getCompanyInfo(): TaxDocumentData['payerInfo'] {
    // In a real implementation, this would come from configuration
    return {
      name: 'CVZen Inc.',
      address: '123 Business St, Suite 100, San Francisco, CA 94105',
      tin: '12-3456789'
    };
  }

  private formatAddress(user: any): string {
    const parts = [
      user.address_line1,
      user.address_line2,
      user.city,
      user.state,
      user.zip_code,
      user.country
    ].filter(Boolean);

    return parts.join(', ') || 'Address not provided';
  }

  private async processDisputeResolution(
    dispute: PaymentDispute,
    resolution: PaymentDispute['resolution']
  ): Promise<void> {
    if (!resolution) return;

    switch (resolution.action) {
      case 'refund':
        if (resolution.amount) {
          await this.processRefund(dispute.transactionId, resolution.amount);
        }
        break;
      case 'adjustment':
        if (resolution.amount) {
          await this.processAdjustment(dispute.transactionId, resolution.amount);
        }
        break;
      case 'no_action':
        // No financial action needed
        break;
    }

    // Send notification to user about resolution
    await this.notifyUserOfResolution(dispute, resolution);
  }

  private async processRefund(transactionId: string, amount: number): Promise<void> {
    // Create a negative transaction to represent the refund
    const insertStmt = this.db.prepare(`
      INSERT INTO payout_transactions (
        user_id, amount, currency, transaction_id, status, description
      ) SELECT 
        user_id, ?, currency, ?, 'completed', 'Dispute refund for ' || transaction_id
      FROM payout_transactions 
      WHERE transaction_id = ?
    `);

    const refundTransactionId = `refund_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    insertStmt.run(-amount, refundTransactionId, transactionId);
  }

  private async processAdjustment(transactionId: string, amount: number): Promise<void> {
    // Create an adjustment transaction
    const insertStmt = this.db.prepare(`
      INSERT INTO payout_transactions (
        user_id, amount, currency, transaction_id, status, description
      ) SELECT 
        user_id, ?, currency, ?, 'completed', 'Dispute adjustment for ' || transaction_id
      FROM payout_transactions 
      WHERE transaction_id = ?
    `);

    const adjustmentTransactionId = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    insertStmt.run(amount, adjustmentTransactionId, transactionId);
  }

  private async notifyAdminOfDispute(dispute: PaymentDispute): Promise<void> {
    // In a real implementation, this would send an email or notification
    console.log(`New payment dispute created: ${dispute.id} for transaction ${dispute.transactionId}`);
  }

  private async notifyUserOfResolution(
    dispute: PaymentDispute,
    resolution: PaymentDispute['resolution']
  ): Promise<void> {
    // In a real implementation, this would send an email notification
    console.log(`Dispute ${dispute.id} resolved with action: ${resolution?.action}`);
  }

  private calculateComplianceScore(
    totalDisputes: number,
    resolvedDisputes: number,
    taxDocumentsGenerated: number,
    totalPayouts: number
  ): number {
    if (totalPayouts === 0) return 100;

    // Calculate dispute resolution rate (weight: 40%)
    const disputeResolutionRate = totalDisputes > 0 ? (resolvedDisputes / totalDisputes) : 1;

    // Calculate tax document compliance rate (weight: 60%)
    // Assume we should generate tax docs for high-value payouts
    const expectedTaxDocs = Math.max(1, Math.floor(totalPayouts * 0.1)); // Estimate
    const taxDocComplianceRate = Math.min(1, taxDocumentsGenerated / expectedTaxDocs);

    return (disputeResolutionRate * 40) + (taxDocComplianceRate * 60);
  }
}