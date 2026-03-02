/**
 * Referral Role-Based Access Control Service
 * Manages user roles and permissions for referral system admin functions
 */

import { getDatabase } from '../database/connection.js';

export interface UserRole {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export interface UserPermission {
  userId: number;
  role: string;
  permissions: string[];
  grantedBy: number;
  grantedAt: string;
  expiresAt?: string;
}

export interface RolePermissions {
  // Basic user permissions
  create_referral: boolean;
  view_own_referrals: boolean;
  update_own_referrals: boolean;
  
  // Analytics permissions
  view_analytics: boolean;
  view_detailed_analytics: boolean;
  export_analytics: boolean;
  
  // Reward permissions
  view_rewards: boolean;
  request_payout: boolean;
  
  // Admin permissions
  view_all_referrals: boolean;
  update_any_referral: boolean;
  delete_referrals: boolean;
  manage_users: boolean;
  view_audit_logs: boolean;
  manage_security_settings: boolean;
  
  // High-value permissions
  create_high_value_referral: boolean;
  approve_high_value_referrals: boolean;
  override_rate_limits: boolean;
  
  // Security permissions
  investigate_fraud: boolean;
  manage_security_incidents: boolean;
  access_sensitive_data: boolean;
}

export class ReferralRoleService {
  private db = getDatabase();

  // Default role definitions
  private readonly DEFAULT_ROLES: Record<string, Partial<RolePermissions>> = {
    user: {
      create_referral: true,
      view_own_referrals: true,
      update_own_referrals: true,
      view_analytics: true,
      view_rewards: true,
      request_payout: true
    },
    premium_user: {
      create_referral: true,
      view_own_referrals: true,
      update_own_referrals: true,
      view_analytics: true,
      view_detailed_analytics: true,
      export_analytics: true,
      view_rewards: true,
      request_payout: true,
      create_high_value_referral: true
    },
    moderator: {
      create_referral: true,
      view_own_referrals: true,
      update_own_referrals: true,
      view_analytics: true,
      view_detailed_analytics: true,
      export_analytics: true,
      view_rewards: true,
      request_payout: true,
      view_all_referrals: true,
      update_any_referral: true,
      view_audit_logs: true,
      approve_high_value_referrals: true
    },
    admin: {
      create_referral: true,
      view_own_referrals: true,
      update_own_referrals: true,
      view_analytics: true,
      view_detailed_analytics: true,
      export_analytics: true,
      view_rewards: true,
      request_payout: true,
      view_all_referrals: true,
      update_any_referral: true,
      delete_referrals: true,
      manage_users: true,
      view_audit_logs: true,
      manage_security_settings: true,
      create_high_value_referral: true,
      approve_high_value_referrals: true,
      override_rate_limits: true
    },
    security_admin: {
      create_referral: true,
      view_own_referrals: true,
      update_own_referrals: true,
      view_analytics: true,
      view_detailed_analytics: true,
      export_analytics: true,
      view_rewards: true,
      request_payout: true,
      view_all_referrals: true,
      update_any_referral: true,
      delete_referrals: true,
      manage_users: true,
      view_audit_logs: true,
      manage_security_settings: true,
      create_high_value_referral: true,
      approve_high_value_referrals: true,
      override_rate_limits: true,
      investigate_fraud: true,
      manage_security_incidents: true,
      access_sensitive_data: true
    }
  };

