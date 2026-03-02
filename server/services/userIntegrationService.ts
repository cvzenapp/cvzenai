/**
 * User Integration Service
 * Handles integration between referral system and existing user authentication/profile system
 */

import { getDatabase } from '../database/connection.js';
import { User } from '../../shared/auth.js';

export interface UserContact {
  id: string;
  name: string;
  email: string;
  source: 'linkedin' | 'github' | 'manual' | 'imported';
  lastInteraction?: string;
  relationship?: string;
  company?: string;
  position?: string;
}

export interface ReferralUserProfile extends User {
  referralStats: {
    totalReferrals: number;
    successfulReferrals: number;
    totalEarnings: number;
    conversionRate: number;
  };
  referralHistory: Array<{
    id: number;
    refereeName: string;
    positionTitle: string;
    companyName: string;
    status: string;
    createdAt: string;
    rewardAmount: number;
  }>;
  contactSuggestions: UserContact[];
}

export interface UserPermissions {
  canCreateReferrals: boolean;
  canViewAnalytics: boolean;
  canManageRewards: boolean;
  isAdmin: boolean;
  maxReferralsPerDay: number;
  maxRewardAmount: number;
}

export class UserIntegrationService {
  private db = getDatabase();

  /**
   * Get enhanced user profile with referral data
   */
  async getUserProfileWithReferrals(userId: number): Promise<ReferralUserProfile> {
    // Get base user data
    const userResult = await this.db.query(`
      SELECT 
        id,
        email,
        first_name || ' ' || last_name as name,
        avatar_url as avatar,
        phone,
        location,
        bio,
        linkedin_url,
        github_url,
        portfolio_url as website,
        email_verified as emailVerified,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users 
      WHERE id = $1
    `, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    // Get referral statistics
    const referralStatsResult = await this.db.query(`
      SELECT 
        COUNT(*) as totalReferrals,
        COUNT(CASE WHEN status = 'hired' THEN 1 END) as successfulReferrals,
        COALESCE(SUM(CASE WHEN status = 'hired' THEN reward_amount ELSE 0 END), 0) as totalEarnings
      FROM referrals 
      WHERE referrer_id = $1
    `, [userId]);
    const referralStats = referralStatsResult.rows[0];

    const conversionRate = referralStats.totalReferrals > 0 
      ? (referralStats.successfulReferrals / referralStats.totalReferrals) * 100 
      : 0;

    // Get recent referral history
    const referralHistoryResult = await this.db.query(`
      SELECT 
        id,
        referee_name as refereeName,
        position_title as positionTitle,
        company_name as companyName,
        status,
        reward_amount as rewardAmount,
        created_at as createdAt
      FROM referrals 
      WHERE referrer_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);
    const referralHistory = referralHistoryResult.rows;

    // Get contact suggestions
    const contactSuggestions = await this.getContactSuggestions(userId);

    return {
      ...user,
      profile: {
        bio: user.bio,
        location: user.location,
        website: user.website,
        linkedin: user.linkedin_url,
        github: user.github_url
      },
      referralStats: {
        totalReferrals: referralStats.totalReferrals,
        successfulReferrals: referralStats.successfulReferrals,
        totalEarnings: referralStats.totalEarnings,
        conversionRate
      },
      referralHistory,
      contactSuggestions
    };
  }

  /**
   * Get contact suggestions for referrals
   */
  async getContactSuggestions(userId: number): Promise<UserContact[]> {
    const suggestions: UserContact[] = [];

    // Get contacts from user's LinkedIn connections (if integrated)
    const linkedinContacts = await this.getLinkedInContacts(userId);
    suggestions.push(...linkedinContacts);

    // Get contacts from GitHub collaborators (if integrated)
    const githubContacts = await this.getGitHubContacts(userId);
    suggestions.push(...githubContacts);

    // Get manually added contacts
    const manualContacts = await this.getManualContacts(userId);
    suggestions.push(...manualContacts);

    // Filter out already referred contacts
    const alreadyReferredResult = await this.db.query(`
      SELECT DISTINCT referee_email 
      FROM referrals 
      WHERE referrer_id = $1 AND status NOT IN ('rejected', 'expired', 'declined')
    `, [userId]);
    const alreadyReferred = alreadyReferredResult.rows.map((row: any) => row.referee_email);

    return suggestions.filter(contact => !alreadyReferred.includes(contact.email));
  }

  /**
   * Get user permissions for referral system
   */
  async getUserPermissions(userId: number): Promise<UserPermissions> {
    // Get user role and settings
    const userResult = await this.db.query(`
      SELECT 
        email,
        created_at,
        is_active
      FROM users 
      WHERE id = $1
    `, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is admin (simplified - could be more sophisticated)
    const isAdmin = await this.isUserAdmin(userId);

    // Get user's referral activity to determine limits
    const todayReferralsResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE referrer_id = $1 AND DATE(created_at) = CURRENT_DATE
    `, [userId]);
    const todayReferrals = todayReferralsResult.rows[0];

    // Determine permissions based on user status and activity
    const basePermissions: UserPermissions = {
      canCreateReferrals: user.is_active === 1,
      canViewAnalytics: true,
      canManageRewards: true,
      isAdmin,
      maxReferralsPerDay: isAdmin ? 50 : 10,
      maxRewardAmount: isAdmin ? 1000 : 100
    };

    // Adjust permissions based on user behavior
    if (todayReferrals.count >= basePermissions.maxReferralsPerDay) {
      basePermissions.canCreateReferrals = false;
    }

    return basePermissions;
  }

  /**
   * Add referral history to user profile
   */
  async addReferralToUserHistory(userId: number, referralId: number): Promise<void> {
    await this.db.query(`
      INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description)
      VALUES ($1, 'refer', 'referral', $2, 'Created a new referral')
    `, [userId, referralId]);
  }

  async updateUserReferralProfile(userId: number, profileData: {
    preferredIndustries?: string[];
    referralGoals?: {
      monthlyTarget: number;
      yearlyTarget: number;
    };
    contactPreferences?: {
      allowLinkedInSync: boolean;
      allowGitHubSync: boolean;
      emailNotifications: boolean;
    };
  }): Promise<void> {
    // Store referral-specific profile data
    const existingProfileResult = await this.db.query(`
      SELECT metadata FROM users WHERE id = $1
    `, [userId]);
    const existingProfile = existingProfileResult.rows[0];

    const currentMetadata = existingProfile?.metadata ? JSON.parse(existingProfile.metadata) : {};
    const updatedMetadata = {
      ...currentMetadata,
      referralProfile: {
        ...currentMetadata.referralProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      }
    };

    await this.db.query(`
      UPDATE users 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [userId]);

    // For now, we'll store in a separate table since the schema doesn't have metadata column
    // In a real implementation, you'd add a metadata JSON column to users table
    await this.logUserActivity(userId, 'profile_update', 'Updated referral profile preferences');
  }

  async linkRefereeAccount(referralToken: string, newUserId: number): Promise<void> {
    const client = this.db;
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE referrals 
        SET referee_user_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE referral_token = $2
      `, [newUserId, referralToken]);

      const referralResult = await client.query(`
        SELECT referrer_id, referee_name, position_title, company_name
        FROM referrals 
        WHERE referral_token = $1
      `, [referralToken]);
      const referral = referralResult.rows[0];

      if (referral) {
        await this.logUserActivity(
          referral.referrer_id, 
          'referee_joined', 
          `${referral.referee_name} joined through your referral for ${referral.position_title} at ${referral.company_name}`
        );

        await this.logUserActivity(
          newUserId, 
          'joined_via_referral', 
          `Joined through referral for ${referral.position_title} at ${referral.company_name}`
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  async getUserReferralRoles(userId: number): Promise<string[]> {
    const roles: string[] = ['referrer']; // Base role for all users

    // Check if user is a referee (has been referred)
    const isRefereeResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE referee_user_id = $1
    `, [userId]);
    const isReferee = isRefereeResult.rows[0];

    if (isReferee.count > 0) {
      roles.push('referee');
    }

    // Check if user is admin
    if (await this.isUserAdmin(userId)) {
      roles.push('admin');
    }

    // Check if user is a top referrer
    const referralCountResult = await this.db.query(`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE referrer_id = $1 AND status = 'hired'
    `, [userId]);
    const referralCount = referralCountResult.rows[0];

    if (referralCount.count >= 5) {
      roles.push('top_referrer');
    }

    return roles;
  }

  async validateUserAction(userId: number, action: string, targetData?: any): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    switch (action) {
      case 'create_referral':
        return permissions.canCreateReferrals;
      case 'view_analytics':
        return permissions.canViewAnalytics;
      case 'manage_rewards':
        return permissions.canManageRewards;
      case 'admin_action':
        return permissions.isAdmin;
      case 'high_value_referral':
        if (targetData?.rewardAmount > permissions.maxRewardAmount) {
          return permissions.isAdmin;
        }
        return permissions.canCreateReferrals;
      default:
        return false;
    }
  }

  private async getLinkedInContacts(userId: number): Promise<UserContact[]> {
    const userResult = await this.db.query(`
      SELECT linkedin_url FROM users WHERE id = $1
    `, [userId]);
    const user = userResult.rows[0];

    if (!user?.linkedin_url) {
      return [];
    }

    // Mock LinkedIn contacts
    return [
      {
        id: 'linkedin_1',
        name: 'John Smith',
        email: 'john.smith@example.com',
        source: 'linkedin',
        relationship: 'colleague',
        company: 'Tech Corp',
        position: 'Software Engineer'
      }
    ];
  }

  private async getGitHubContacts(userId: number): Promise<UserContact[]> {
    const userResult = await this.db.query(`
      SELECT github_url FROM users WHERE id = $1
    `, [userId]);
    const user = userResult.rows[0];

    if (!user?.github_url) {
      return [];
    }

    // Mock GitHub collaborators
    return [
      {
        id: 'github_1',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        source: 'github',
        relationship: 'collaborator',
        lastInteraction: '2024-01-15'
      }
    ];
  }

  private async getManualContacts(userId: number): Promise<UserContact[]> {
    // Get manually added contacts from a contacts table (if it exists)
    // For now, return empty array as the schema doesn't include a contacts table
    return [];
  }

  private async isUserAdmin(userId: number): Promise<boolean> {
    const userResult = await this.db.query(`
      SELECT email FROM users WHERE id = $1
    `, [userId]);
    const user = userResult.rows[0];

    // For demo purposes, consider users with admin emails as admins
    const adminEmails = ['admin@cvzen.com', 'support@cvzen.com'];
    return adminEmails.includes(user?.email);
  }

  private async logUserActivity(userId: number, activityType: string, description: string): Promise<void> {
    await this.db.query(`
      INSERT INTO activities (user_id, activity_type, description, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [userId, activityType, description]);
  }
}