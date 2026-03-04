import { Router, Request, Response } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import { requireAuth } from '../middleware/unifiedAuth';
import { requireSubscription, requirePlan, checkUsageLimit, requireFeature } from '../middleware/subscriptionMiddleware';
import { getDatabase } from '../database/connection';

const router = Router();

/**
 * Get all available plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    // Get all plans without filtering by user type
    const plans = await SubscriptionService.getPlans();
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
});

/**
 * Get current user's subscription
 */
router.get('/current', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId || req.recruiter?.companyId;
    
    let subscription;
    if (userId) {
      subscription = await SubscriptionService.getUserSubscription(userId);
    } else if (companyId) {
      subscription = await SubscriptionService.getCompanySubscription(companyId);
    }
    
    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription'
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

/**
 * Get usage statistics
 */
router.get('/usage', requireAuth, requireSubscription, async (req: Request, res: Response) => {
  try {
    const stats = await SubscriptionService.getUsageStats(
      req.subscription.id,
      req.subscriptionType!
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics'
    });
  }
});

/**
 * Check specific feature usage
 */
router.get('/usage/:featureKey', requireAuth, requireSubscription, async (req: Request, res: Response) => {
  try {
    const { featureKey } = req.params;
    
    const usageCheck = await SubscriptionService.checkUsage(
      req.subscription.id,
      req.subscriptionType!,
      featureKey,
      req.subscription.plan
    );
    
    res.json({
      success: true,
      data: usageCheck
    });
  } catch (error) {
    console.error('Check usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check usage'
    });
  }
});

/**
 * Upgrade/change subscription
 */
router.post('/change', requireAuth, async (req: Request, res: Response) => {
  try {
    const { planName, paymentId } = req.body;
    
    if (!planName) {
      return res.status(400).json({
        success: false,
        error: 'Plan name is required'
      });
    }
    
    const userId = req.user?.id;
    const companyId = req.user?.companyId || req.recruiter?.companyId;
    
    // Get current subscription
    let currentSub;
    let subscriptionType: 'user' | 'company';
    
    if (userId) {
      currentSub = await SubscriptionService.getUserSubscription(userId);
      subscriptionType = 'user';
    } else if (companyId) {
      currentSub = await SubscriptionService.getCompanySubscription(companyId);
      subscriptionType = 'company';
    } else {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!currentSub) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }
    
    const updatedSub = await SubscriptionService.changeSubscription(
      currentSub.id,
      subscriptionType,
      planName,
      paymentId
    );
    
    res.json({
      success: true,
      data: updatedSub,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Change subscription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change subscription'
    });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', requireAuth, requireSubscription, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    await SubscriptionService.cancelSubscription(
      req.subscription.id,
      req.subscriptionType!,
      reason
    );
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

// ============ Company-specific routes ============

/**
 * Get company subscription
 */
router.get('/company/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const subscription = await SubscriptionService.getCompanySubscription(companyId);
    
    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription'
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get company subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company subscription'
    });
  }
});

/**
 * Create company subscription
 */
router.post('/company', async (req: Request, res: Response) => {
  try {
    const { companyId, planId, billingCycle } = req.body;
    
    if (!companyId || !planId || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const db = await getDatabase();
    
    // Get plan details
    const planResult = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    if (!planResult.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }
    
    const plan = planResult.rows[0];
    const amount = billingCycle === 'yearly' && plan.price_yearly 
      ? plan.price_yearly 
      : plan.price_monthly;
    
    // If paid plan, initiate payment
    if (amount > 0) {
      const { PaymentService } = require('../services/payment/PaymentService');
      
      const paymentRequest = {
        planId: plan.id,
        planName: plan.name,
        amount,
        currency: 'INR',
        companyId,
        billingCycle,
        metadata: {
          subscriptionType: 'company',
          companyId
        }
      };
      
      const paymentResult = await PaymentService.initiatePayment(paymentRequest);
      
      if (!paymentResult.success) {
        return res.status(400).json(paymentResult);
      }
      
      return res.json({
        success: true,
        data: {
          subscription: null,
          paymentUrl: paymentResult.data?.paymentUrl,
          transactionId: paymentResult.data?.transactionId
        }
      });
    }
    
    // Free plan - create subscription directly
    const subscription = await SubscriptionService.createCompanySubscription(
      companyId,
      planId,
      billingCycle
    );
    
    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('Create company subscription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    });
  }
});

/**
 * Upgrade company subscription
 */
router.post('/company/:companyId/upgrade', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }
    
    const subscription = await SubscriptionService.upgradeCompanySubscription(companyId, planId);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Upgrade company subscription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upgrade subscription'
    });
  }
});

