import { Router } from 'express';
import { requireRecruiterAuth } from '../middleware/recruiterAuth';
import { requireAuth } from '../middleware/unifiedAuth';
import PaymentHistoryService from '../services/paymentHistoryService';
import { SubscriptionService } from '../services/subscriptionService';

const router = Router();

/**
 * Get payment history for recruiter's company
 */
router.get('/company/:companyId', requireRecruiterAuth, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Verify recruiter has access to this company
    if (req.recruiter?.companyId !== parseInt(companyId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const payments = await PaymentHistoryService.getCompanyPaymentHistory(companyId);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

/**
 * Get invoices for recruiter's company
 */
router.get('/company/:companyId/invoices', requireRecruiterAuth, async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Verify recruiter has access to this company
    if (req.recruiter?.companyId !== parseInt(companyId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const invoices = await PaymentHistoryService.getCompanyInvoices(companyId);
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

/**
 * Get payment summary for a subscription
 */
router.get('/subscription/:subscriptionId/summary', requireRecruiterAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Get subscription to verify access
    const subscription = await SubscriptionService.getCompanySubscription(
      req.recruiter!.companyId.toString()
    );
    
    if (!subscription || subscription.id !== subscriptionId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const summary = await PaymentHistoryService.getPaymentSummary(subscriptionId, 'company');
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment summary'
    });
  }
});

/**
 * Get subscription details with expiry info
 */
router.get('/subscription/:subscriptionId/details', requireRecruiterAuth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Get subscription to verify access
    const subscription = await SubscriptionService.getCompanySubscription(
      req.recruiter!.companyId.toString()
    );
    
    if (!subscription || subscription.id !== subscriptionId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const details = await PaymentHistoryService.getSubscriptionDetails(subscriptionId, 'company');
    
    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details'
    });
  }
});

/**
 * Get invoice by ID
 */
router.get('/invoice/:invoiceId', requireRecruiterAuth, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await PaymentHistoryService.getInvoiceById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Verify access through subscription
    const subscription = await SubscriptionService.getCompanySubscription(
      req.recruiter!.companyId.toString()
    );
    
    if (!subscription || subscription.id !== invoice.subscriptionId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
});

/**
 * Download invoice PDF (placeholder - implement PDF generation)
 */
router.get('/invoice/:invoiceId/download', requireRecruiterAuth, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await PaymentHistoryService.getInvoiceById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    // Verify access
    const subscription = await SubscriptionService.getCompanySubscription(
      req.recruiter!.companyId.toString()
    );
    
    if (!subscription || subscription.id !== invoice.subscriptionId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // TODO: Implement PDF generation
    // For now, return invoice data as JSON
    res.json({
      success: true,
      data: invoice,
      message: 'PDF generation not yet implemented'
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download invoice'
    });
  }
});

// ============ User payment history routes ============

/**
 * Get payment history for user
 */
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user has access
    if (req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const payments = await PaymentHistoryService.getUserPaymentHistory(userId);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

/**
 * Get invoices for user
 */
router.get('/user/:userId/invoices', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user has access
    if (req.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const invoices = await PaymentHistoryService.getUserInvoices(userId);
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

export default router;
