/**
 * Referral Service
 * Core business logic for the referrals system
 */

import { getDatabase } from '../database/connection.js';
import { 
  Referral, 
  ReferralStatus, 
  CreateReferralRequest, 
  UpdateReferralRequest,
  ReferralFilters,
  ReferralStats,
  REFERRAL_CONSTANTS,
  isValidStatusTransition,
  generateReferralToken
} from '../../shared/referrals.js';
import { UserIntegrationService } from './userIntegrationService.js';

export class ReferralService {
  private db = getDatabase();
  private userIntegrationService = new UserIntegrationService();

  /**
   * Create a new referral
   */
  async createReferral(referrerId: number, referralData: CreateReferralRequest): Promise<Referral> {
    console.log('🔧 DEBUG: Starting referral creation for user:', referrerId);
    
    try {
      // Validate user permissions
      console.log('🔧 DEBUG: Validating user permissions...');
      const canCreate = await this.userIntegrationService.validateUserAction(referrerId, 'create_referral');
      if (!canCreate) {
        throw new Error('User does not have permission to create referrals');
      }
      console.log('🔧 DEBUG: User permissions validated successfully');
    } catch (error) {
      console.error('🔧 DEBUG: Error in user permission validation:', error);
      throw error;
    }

    // Validate high-value referral permissions
    if (referralData.rewardAmount && referralData.rewardAmount > REFERRAL_CONSTANTS.DEFAULT_REWARD_AMOUNT) {
      const canCreateHighValue = await this.userIntegrationService.validateUserAction(
        referrerId, 
        'high_value_referral', 
        { rewardAmount: referralData.rewardAmount }
      );
      if (!canCreateHighValue) {
        throw new Error('User does not have permission to create high-value referrals');
      }
    }
    // Validate input
    if (!referralData.refereeEmail || !referralData.refereeName || !referralData.positionTitle || !referralData.companyName) {
      throw new Error('Missing required referral data');
    }

    // Check for duplicate referrals (same person, same position, same company, active status)
    const existingReferral = this.db.prepare(`
      SELECT id FROM referrals 
      WHERE referrer_id = ? AND referee_email = ? AND position_title = ? AND company_name = ?
      AND status NOT IN ('rejected', 'expired', 'declined')
    `).get(referrerId, referralData.refereeEmail, referralData.positionTitle, referralData.companyName);

    if (existingReferral) {
      throw new Error('A referral for this person and position already exists');
    }

    // Check daily referral limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayReferrals = this.db.prepare(`
      SELECT COUNT(*) as count FROM referrals 
      WHERE referrer_id = ? AND created_at >= ?
    `).get(referrerId, todayStart.toISOString()) as { count: number };

    if (todayReferrals.count >= REFERRAL_CONSTANTS.MAX_REFERRALS_PER_DAY) {
      throw new Error(`Daily referral limit of ${REFERRAL_CONSTANTS.MAX_REFERRALS_PER_DAY} reached`);
    }

    // Generate referral token and expiry date
    const expiresAt = new Date(Date.now() + REFERRAL_CONSTANTS.REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const rewardAmount = referralData.rewardAmount || REFERRAL_CONSTANTS.DEFAULT_REWARD_AMOUNT;

    // Insert referral first to get the ID
    const insertStmt = this.db.prepare(`
      INSERT INTO referrals (
        referrer_id, referee_email, referee_name, position_title, company_name,
        personal_message, reward_amount, referral_token, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use a temporary token first
    const tempToken = generateReferralToken();
    const result = insertStmt.run(
      referrerId,
      referralData.refereeEmail,
      referralData.refereeName,
      referralData.positionTitle,
      referralData.companyName,
      referralData.personalMessage || null,
      rewardAmount,
      tempToken,
      expiresAt.toISOString()
    );

    // Generate simple token with the actual referral ID
    const referralId = result.lastInsertRowid as number;
    const simpleToken = `ref_${referralId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update with the simple token
    this.db.prepare(`
      UPDATE referrals SET referral_token = ? WHERE id = ?
    `).run(simpleToken, referralId);

    // Log status history
    this.logStatusChange(result.lastInsertRowid as number, null, ReferralStatus.PENDING, referrerId);

    // Add to user's referral history
    await this.userIntegrationService.addReferralToUserHistory(referrerId, result.lastInsertRowid as number);

    // Get and return the created referral
    return this.getReferralById(result.lastInsertRowid as number);
  }

  /**
   * Update referral status
   */
  async updateReferralStatus(referralId: number, status: ReferralStatus, changedByUserId?: number, notes?: string): Promise<void> {
    // Get current referral
    const referral = this.getReferralById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    // Validate status transition
    if (!isValidStatusTransition(referral.status, status)) {
      throw new Error(`Invalid status transition from ${referral.status} to ${status}`);
    }

    // Update referral status
    const updateStmt = this.db.prepare(`
      UPDATE referrals 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    updateStmt.run(status, referralId);

    // Log status change
    this.logStatusChange(referralId, referral.status, status, changedByUserId, notes);

    // If hired, create reward
    if (status === ReferralStatus.HIRED) {
      await this.createReward(referral.referrerId, referralId, referral.rewardAmount);
    }
  }

  /**
   * Get referrals by user with filtering
   */
  getReferralsByUser(userId: number, filters?: ReferralFilters): { referrals: Referral[]; total: number } {
    console.log('🔍 SERVICE DEBUG: Getting referrals for user:', userId);
    
    let query = `
      SELECT * FROM referrals 
      WHERE referrer_id = ?
    `;
    const params: any[] = [userId];
    
    // First, let's check if there are ANY referrals in the database
    const allReferrals = this.db.prepare('SELECT COUNT(*) as count FROM referrals').get() as any;
    console.log('🔍 SERVICE DEBUG: Total referrals in database:', allReferrals.count);
    
    // Check referrals for this specific user
    const userReferrals = this.db.prepare('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?').get(userId) as any;
    console.log('🔍 SERVICE DEBUG: Referrals for user', userId, ':', userReferrals.count);

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      const statusPlaceholders = filters.status.map(() => '?').join(',');
      query += ` AND status IN (${statusPlaceholders})`;
      params.push(...filters.status);
    }

    if (filters?.dateFrom) {
      query += ` AND created_at >= ?`;
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ` AND created_at <= ?`;
      params.push(filters.dateTo);
    }

    if (filters?.search) {
      query += ` AND (referee_name LIKE ? OR referee_email LIKE ? OR position_title LIKE ? OR company_name LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = this.db.prepare(countQuery).get(...params) as { total: number };

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC`;
    
    if (filters?.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET ?`;
      params.push(filters.offset);
    }

    const referrals = this.db.prepare(query).all(...params) as Referral[];

    return {
      referrals: referrals.map(this.mapDatabaseToReferral),
      total: totalResult.total
    };
  }

  /**
   * Get referral statistics for a user
   */
  getReferralStats(userId: number): ReferralStats {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as totalReferrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingReferrals,
        COUNT(CASE WHEN status = 'signed_up' THEN 1 END) as contactedReferrals,
        COUNT(CASE WHEN status = 'trial_user' THEN 1 END) as interviewedReferrals,
        COUNT(CASE WHEN status = 'paid_user' THEN 1 END) as successfulReferrals,
        COUNT(CASE WHEN status = 'declined' THEN 1 END) as rejectedReferrals,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expiredReferrals,
        COALESCE(SUM(CASE WHEN status = 'paid_user' THEN reward_amount ELSE 0 END), 0) as totalEarnings
      FROM referrals 
      WHERE referrer_id = ?
    `).get(userId) as any;

    // Get reward statistics
    const rewardStats = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'earned' THEN amount ELSE 0 END), 0) as pendingRewards,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paidRewards
      FROM rewards 
      WHERE user_id = ?
    `).get(userId) as any;

    // Calculate conversion rate
    const conversionRate = stats.totalReferrals > 0 
      ? (stats.successfulReferrals / stats.totalReferrals) * 100 
      : 0;

    // Calculate average time to hire (simplified - would need more complex query for accurate calculation)
    const averageTimeToHire = 0; // TODO: Implement proper calculation

    return {
      totalReferrals: stats.totalReferrals,
      pendingReferrals: stats.pendingReferrals,
      contactedReferrals: stats.contactedReferrals,
      interviewedReferrals: stats.interviewedReferrals,
      successfulReferrals: stats.successfulReferrals,
      rejectedReferrals: stats.rejectedReferrals,
      expiredReferrals: stats.expiredReferrals,
      totalEarnings: stats.totalEarnings,
      pendingRewards: rewardStats.pendingRewards,
      paidRewards: rewardStats.paidRewards,
      conversionRate,
      averageTimeToHire
    };
  }

  /**
   * Get referral by ID
   */
  getReferralById(referralId: number): Referral {
    const referral = this.db.prepare(`
      SELECT * FROM referrals WHERE id = ?
    `).get(referralId) as any;

    if (!referral) {
      throw new Error('Referral not found');
    }

    return this.mapDatabaseToReferral(referral);
  }



  /**
   * Expire old referrals
   */
  async expireOldReferrals(): Promise<number> {
    const now = new Date().toISOString();
    
    // Get referrals that should be expired
    const expiredReferrals = this.db.prepare(`
      SELECT id FROM referrals 
      WHERE expires_at < ? AND status = 'pending'
    `).all(now) as { id: number }[];

    // Update each referral to expired status
    for (const referral of expiredReferrals) {
      await this.updateReferralStatus(referral.id, ReferralStatus.EXPIRED);
    }

    return expiredReferrals.length;
  }

  /**
   * Process reward for successful referral
   */
  private async createReward(userId: number, referralId: number, amount: number): Promise<void> {
    const insertReward = this.db.prepare(`
      INSERT INTO rewards (user_id, referral_id, amount, status)
      VALUES (?, ?, ?, 'earned')
    `);

    insertReward.run(userId, referralId, amount);
  }

  /**
   * Log status change in history
   */
  private logStatusChange(
    referralId: number, 
    previousStatus: ReferralStatus | null, 
    newStatus: ReferralStatus, 
    changedByUserId?: number,
    notes?: string
  ): void {
    const insertHistory = this.db.prepare(`
      INSERT INTO referral_status_history (referral_id, previous_status, new_status, changed_by_user_id, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertHistory.run(referralId, previousStatus, newStatus, changedByUserId || null, notes || null);
  }

