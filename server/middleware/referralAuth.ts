/**
 * Referral Authentication Middleware
 * Enhanced authentication middleware that integrates with the referral system
 */

import { Request, Response, NextFunction } from 'express';
import { UserIntegrationService } from '../services/userIntegrationService.js';
import { ReferralRoleService } from '../services/referralRoleService.js';
import { getDatabase } from '../database/connection.js';

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
    permissions: {
      canCreateReferrals: boolean;
      canViewAnalytics: boolean;
      canManageRewards: boolean;
      isAdmin: boolean;
      maxReferralsPerDay: number;
      maxRewardAmount: number;
    };
  };
}

export class ReferralAuthMiddleware {
  private userIntegrationService = new UserIntegrationService();
  private roleService = new ReferralRoleService();
  private db = getDatabase();

  /**
   * Enhanced authentication middleware that includes referral permissions
   */
  requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // In a real implementation, verify JWT token
      // For now, extract user ID from token (mock implementation)
      const userId = await this.extractUserIdFromToken(token);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
      }

      // Get user data with referral permissions
      const user = await this.getUserWithPermissions(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Attach user data to request
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };

  /**
   * Middleware to require specific referral permissions
   */
  requirePermission = (permission: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required'
          });
        }

        const hasPermission = await this.userIntegrationService.validateUserAction(
          user.id,
          permission
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: `Permission denied: ${permission}`
          });
        }

        next();
      } catch (error) {
        console.error('Permission check error:', error);
        return res.status(403).json({
          success: false,
          error: 'Permission check failed'
        });
      }
    };
  };

  /**
   * Middleware to require admin role
   */
  requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.permissions.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      next();
    } catch (error) {
      console.error('Admin check error:', error);
      return res.status(403).json({
        success: false,
        error: 'Admin check failed'
      });
    }
  };

  /**
   * Middleware to validate referral ownership
   */
  requireReferralOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const referralId = req.params.id || req.params.referralId;

      if (!referralId) {
        return res.status(400).json({
          success: false,
          error: 'Referral ID required'
        });
      }

      // Check if user owns the referral or is admin
      const referralResult = await this.db.query(`
        SELECT referrer_id FROM referrals WHERE id = $1
      `, [referralId]);
      const referral = referralResult.rows[0];

      if (!referral) {
        return res.status(404).json({
          success: false,
          error: 'Referral not found'
        });
      }

      if (referral.referrer_id !== user.id && !user.permissions.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own referrals'
        });
      }

      next();
    } catch (error) {
      console.error('Referral ownership check error:', error);
      return res.status(403).json({
        success: false,
        error: 'Ownership check failed'
      });
    }
  };

  /**
   * Middleware to validate high-value referral permissions
   */
  requireHighValuePermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const rewardAmount = req.body.rewardAmount;

      if (rewardAmount && rewardAmount > user.permissions.maxRewardAmount) {
        return res.status(403).json({
          success: false,
          error: `Reward amount exceeds maximum allowed (${user.permissions.maxRewardAmount})`
        });
      }

      next();
    } catch (error) {
      console.error('High value permission check error:', error);
      return res.status(403).json({
        success: false,
        error: 'High value permission check failed'
      });
    }
  };

  /**
   * Middleware to check daily referral limits
   */
  checkDailyLimits = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      // Check daily referral count
      const todayReferralsResult = await this.db.query(`
        SELECT COUNT(*) as count 
        FROM referrals 
        WHERE referrer_id = $1 AND DATE(created_at) = CURRENT_DATE
      `, [user.id]);
      const todayReferrals = todayReferralsResult.rows[0];

      if (todayReferrals.count >= user.permissions.maxReferralsPerDay) {
        return res.status(429).json({
          success: false,
          error: `Daily referral limit reached (${user.permissions.maxReferralsPerDay})`
        });
      }

      next();
    } catch (error) {
      console.error('Daily limit check error:', error);
      return res.status(429).json({
        success: false,
        error: 'Daily limit check failed'
      });
    }
  };

  /**
   * Get user data with referral permissions and roles
   */
  private async getUserWithPermissions(userId: number) {
    try {
      // Check if account is locked
      if (this.roleService.isAccountLocked(userId)) {
        return null;
      }

      // Get basic user data
      const userResult = await this.db.query(`
        SELECT 
          id,
          email,
          first_name || ' ' || last_name as name,
          security_role,
          is_active
        FROM users 
        WHERE id = $1 AND is_active = true
      `, [userId]);
      const user = userResult.rows[0];

      if (!user) {
        return null;
      }

      // Get role-based permissions
      const rolePermissions = this.roleService.getUserRolePermissions(userId);
      const rateLimits = this.roleService.getRateLimitSettings(userId);

      // Convert role permissions to legacy format for compatibility
      const permissions = {
        canCreateReferrals: rolePermissions.create_referral,
        canViewAnalytics: rolePermissions.view_analytics,
        canManageRewards: rolePermissions.view_rewards,
        isAdmin: rolePermissions.manage_users || rolePermissions.view_all_referrals,
        maxReferralsPerDay: rateLimits.maxReferralsPerDay,
        maxRewardAmount: rateLimits.maxRewardAmount
      };

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: [user.security_role || 'user'],
        permissions
      };
    } catch (error) {
      console.error('Error getting user with permissions:', error);
      return null;
    }
  }

  /**
   * Extract user ID from token - integrate with main auth system
   */
  private async extractUserIdFromToken(token: string): Promise<number | null> {
    try {
      // First try mock tokens for development
      if (token.startsWith('mock-token-')) {
        const userId = parseInt(token.replace('mock-token-', ''));
        return isNaN(userId) ? null : userId;
      }

      // For real tokens, we need to validate against the main auth system
      // Import the session validation from the main auth system
      const sessions = this.getMainAuthSessions();
      const session = sessions.get(token);
      
      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Convert string user ID to number for referral system compatibility
      // Look up the user in the main users table to get the numeric ID
      const mainUser = this.getMainAuthUser(session.userId);
      if (!mainUser) {
        return null;
      }

      // Find corresponding user in referrals database
      const referralUserResult = await this.db.query(`
        SELECT id FROM users WHERE email = $1
      `, [mainUser.email]);
      const referralUser = referralUserResult.rows[0];

      return referralUser ? referralUser.id : null;
    } catch (error) {
      console.error('Token extraction error:', error);
      return null;
    }
  }

  /**
   * Get main auth sessions (temporary integration)
   */
  private getMainAuthSessions(): Map<string, { userId: string; expiresAt: Date }> {
    // This is a temporary solution - in production, you'd have a shared session store
    // For now, we'll create a simple integration
    try {
      // Access the sessions from the main auth module
      // This is a hack for development - in production, use a shared Redis store or database
      const authModule = require('../routes/auth.js');
      return authModule.sessions || new Map();
    } catch (error) {
      console.error('Failed to access main auth sessions:', error);
      return new Map();
    }
  }

  /**
   * Get main auth user data
   */
  private getMainAuthUser(userId: string): any {
    try {
      const authModule = require('../routes/auth.js');
      const users = authModule.users || new Map();
      
      // Find user by ID
      for (const [email, user] of users.entries()) {
        if (user.id === userId) {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to access main auth users:', error);
      return null;
    }
  }
}

// Export singleton instance
export const referralAuth = new ReferralAuthMiddleware();