import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/unifiedAuth';
import { PaymentService } from '../services/payment/PaymentService';
import { SubscriptionService } from '../services/subscriptionService';
import { PhonePeAdapter } from '../services/payment/PhonePeAdapter';
import type { PaymentInitiateRequest } from '@shared/payment';

const router = Router();

/**
 * POST /api/payment/initiate
 * Initiate payment for a subscription plan
 */
router.post('/initiate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!planId) {
      return res.status(400).json({ success: false, error: 'Plan ID is required' });
    }

    // Get plan details
    const plans = await SubscriptionService.getPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }

    if (plan.priceMonthly === 0) {
      return res.status(400).json({ success: false, error: 'Cannot initiate payment for free plan' });
    }

    // Prepare payment request
    const paymentRequest: PaymentInitiateRequest = {
      planId: plan.id,
      planName: plan.name,
      amount: billingCycle === 'yearly' && plan.priceYearly 
        ? plan.priceYearly 
        : plan.priceMonthly,
      currency: 'INR',
      userId,
      userEmail: req.user?.email || '',
      userPhone: req.user?.phone,
      billingCycle
    };

    // Initiate payment
    const result = await PaymentService.initiatePayment(paymentRequest);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Payment initiation failed' 
    });
  }
});

/**
 * POST /api/payment/callback
 * PhonePe payment callback (webhook)
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { response: responseBase64 } = req.body;
    const xVerify = req.headers['x-verify'] as string;

    if (!responseBase64 || !xVerify) {
      return res.status(400).json({ success: false, error: 'Invalid callback data' });
    }

    // Verify signature
    const phonePe = new PhonePeAdapter();
    const isValid = phonePe.verifyCallbackSignature(xVerify, responseBase64);

    if (!isValid) {
      console.error('Invalid callback signature');
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    // Decode response
    const responseData = JSON.parse(Buffer.from(responseBase64, 'base64').toString());
    const transactionId = responseData.data?.merchantTransactionId;

    if (!transactionId) {
      return res.status(400).json({ success: false, error: 'Transaction ID not found' });
    }

    // Verify payment
    const verifyResult = await PaymentService.verifyPayment({
      transactionId,
      orderId: transactionId,
      gateway: 'phonepe',
      gatewayResponse: responseData
    });

    res.json({ success: true, verified: verifyResult.verified });
  } catch (error: any) {
    console.error('Payment callback error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Callback processing failed' 
    });
  }
});

/**
 * GET /api/payment/verify/:transactionId
 * Verify payment status
 */
router.get('/verify/:transactionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get transaction
    const transaction = await PaymentService.getTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    // Verify with gateway
    const result = await PaymentService.verifyPayment({
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      gateway: transaction.gateway,
      gatewayResponse: transaction.gatewayResponse
    });

    res.json(result);
  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Payment verification failed' 
    });
  }
});

/**
 * GET /api/payment/history
 * Get user's payment history
 */
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const transactions = await PaymentService.getUserTransactions(userId);

    res.json({ success: true, transactions });
  } catch (error: any) {
    console.error('Payment history error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch payment history' 
    });
  }
});

export default router;