  /**
   * Map database row to Referral interface
   */
  private mapDatabaseToReferral(row: any): Referral {
    return {
      id: row.id,
      referrerId: row.referrer_id,
      refereeEmail: row.referee_email,
      refereeName: row.referee_name,
      positionTitle: row.position_title,
      companyName: row.company_name,
      status: row.status as ReferralStatus,
      personalMessage: row.personal_message,
      rewardAmount: row.reward_amount,
      referralToken: row.referral_token,
      expiresAt: row.expires_at,
      refereeUserId: row.referee_user_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Link referee to user account when they create one
   */
  async linkRefereeToUser(referralToken: string, userId: number): Promise<void> {
    // Use user integration service to handle the linking
    await this.userIntegrationService.linkRefereeAccount(referralToken, userId);
  }

  /**
   * Get referral status history
   */
  getReferralStatusHistory(referralId: number): any[] {
    return this.db.prepare(`
      SELECT 
        rsh.*,
        u.first_name || ' ' || u.last_name as changed_by_name
      FROM referral_status_history rsh
      LEFT JOIN users u ON rsh.changed_by_user_id = u.id
      WHERE rsh.referral_id = ?
      ORDER BY rsh.created_at ASC
    `).all(referralId);
  }

  /**
   * Get referral details by token for referee response page
   */
  async getReferralByToken(token: string): Promise<any> {
    const referral = this.db.prepare(`
      SELECT 
        r.*,
        u.first_name || ' ' || u.last_name as referrer_name
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      WHERE r.referral_token = ?
    `).get(token) as any;

    if (!referral) {
      throw new Error('Invalid token');
    }

    // Check if referral has expired
    if (new Date(referral.expires_at) < new Date()) {
      throw new Error('Referral expired');
    }

    return {
      id: referral.id,
      refereeName: referral.referee_name,
      referrerName: referral.referrer_name,
      positionTitle: referral.position_title,
      companyName: referral.company_name,
      personalMessage: referral.personal_message,
      rewardAmount: referral.reward_amount,
      expiresAt: referral.expires_at,
      status: referral.status
    };
  }

  /**
   * Process referee response to referral invitation
   */
  async processRefereeResponse(token: string, responseData: any): Promise<any> {
    // Get referral by token
    const referral = this.db.prepare(`
      SELECT * FROM referrals WHERE referral_token = ?
    `).get(token) as any;

    if (!referral) {
      throw new Error('Invalid token');
    }

    // Check if referral has expired
    if (new Date(referral.expires_at) < new Date()) {
      throw new Error('Referral expired');
    }

    // Check if response already submitted (status is not pending)
    if (referral.status !== ReferralStatus.PENDING) {
      throw new Error('Response already submitted');
    }

    const transaction = this.db.transaction(() => {
      let newUserId: number | null = null;

      // Create account if requested and user is interested
      if (responseData.createAccount && responseData.action === 'interested' && responseData.accountData) {
        // Check if user already exists with this email
        const existingUser = this.db.prepare(`
          SELECT id FROM users WHERE email = ?
        `).get(referral.referee_email) as any;

        if (existingUser) {
          newUserId = existingUser.id;
        } else {
          // Create new user account
          const insertUser = this.db.prepare(`
            INSERT INTO users (email, first_name, last_name, phone, linkedin_url, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `);

          const userResult = insertUser.run(
            referral.referee_email,
            responseData.accountData.firstName,
            responseData.accountData.lastName,
            responseData.accountData.phone || null,
            responseData.accountData.linkedinUrl || null
          );

          newUserId = userResult.lastInsertRowid as number;
        }

        // Link referral to user
        this.db.prepare(`
          UPDATE referrals 
          SET referee_user_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(newUserId, referral.id);
      }

      // Update referral status based on response
      const newStatus = responseData.action === 'interested' 
        ? ReferralStatus.CONTACTED 
        : ReferralStatus.DECLINED;

      this.db.prepare(`
        UPDATE referrals 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(newStatus, referral.id);

      // Store response metadata
      const metadata = {
        refereeResponse: {
          action: responseData.action,
          feedback: responseData.feedback,
          respondedAt: new Date().toISOString(),
          accountCreated: !!newUserId
        }
      };

      this.db.prepare(`
        UPDATE referrals 
        SET metadata = ? 
        WHERE id = ?
      `).run(JSON.stringify(metadata), referral.id);

      // Log status change
      this.logStatusChange(
        referral.id, 
        ReferralStatus.PENDING, 
        newStatus, 
        newUserId || undefined,
        responseData.feedback ? `Referee response: ${responseData.feedback}` : undefined
      );

      return {
        referralId: referral.id,
        status: newStatus,
        accountCreated: !!newUserId,
        userId: newUserId
      };
    });

    return transaction();
  }
}