  /**
   * Get user's role and permissions
   */
  getUserRolePermissions(userId: number): RolePermissions {
    try {
      // Get user's role from database
      const userRole = this.db.prepare(`
        SELECT security_role FROM users WHERE id = ?
      `).get(userId) as { security_role: string } | undefined;

      const role = userRole?.security_role || 'user';

      // Get base permissions for role
      const basePermissions = this.DEFAULT_ROLES[role] || this.DEFAULT_ROLES.user;

      // Get any additional permissions granted to user
      const additionalPermissions = this.db.prepare(`
        SELECT permissions FROM user_role_permissions 
        WHERE user_id = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
      `).all(userId) as { permissions: string }[];

      // Merge permissions
      const allPermissions: Partial<RolePermissions> = { ...basePermissions };

      additionalPermissions.forEach(perm => {
        try {
          const permissions = JSON.parse(perm.permissions);
          Object.assign(allPermissions, permissions);
        } catch (error) {
          console.error('Error parsing additional permissions:', error);
        }
      });

      // Convert to full RolePermissions object with defaults
      return this.normalizePermissions(allPermissions);
    } catch (error) {
      console.error('Error getting user role permissions:', error);
      return this.normalizePermissions(this.DEFAULT_ROLES.user);
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userId: number, permission: keyof RolePermissions): boolean {
    const permissions = this.getUserRolePermissions(userId);
    return permissions[permission] === true;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userId: number, permissions: (keyof RolePermissions)[]): boolean {
    const userPermissions = this.getUserRolePermissions(userId);
    return permissions.some(permission => userPermissions[permission] === true);
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(userId: number, permissions: (keyof RolePermissions)[]): boolean {
    const userPermissions = this.getUserRolePermissions(userId);
    return permissions.every(permission => userPermissions[permission] === true);
  }

  /**
   * Grant additional permissions to user
   */
  grantPermissions(
    userId: number, 
    permissions: Partial<RolePermissions>, 
    grantedBy: number,
    expiresAt?: Date
  ): void {
    try {
      const insertStmt = this.db.prepare(`
        INSERT INTO user_role_permissions (user_id, permissions, granted_by, expires_at)
        VALUES (?, ?, ?, ?)
      `);

      insertStmt.run(
        userId,
        JSON.stringify(permissions),
        grantedBy,
        expiresAt?.toISOString() || null
      );

      // Log the permission grant
      this.logPermissionChange(userId, 'grant_permissions', grantedBy, permissions);
    } catch (error) {
      console.error('Error granting permissions:', error);
      throw new Error('Failed to grant permissions');
    }
  }

  /**
   * Revoke permissions from user
   */
  revokePermissions(userId: number, revokedBy: number): void {
    try {
      const deleteStmt = this.db.prepare(`
        DELETE FROM user_role_permissions WHERE user_id = ?
      `);

      deleteStmt.run(userId);

      // Log the permission revocation
      this.logPermissionChange(userId, 'revoke_permissions', revokedBy);
    } catch (error) {
      console.error('Error revoking permissions:', error);
      throw new Error('Failed to revoke permissions');
    }
  }

  /**
   * Update user's base role
   */
  updateUserRole(userId: number, newRole: string, updatedBy: number): void {
    try {
      // Validate role exists
      if (!this.DEFAULT_ROLES[newRole]) {
        throw new Error(`Invalid role: ${newRole}`);
      }

      const updateStmt = this.db.prepare(`
        UPDATE users SET security_role = ? WHERE id = ?
      `);

      updateStmt.run(newRole, userId);

      // Log the role change
      this.logPermissionChange(userId, 'update_role', updatedBy, { newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Get all users with specific role
   */
  getUsersByRole(role: string): Array<{ id: number; email: string; name: string }> {
    try {
      return this.db.prepare(`
        SELECT id, email, first_name || ' ' || last_name as name
        FROM users 
        WHERE security_role = ? AND is_active = 1
      `).all(role) as Array<{ id: number; email: string; name: string }>;
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  /**
   * Get permission audit trail for user
   */
  getPermissionAuditTrail(userId: number): Array<{
    action: string;
    changedBy: number;
    changedByName: string;
    permissions?: any;
    createdAt: string;
  }> {
    try {
      return this.db.prepare(`
        SELECT 
          rpl.action,
          rpl.changed_by,
          u.first_name || ' ' || u.last_name as changed_by_name,
          rpl.permissions,
          rpl.created_at
        FROM role_permission_logs rpl
        LEFT JOIN users u ON rpl.changed_by = u.id
        WHERE rpl.user_id = ?
        ORDER BY rpl.created_at DESC
        LIMIT 50
      `).all(userId) as Array<{
        action: string;
        changedBy: number;
        changedByName: string;
        permissions?: string;
        createdAt: string;
      }>;
    } catch (error) {
      console.error('Error getting permission audit trail:', error);
      return [];
    }
  }

  /**
   * Get rate limit settings for user based on role
   */
  getRateLimitSettings(userId: number): {
    maxReferralsPerHour: number;
    maxReferralsPerDay: number;
    maxRewardAmount: number;
  } {
    try {
      const userSettings = this.db.prepare(`
        SELECT 
          max_referrals_per_hour,
          max_referrals_per_day,
          max_reward_amount,
          security_role
        FROM users 
        WHERE id = ?
      `).get(userId) as {
        max_referrals_per_hour: number;
        max_referrals_per_day: number;
        max_reward_amount: number;
        security_role: string;
      } | undefined;

      if (!userSettings) {
        return this.getDefaultRateLimits('user');
      }

      // Use custom settings if set, otherwise use role defaults
      return {
        maxReferralsPerHour: userSettings.max_referrals_per_hour || this.getDefaultRateLimits(userSettings.security_role).maxReferralsPerHour,
        maxReferralsPerDay: userSettings.max_referrals_per_day || this.getDefaultRateLimits(userSettings.security_role).maxReferralsPerDay,
        maxRewardAmount: userSettings.max_reward_amount || this.getDefaultRateLimits(userSettings.security_role).maxRewardAmount
      };
    } catch (error) {
      console.error('Error getting rate limit settings:', error);
      return this.getDefaultRateLimits('user');
    }
  }

  /**
   * Check if user account is locked
   */
  isAccountLocked(userId: number): boolean {
    try {
      const user = this.db.prepare(`
        SELECT account_locked, locked_until FROM users WHERE id = ?
      `).get(userId) as { account_locked: boolean; locked_until: string | null } | undefined;

      if (!user) return false;

      if (!user.account_locked) return false;

      // Check if lock has expired
      if (user.locked_until && new Date(user.locked_until) < new Date()) {
        // Unlock account
        this.db.prepare(`
          UPDATE users SET account_locked = FALSE, locked_until = NULL WHERE id = ?
        `).run(userId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  }

  /**
   * Lock user account
   */
  lockAccount(userId: number, lockedBy: number, duration?: number): void {
    try {
      const lockedUntil = duration 
        ? new Date(Date.now() + duration * 1000).toISOString()
        : null;

      this.db.prepare(`
        UPDATE users 
        SET account_locked = TRUE, locked_until = ?
        WHERE id = ?
      `).run(lockedUntil, userId);

      // Log the account lock
      this.logPermissionChange(userId, 'lock_account', lockedBy, { duration, lockedUntil });
    } catch (error) {
      console.error('Error locking account:', error);
      throw new Error('Failed to lock account');
    }
  }

  /**
   * Unlock user account
   */
  unlockAccount(userId: number, unlockedBy: number): void {
    try {
      this.db.prepare(`
        UPDATE users 
        SET account_locked = FALSE, locked_until = NULL, failed_attempts = 0
        WHERE id = ?
      `).run(userId);

      // Log the account unlock
      this.logPermissionChange(userId, 'unlock_account', unlockedBy);
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw new Error('Failed to unlock account');
    }
  }

  /**
   * Normalize permissions object with defaults
   */
  private normalizePermissions(permissions: Partial<RolePermissions>): RolePermissions {
    return {
      create_referral: permissions.create_referral || false,
      view_own_referrals: permissions.view_own_referrals || false,
      update_own_referrals: permissions.update_own_referrals || false,
      view_analytics: permissions.view_analytics || false,
      view_detailed_analytics: permissions.view_detailed_analytics || false,
      export_analytics: permissions.export_analytics || false,
      view_rewards: permissions.view_rewards || false,
      request_payout: permissions.request_payout || false,
      view_all_referrals: permissions.view_all_referrals || false,
      update_any_referral: permissions.update_any_referral || false,
      delete_referrals: permissions.delete_referrals || false,
      manage_users: permissions.manage_users || false,
      view_audit_logs: permissions.view_audit_logs || false,
      manage_security_settings: permissions.manage_security_settings || false,
      create_high_value_referral: permissions.create_high_value_referral || false,
      approve_high_value_referrals: permissions.approve_high_value_referrals || false,
      override_rate_limits: permissions.override_rate_limits || false,
      investigate_fraud: permissions.investigate_fraud || false,
      manage_security_incidents: permissions.manage_security_incidents || false,
      access_sensitive_data: permissions.access_sensitive_data || false
    };
  }

  /**
   * Get default rate limits for role
   */
  private getDefaultRateLimits(role: string): {
    maxReferralsPerHour: number;
    maxReferralsPerDay: number;
    maxRewardAmount: number;
  } {
    const limits = {
      user: { maxReferralsPerHour: 5, maxReferralsPerDay: 20, maxRewardAmount: 100 },
      premium_user: { maxReferralsPerHour: 10, maxReferralsPerDay: 50, maxRewardAmount: 500 },
      moderator: { maxReferralsPerHour: 20, maxReferralsPerDay: 100, maxRewardAmount: 1000 },
      admin: { maxReferralsPerHour: 50, maxReferralsPerDay: 200, maxRewardAmount: 5000 },
      security_admin: { maxReferralsPerHour: 100, maxReferralsPerDay: 500, maxRewardAmount: 10000 }
    };

    return limits[role as keyof typeof limits] || limits.user;
  }

  /**
   * Log permission changes
   */
  private logPermissionChange(
    userId: number, 
    action: string, 
    changedBy: number, 
    permissions?: any
  ): void {
    try {
      this.db.prepare(`
        INSERT INTO role_permission_logs (user_id, action, changed_by, permissions)
        VALUES (?, ?, ?, ?)
      `).run(
        userId,
        action,
        changedBy,
        permissions ? JSON.stringify(permissions) : null
      );
    } catch (error) {
      console.error('Error logging permission change:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }
}