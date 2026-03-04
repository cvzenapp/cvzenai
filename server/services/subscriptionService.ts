import { getDatabase } from '../database/connection';
import type {
  SubscriptionPlan,
  UserSubscription,
  CompanySubscription,
  SubscriptionUsage,
  UsageCheck,
  PlanName,
  SubscriptionStatus
} from '@shared/subscription';

export class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  static async getPlans(): Promise<SubscriptionPlan[]> {
    let db;
    try {
      db = await getDatabase();
      const query = 'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC';
      
      console.log('🔍 Executing subscription plans query:', { query });
      const result = await db.query(query);
      console.log('✅ Subscription plans result:', { rowCount: result.rows.length });
      
      return result.rows.map(this.mapPlanFromDb);
    } catch (error) {
      console.error('❌ Error fetching subscription plans:', error);
      throw error;
    }
    // Don't close the connection for local development - it's reused
  }

  /**
   * Get plan by name
   */
  static async getPlanByName(name: PlanName): Promise<SubscriptionPlan | null> {
    const db = await getDatabase();
    const result = await db.query(
      'SELECT * FROM subscription_plans WHERE name = $1 AND is_active = true',
      [name]
    );
    
    return result.rows[0] ? this.mapPlanFromDb(result.rows[0]) : null;
  }

  /**
   * Get user's active subscription
   */
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const db = await getDatabase();
    const result = await db.query(
      `SELECT us.*, sp.* 
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 
       AND us.status = 'active'
       AND us.current_period_end > NOW()
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      ...this.mapSubscriptionFromDb(row, 'user'),
      plan: this.mapPlanFromDb(row)
    } as UserSubscription;
  }

  /**
   * Get company's active subscription
   */
  static async getCompanySubscription(companyId: string): Promise<CompanySubscription | null> {
    const db = await getDatabase();
    const result = await db.query(
      `SELECT cs.*, sp.* 
       FROM company_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       WHERE cs.company_id = $1 
       AND cs.status = 'active'
       AND cs.current_period_end > NOW()
       ORDER BY cs.created_at DESC
       LIMIT 1`,
      [companyId]
    );
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    return {
      ...this.mapSubscriptionFromDb(row, 'company'),
      plan: this.mapPlanFromDb(row)
    } as CompanySubscription;
  }

  /**
   * Create free subscription for new user
   */
  static async createFreeUserSubscription(userId: string): Promise<UserSubscription> {
    const db = await getDatabase();
    
    const freePlan = await this.getPlanByName('free');
    if (!freePlan) throw new Error('Free plan not found');
    
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 100); // Essentially lifetime
    
    const result = await db.query(
      `INSERT INTO user_subscriptions 
       (user_id, plan_id, status, current_period_end)
       VALUES ($1, $2, 'active', $3)
       RETURNING *`,
      [userId, freePlan.id, periodEnd]
    );
    
    await this.logHistory(result.rows[0].id, 'user', 'created', null, freePlan.id);
    
    return {
      ...this.mapSubscriptionFromDb(result.rows[0], 'user'),
      plan: freePlan
    } as UserSubscription;
  }

  /**
   * Create company subscription
   */
  static async createCompanySubscription(
    companyId: string,
    planId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<CompanySubscription> {
    const db = await getDatabase();
    
    // Get plan
    const planResult = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    if (!planResult.rows[0]) throw new Error('Plan not found');
    const plan = this.mapPlanFromDb(planResult.rows[0]);
    
    // Calculate period end
    const periodEnd = new Date();
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }
    
    const result = await db.query(
      `INSERT INTO company_subscriptions 
       (company_id, plan_id, status, billing_cycle, current_period_end)
       VALUES ($1, $2, 'active', $3, $4)
       RETURNING *`,
      [companyId, planId, billingCycle, periodEnd]
    );
    
    await this.logHistory(result.rows[0].id, 'company', 'created', null, planId);
    
    return {
      ...this.mapSubscriptionFromDb(result.rows[0], 'company'),
      plan
    } as CompanySubscription;
  }

  /**
   * Upgrade company subscription
   */
  static async upgradeCompanySubscription(
    companyId: string,
    planId: string
  ): Promise<CompanySubscription> {
    const db = await getDatabase();
    
    // Get current subscription
    const currentSub = await this.getCompanySubscription(companyId);
    if (!currentSub) throw new Error('No active subscription found');
    
    // Get new plan
    const planResult = await db.query('SELECT * FROM subscription_plans WHERE id = $1', [planId]);
    if (!planResult.rows[0]) throw new Error('Plan not found');
    const newPlan = this.mapPlanFromDb(planResult.rows[0]);
    
    // Update subscription
    const result = await db.query(
      `UPDATE company_subscriptions 
       SET plan_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [planId, currentSub.id]
    );
    
    await this.logHistory(currentSub.id, 'company', 'upgraded', currentSub.planId, planId);
    
    return {
      ...this.mapSubscriptionFromDb(result.rows[0], 'company'),
      plan: newPlan
    } as CompanySubscription;
  }

  /**
   * Cancel company subscription
   */
  static async cancelCompanySubscription(companyId: string): Promise<CompanySubscription> {
    const db = await getDatabase();
    
    // Get current subscription
    const currentSub = await this.getCompanySubscription(companyId);
    if (!currentSub) throw new Error('No active subscription found');
    
    // Update subscription
    const result = await db.query(
      `UPDATE company_subscriptions 
       SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [currentSub.id]
    );
    
    await this.logHistory(currentSub.id, 'company', 'cancelled', null, null);
    
    return {
      ...this.mapSubscriptionFromDb(result.rows[0], 'company'),
      plan: currentSub.plan
    } as CompanySubscription;
  }

  /**
   * Upgrade/downgrade subscription
   */
  static async changeSubscription(
    subscriptionId: string,
    subscriptionType: 'user' | 'company',
    newPlanName: PlanName,
    paymentId?: string
  ): Promise<UserSubscription | CompanySubscription> {
    const db = await getDatabase();
    
    const newPlan = await this.getPlanByName(newPlanName);
    if (!newPlan) throw new Error('Plan not found');
    
    const table = subscriptionType === 'user' ? 'user_subscriptions' : 'company_subscriptions';
    
    // Get current subscription
    const current = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [subscriptionId]);
    if (!current.rows[0]) throw new Error('Subscription not found');
    
    const oldPlanId = current.rows[0].plan_id;
    
    // Calculate new period end
    const periodEnd = new Date();
    if (newPlan.name === 'free') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 100);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1); // Monthly by default
    }
    
    // Update subscription
    const result = await db.query(
      `UPDATE ${table} 
       SET plan_id = $1, 
           current_period_start = NOW(),
           current_period_end = $2,
           payment_id = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [newPlan.id, periodEnd, paymentId, subscriptionId]
    );
    
    // Log history
    const action = newPlan.priceMonthly > 0 ? 'upgraded' : 'downgraded';
    await this.logHistory(subscriptionId, subscriptionType, action, oldPlanId, newPlan.id);
    
    return {
      ...this.mapSubscriptionFromDb(result.rows[0], subscriptionType),
      plan: newPlan
    } as any;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    subscriptionType: 'user' | 'company',
    reason?: string
  ): Promise<void> {
    const db = await getDatabase();
    const table = subscriptionType === 'user' ? 'user_subscriptions' : 'company_subscriptions';
    
    await db.query(
      `UPDATE ${table} 
       SET status = 'cancelled',
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [subscriptionId]
    );
    
    await this.logHistory(subscriptionId, subscriptionType, 'cancelled', null, null, reason);
  }

  /**
   * Check feature usage and limits
   */
  static async checkUsage(
    subscriptionId: string,
    subscriptionType: 'user' | 'company',
    featureKey: string,
    plan: SubscriptionPlan
  ): Promise<UsageCheck> {
    const db = await getDatabase();
    
    // Get limit from plan
    const limit = plan.limits[featureKey] || 0;
    const unlimited = limit === -1;
    
    if (unlimited) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        remaining: -1,
        unlimited: true
      };
    }
    
    // Get current usage
    const result = await db.query(
      `SELECT usage_count FROM subscription_usage
       WHERE subscription_id = $1
       AND subscription_type = $2
       AND feature_key = $3
       AND period_start <= NOW()
       AND period_end > NOW()`,
      [subscriptionId, subscriptionType, featureKey]
    );
    
    const current = result.rows[0]?.usage_count || 0;
    const remaining = Math.max(0, limit - current);
    
    return {
      allowed: current < limit,
      current,
      limit,
      remaining,
      unlimited: false
    };
  }

  /**
   * Increment usage counter
   */
  static async incrementUsage(
    subscriptionId: string,
    subscriptionType: 'user' | 'company',
    featureKey: string,
    amount: number = 1
  ): Promise<void> {
    const db = await getDatabase();
    
    // Get current period
    const table = subscriptionType === 'user' ? 'user_subscriptions' : 'company_subscriptions';
    const subResult = await db.query(
      `SELECT current_period_start, current_period_end FROM ${table} WHERE id = $1`,
      [subscriptionId]
    );
    
    if (!subResult.rows[0]) throw new Error('Subscription not found');
    
    const { current_period_start, current_period_end } = subResult.rows[0];
    
    // Upsert usage
    await db.query(
      `INSERT INTO subscription_usage 
       (subscription_id, subscription_type, feature_key, usage_count, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (subscription_id, subscription_type, feature_key, period_start)
       DO UPDATE SET usage_count = subscription_usage.usage_count + $4, updated_at = NOW()`,
      [subscriptionId, subscriptionType, featureKey, amount, current_period_start, current_period_end]
    );
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats(
    subscriptionId: string,
    subscriptionType: 'user' | 'company'
  ): Promise<Record<string, SubscriptionUsage>> {
    const db = await getDatabase();
    
    const result = await db.query(
      `SELECT * FROM subscription_usage
       WHERE subscription_id = $1
       AND subscription_type = $2
       AND period_start <= NOW()
       AND period_end > NOW()`,
      [subscriptionId, subscriptionType]
    );
    
    const stats: Record<string, SubscriptionUsage> = {};
    result.rows.forEach(row => {
      stats[row.feature_key] = this.mapUsageFromDb(row);
    });
    
    return stats;
  }

  /**
   * Log subscription history
   */
  private static async logHistory(
    subscriptionId: string,
    subscriptionType: 'user' | 'company',
    action: string,
    oldPlanId: string | null,
    newPlanId: string | null,
    reason?: string
  ): Promise<void> {
    const db = await getDatabase();
    
    await db.query(
      `INSERT INTO subscription_history 
       (subscription_id, subscription_type, action, old_plan_id, new_plan_id, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [subscriptionId, subscriptionType, action, oldPlanId, newPlanId, reason]
    );
  }

  // Mapping helpers
  private static mapPlanFromDb(row: any): SubscriptionPlan {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      userType: row.user_type,
      priceMonthly: row.price_monthly,
      priceYearly: row.price_yearly,
      features: row.features,
      limits: row.limits,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static mapSubscriptionFromDb(row: any, type: 'user' | 'company'): any {
    return {
      id: row.id,
      [type === 'user' ? 'userId' : 'companyId']: row[type === 'user' ? 'user_id' : 'company_id'],
      planId: row.plan_id,
      status: row.status,
      billingCycle: row.billing_cycle,
      startedAt: row.started_at,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      cancelledAt: row.cancelled_at,
      expiresAt: row.expires_at,
      trialEndsAt: row.trial_ends_at,
      paymentMethod: row.payment_method,
      paymentId: row.payment_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static mapUsageFromDb(row: any): SubscriptionUsage {
    return {
      id: row.id,
      subscriptionId: row.subscription_id,
      subscriptionType: row.subscription_type,
      featureKey: row.feature_key,
      usageCount: row.usage_count,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
