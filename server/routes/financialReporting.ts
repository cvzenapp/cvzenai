/**
 * Financial Reporting API Routes
 * Handles tax documents, compliance reports, payment disputes, and audit trails
 */

import express from 'express';
import { z } from 'zod';
import { FinancialReportingService } from '../services/financialReportingService.js';

const router = express.Router();
const financialReportingService = new FinancialReportingService();

// Validation schemas
const generateTaxDocumentSchema = z.object({
  year: z.number().int().min(2020).max(new Date().getFullYear())
});

const complianceReportSchema = z.object({
  reportType: z.enum(['quarterly', 'annual', 'monthly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const createDisputeSchema = z.object({
  transactionId: z.string().min(1),
  disputeType: z.enum(['incorrect_amount', 'unauthorized_payment', 'duplicate_payment', 'other']),
  description: z.string().min(10).max(1000),
  evidence: z.array(z.object({
    type: z.enum(['document', 'screenshot', 'email']),
    url: z.string().url(),
    description: z.string().max(255)
  })).optional().default([])
});

const updateDisputeSchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'rejected']),
  resolution: z.object({
    action: z.enum(['refund', 'adjustment', 'no_action']),
    amount: z.number().min(0).optional(),
    notes: z.string().max(1000),
    resolvedBy: z.number().int().positive()
  }).optional()
});

const auditTrailFiltersSchema = z.object({
  userId: z.number().int().positive().optional(),
  action: z.string().optional(),
  entityType: z.enum(['referral', 'reward', 'payment', 'dispute', 'tax_document']).optional(),
  entityId: z.number().int().positive().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const disputeFiltersSchema = z.object({
  userId: z.number().int().positive().optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'rejected']).optional(),
  disputeType: z.enum(['incorrect_amount', 'unauthorized_payment', 'duplicate_payment', 'other']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const financialSummarySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Middleware to ensure user is authenticated
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = parseInt(userId as string);
  next();
};

// Middleware to ensure admin access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isAdmin = req.headers['x-is-admin'] === 'true';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * POST /api/financial/tax-documents
 * Generate tax document for user
 */
router.post('/tax-documents', requireAuth, async (req, res) => {
  try {
    const { year } = generateTaxDocumentSchema.parse(req.body);
    
    const taxDocument = await financialReportingService.generateTaxDocument(req.userId, year);
    
    res.status(201).json({ taxDocument });
  } catch (error) {
    console.error('Error generating tax document:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate tax document',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/financial/tax-documents
 * Get tax documents for user
 */
router.get('/tax-documents', requireAuth, async (req, res) => {
  try {
    // This would typically call a method to get user's tax documents
    // For now, we'll return a placeholder response
    res.json({ taxDocuments: [] });
  } catch (error) {
    console.error('Error fetching tax documents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tax documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/financial/disputes
 * Create a payment dispute
 */
router.post('/disputes', requireAuth, async (req, res) => {
  try {
    const { transactionId, disputeType, description, evidence } = createDisputeSchema.parse(req.body);
    
    const dispute = await financialReportingService.createPaymentDispute(
      req.userId,
      transactionId,
      disputeType,
      description,
      evidence
    );
    
    res.status(201).json({ dispute });
  } catch (error) {
    console.error('Error creating payment dispute:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create payment dispute',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/financial/disputes
 * Get payment disputes with filtering
 */
router.get('/disputes', requireAuth, async (req, res) => {
  try {
    const filters = disputeFiltersSchema.parse(req.query);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // For regular users, only show their own disputes
    if (!req.headers['x-is-admin']) {
      filters.userId = req.userId;
    }
    
    const result = financialReportingService.getPaymentDisputes(filters, limit, offset);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching payment disputes:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch payment disputes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/financial/disputes/:id
 * Update payment dispute status (admin only)
 */
router.put('/disputes/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const disputeId = parseInt(req.params.id);
    const { status, resolution } = updateDisputeSchema.parse(req.body);
    
    const dispute = await financialReportingService.updatePaymentDispute(
      disputeId,
      status,
      resolution,
      req.userId
    );
    
    res.json({ dispute });
  } catch (error) {
    console.error('Error updating payment dispute:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update payment dispute',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/financial/audit-trail
 * Get audit trail entries
 */
router.get('/audit-trail', requireAuth, async (req, res) => {
  try {
    const filters = auditTrailFiltersSchema.parse(req.query);
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // For regular users, only show their own audit entries
    if (!req.headers['x-is-admin']) {
      filters.userId = req.userId;
    }
    
    const result = financialReportingService.getAuditTrail(filters, limit, offset);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch audit trail',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin routes

/**
 * POST /api/financial/admin/compliance-report
 * Generate compliance report (admin only)
 */
router.post('/admin/compliance-report', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reportType, startDate, endDate } = complianceReportSchema.parse(req.body);
    
    const report = await financialReportingService.generateComplianceReport(
      reportType,
      startDate,
      endDate
    );
    
    res.json({ report });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate compliance report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/financial/admin/summary
 * Get financial summary (admin only)
 */
router.get('/admin/summary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = financialSummarySchema.parse(req.query);
    
    const summary = financialReportingService.getFinancialSummary(startDate, endDate);
    
    res.json({ summary });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch financial summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/financial/admin/disputes/stats
 * Get dispute statistics (admin only)
 */
router.get('/admin/disputes/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate as string || '2024-01-01';
    const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
    
    const disputes = financialReportingService.getPaymentDisputes({
      startDate,
      endDate
    });
    
    // Calculate statistics
    const stats = {
      total: disputes.total,
      byStatus: disputes.disputes.reduce((acc, dispute) => {
        acc[dispute.status] = (acc[dispute.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: disputes.disputes.reduce((acc, dispute) => {
        acc[dispute.disputeType] = (acc[dispute.disputeType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageResolutionTime: 0 // Would calculate based on created/resolved dates
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching dispute statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dispute statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/financial/admin/compliance/score
 * Get compliance score (admin only)
 */
router.get('/admin/compliance/score', requireAuth, requireAdmin, async (req, res) => {
  try {
    const startDate = req.query.startDate as string || '2024-01-01';
    const endDate = req.query.endDate as string || new Date().toISOString().split('T')[0];
    
    const summary = financialReportingService.getFinancialSummary(startDate, endDate);
    
    res.json({ 
      complianceScore: summary.complianceScore,
      factors: {
        disputeResolution: {
          total: summary.totalDisputes,
          resolved: summary.resolvedDisputes,
          rate: summary.totalDisputes > 0 ? (summary.resolvedDisputes / summary.totalDisputes) * 100 : 100
        },
        taxDocuments: {
          generated: summary.taxDocumentsGenerated,
          required: Math.max(1, Math.floor(summary.totalPayouts * 0.1))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching compliance score:', error);
    res.status(500).json({ 
      error: 'Failed to fetch compliance score',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

export default router;