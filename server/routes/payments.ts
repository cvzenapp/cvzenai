/**
 * Payment Processing API Routes
 * Handles payment methods, payouts, and tax documents
 */

import express from 'express';
import { z } from 'zod';
import { EnhancedRewardEngine } from '../services/enhancedRewardEngine.js';
import { PaymentProcessor } from '../services/paymentProcessor.js';

const router = express.Router();
const rewardEngine = new EnhancedRewardEngine();
const paymentProcessor = new PaymentProcessor();

// Validation schemas
const addPaymentMethodSchema = z.object({
  stripePaymentMethodId: z.string().min(1),
  accountHolderName: z.string().min(1).max(255)
});

const setDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1)
});

const validatePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  amounts: z.array(z.number().min(0.01).max(1.00)).length(2)
});

const generateTaxDocumentSchema = z.object({
  year: z.number().int().min(2020).max(new Date().getFullYear())
});

const retryPayoutSchema = z.object({
  transactionId: z.string().min(1)
});

const reconciliationSchema = z.object({
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
 * GET /api/payments/methods
 * Get user's payment methods
 */
router.get('/methods', requireAuth, async (req, res) => {
  try {
    const paymentMethods = rewardEngine.getUserPaymentMethods(req.userId);
    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment methods',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/payments/methods
 * Add new payment method
 */
router.post('/methods', requireAuth, async (req, res) => {
  try {
    const { stripePaymentMethodId, accountHolderName } = addPaymentMethodSchema.parse(req.body);
    
    const paymentMethod = await rewardEngine.addPaymentMethod(
      req.userId, 
      stripePaymentMethodId, 
      accountHolderName
    );
    
    res.status(201).json({ paymentMethod });
  } catch (error) {
    console.error('Error adding payment method:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/payments/methods/:id
 * Remove payment method
 */
router.delete('/methods/:id', requireAuth, async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    await rewardEngine.removePaymentMethod(req.userId, paymentMethodId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ 
      error: 'Failed to remove payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/payments/methods/default
 * Set default payment method
 */
router.put('/methods/default', requireAuth, async (req, res) => {
  try {
    const { paymentMethodId } = setDefaultPaymentMethodSchema.parse(req.body);
    
    await rewardEngine.setDefaultPaymentMethod(req.userId, paymentMethodId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to set default payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/payments/methods/:id/validate
 * Validate payment method with micro-deposits
 */
router.post('/methods/:id/validate', requireAuth, async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    const { amounts } = validatePaymentMethodSchema.parse(req.body);
    
    const isValid = await rewardEngine.validatePaymentMethod(req.userId, paymentMethodId, amounts);
    
    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating payment method:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to validate payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/history
 * Get payout history for user
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const history = rewardEngine.getPayoutHistory(req.userId, limit, offset);
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching payout history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payout history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/audit
 * Get payment audit log for user
 */
router.get('/audit', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const auditLog = rewardEngine.getPaymentAuditLog(req.userId, limit, offset);
    
    res.json(auditLog);
  } catch (error) {
    console.error('Error fetching payment audit log:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment audit log',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/payments/tax-documents
 * Generate tax document for user
 */
router.post('/tax-documents', requireAuth, async (req, res) => {
  try {
    const { year } = generateTaxDocumentSchema.parse(req.body);
    
    const document = await rewardEngine.generateTaxDocument(req.userId, year);
    
    res.status(201).json({ document });
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
 * GET /api/payments/tax-documents
 * Get tax documents for user
 */
router.get('/tax-documents', requireAuth, async (req, res) => {
  try {
    const documents = rewardEngine.getUserTaxDocuments(req.userId);
    
    res.json({ documents });
  } catch (error) {
    console.error('Error fetching tax documents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tax documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin routes

/**
 * POST /api/payments/admin/retry-payout
 * Retry failed payout (admin only)
 */
router.post('/admin/retry-payout', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { transactionId } = retryPayoutSchema.parse(req.body);
    
    const result = await rewardEngine.retryFailedPayout(transactionId);
    
    res.json(result);
  } catch (error) {
    console.error('Error retrying payout:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to retry payout',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/admin/reconciliation
 * Get payment reconciliation data (admin only)
 */
router.get('/admin/reconciliation', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = reconciliationSchema.parse(req.query);
    
    const reconciliation = rewardEngine.getPaymentReconciliation(startDate, endDate);
    
    res.json(reconciliation);
  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request parameters',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch reconciliation data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/admin/statistics
 * Get payment statistics (admin only)
 */
router.get('/admin/statistics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const statistics = rewardEngine.getPaymentStatistics();
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/payments/admin/process-payouts
 * Manually trigger payout processing (admin only)
 */
router.post('/admin/process-payouts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await rewardEngine.processPayouts();
    
    res.json({
      message: 'Payout processing completed',
      processed: result.processed,
      totalAmount: result.totalAmount
    });
  } catch (error) {
    console.error('Error processing payouts:', error);
    res.status(500).json({ 
      error: 'Failed to process payouts',
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