/**
 * Cancel company subscription
 */
router.post('/company/:companyId/cancel', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const subscription = await SubscriptionService.cancelCompanySubscription(companyId);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Cancel company subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * Get company usage
 */
router.get('/company/:companyId/usage', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    
    const subscription = await SubscriptionService.getCompanySubscription(companyId);
    if (!subscription) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const usage = await SubscriptionService.getUsageStats(subscription.id, 'company');
    
    res.json({
      success: true,
      data: Object.values(usage)
    });
  } catch (error) {
    console.error('Get company usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage'
    });
  }
});

// ============ User-specific routes ============

/**
 * Get user subscription
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const subscription = await SubscriptionService.getUserSubscription(userId);
    
    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription'
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user subscription'
    });
  }
});

/**
 * Create user subscription
 */
router.post('/user', async (req: Request, res: Response) => {
  try {
    const { userId, planId, billingCycle } = req.body;
    
    if (!userId || !planId || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const db = await getDatabase();
    
    // Get plan details
    const planResult = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    if (!planResult.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }
    
    const plan = planResult.rows[0];
    const amount = billingCycle === 'yearly' && plan.price_yearly 
      ? plan.price_yearly 
      : plan.price_monthly;
    
    // If paid plan, initiate payment
    if (amount > 0) {
      const { PaymentService } = require('../services/payment/PaymentService');
      
      const paymentRequest = {
        planId: plan.id,
        planName: plan.name,
        amount,
        currency: 'INR',
        userId,
        billingCycle,
        metadata: {
          subscriptionType: 'user',
          userId,
          userType: 'candidate'
        }
      };
      
      const paymentResult = await PaymentService.initiatePayment(paymentRequest);
      
      if (!paymentResult.success) {
        return res.status(400).json(paymentResult);
      }
      
      return res.json({
        success: true,
        data: {
          subscription: null,
          paymentUrl: paymentResult.data?.paymentUrl,
          transactionId: paymentResult.data?.transactionId
        }
      });
    }
    
    // Free plan - create subscription directly
    const subscription = await SubscriptionService.createUserSubscription(
      userId,
      planId,
      billingCycle
    );
    
    res.json({
      success: true,
      data: { subscription }
    });
  } catch (error) {
    console.error('Create user subscription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    });
  }
});

/**
 * Upgrade user subscription
 */
router.post('/user/:userId/upgrade', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }
    
    const subscription = await SubscriptionService.upgradeUserSubscription(userId, planId);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Upgrade user subscription error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upgrade subscription'
    });
  }
});

/**
 * Cancel user subscription
 */
router.post('/user/:userId/cancel', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const subscription = await SubscriptionService.cancelUserSubscription(userId);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Cancel user subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * Get user usage
 */
router.get('/user/:userId/usage', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const subscription = await SubscriptionService.getUserSubscription(userId);
    if (!subscription) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const usage = await SubscriptionService.getUsageStats(subscription.id, 'user');
    
    res.json({
      success: true,
      data: Object.values(usage)
    });
  } catch (error) {
    console.error('Get user usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage'
    });
  }
});

export default router;
