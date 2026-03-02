import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscriptionService';
import type { PlanName } from '@shared/subscription';

// Extend Express Request to include subscription data
declare global {
  namespace Express {
    interface Request {
      subscription?: any;
      subscriptionType?: 'user' | 'company';
    }
  }
}

/**
 * Middleware to check if user has active subscription
 */
export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const companyId = req.user?.companyId || req.recruiter?.companyId;
    
    if (!userId && !companyId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    let subscription;
    let subscriptionType: 'user' | 'company';
    
    if (userId) {
      subscription = await SubscriptionService.getUserSubscription(userId);
      subscriptionType = 'user';
    } else {
      subscription = await SubscriptionService.getCompanySubscription(companyId);
      subscriptionType = 'company';
    }
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'No active subscription found',
        code: 'NO_SUBSCRIPTION'
      });
    }
    
    // Attach to request
    req.subscription = subscription;
    req.subscriptionType = subscriptionType;
    
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify subscription'
    });
  }
};

/**
 * Middleware to check if user has specific plan or higher
 */
export const requirePlan = (...allowedPlans: PlanName[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.subscription) {
        return res.status(403).json({
          success: false,
          error: 'Subscription required',
          code: 'NO_SUBSCRIPTION'
        });
      }
      
      const currentPlan = req.subscription.plan?.name;
      
      if (!allowedPlans.includes(currentPlan)) {
        return res.status(403).json({
          success: false,
          error: `This feature requires ${allowedPlans.join(' or ')} plan`,
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlans: allowedPlans,
          currentPlan
        });
      }
      
      next();
    } catch (error) {
      console.error('Plan check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify plan'
      });
    }
  };
};

/**
 * Middleware to check feature usage limits
 */
export const checkUsageLimit = (featureKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.subscription || !req.subscriptionType) {
        return res.status(403).json({
          success: false,
          error: 'Subscription required',
          code: 'NO_SUBSCRIPTION'
        });
      }
      
      const usageCheck = await SubscriptionService.checkUsage(
        req.subscription.id,
        req.subscriptionType,
        featureKey,
        req.subscription.plan
      );
      
      if (!usageCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: `Usage limit reached for ${featureKey}`,
          code: 'USAGE_LIMIT_EXCEEDED',
          usage: {
            current: usageCheck.current,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining
          }
        });
      }
      
      // Increment usage after successful check
      await SubscriptionService.incrementUsage(
        req.subscription.id,
        req.subscriptionType,
        featureKey
      );
      
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check usage limit'
      });
    }
  };
};

/**
 * Middleware to check if feature is enabled in plan
 */
export const requireFeature = (featureKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.subscription) {
        return res.status(403).json({
          success: false,
          error: 'Subscription required',
          code: 'NO_SUBSCRIPTION'
        });
      }
      
      const hasFeature = req.subscription.plan?.features[featureKey];
      
      if (!hasFeature) {
        return res.status(403).json({
          success: false,
          error: `This feature is not available in your plan`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureKey,
          currentPlan: req.subscription.plan?.name
        });
      }
      
      next();
    } catch (error) {
      console.error('Feature check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify feature access'
      });
    }
  };
};
