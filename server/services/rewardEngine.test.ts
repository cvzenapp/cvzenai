/**
 * RewardEngine Unit Tests
 * Tests for reward calculations, balance tracking, and payout processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RewardEngine } from './rewardEngine.js';
import { getDatabase } from '../database/connection.js';
import { 
  Referral, 
  ReferralStatus, 
  RewardStatus, 
  REFERRAL_CONSTANTS,
  canReferralBeReversed
} from '../../shared/referrals.js';

// Mock the database connection
vi.mock('../database/connection.js');

// Mock the canReferralBeReversed function
vi.mock('../../shared/referrals.js', async () => {
  const actual = await vi.importActual('../../shared/referrals.js');
  return {
    ...actual,
    canReferralBeReversed: vi.fn()
  };
});

describe('RewardEngine', () => {
  let rewardEngine: RewardEngine;
  let mockDb: any;

  beforeEach(() => {
    // Create mock database with common methods
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        get: vi.fn(),
        all: vi.fn(),
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1 })
      })
    };

    // Mock the getDatabase function
    vi.mocked(getDatabase).mockReturnValue(mockDb);
    
    rewardEngine = new RewardEngine();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateReward', () => {
    it('should calculate base reward amount correctly', async () => {
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'test@example.com',
        refereeName: 'Test User',
        positionTitle: 'Software Engineer',
        companyName: 'Test Company',
        status: ReferralStatus.PENDING,
        rewardAmount: 30.00,
        referralToken: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock config value for bonus multiplier
      mockDb.prepare().get.mockReturnValue({ config_value: '1.0' });

      const reward = await rewardEngine.calculateReward(referral);
      expect(reward).toBe(30.00);
    });

    it('should apply bonus multiplier from configuration', async () => {
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'test@example.com',
        refereeName: 'Test User',
        positionTitle: 'Software Engineer',
        companyName: 'Test Company',
        status: ReferralStatus.PENDING,
        rewardAmount: 30.00,
        referralToken: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock config value for 1.5x bonus multiplier
      mockDb.prepare().get.mockReturnValue({ config_value: '1.5' });

      const reward = await rewardEngine.calculateReward(referral);
      expect(reward).toBe(45.00);
    });

    it('should apply senior position bonus', async () => {
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'test@example.com',
        refereeName: 'Test User',
        positionTitle: 'Senior Software Engineer',
        companyName: 'Test Company',
        status: ReferralStatus.PENDING,
        rewardAmount: 30.00,
        referralToken: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock config value for base multiplier
      mockDb.prepare().get.mockReturnValue({ config_value: '1.0' });

      const reward = await rewardEngine.calculateReward(referral);
      expect(reward).toBe(33.00); // 30 * 1.1 = 33
    });

    it('should round reward to 2 decimal places', async () => {
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'test@example.com',
        refereeName: 'Test User',
        positionTitle: 'Senior Software Engineer',
        companyName: 'Test Company',
        status: ReferralStatus.PENDING,
        rewardAmount: 33.33,
        referralToken: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock config value for base multiplier
      mockDb.prepare().get.mockReturnValue({ config_value: '1.0' });

      const reward = await rewardEngine.calculateReward(referral);
      expect(reward).toBe(36.66); // 33.33 * 1.1 = 36.663, rounded to 36.66
    });
  });

  describe('creditReward', () => {
    it('should create a new reward successfully', async () => {
      // Mock no existing reward
      mockDb.prepare().get.mockReturnValueOnce(null);
      
      // Mock successful insert
      mockDb.prepare().run.mockReturnValue({ lastInsertRowid: 1 });
      
      // Mock reward retrieval
      const mockReward = {
        id: 1,
        user_id: 1,
        referral_id: 1,
        amount: 30.00,
        status: 'earned',
        earned_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };
      mockDb.prepare().get.mockReturnValueOnce(mockReward);

      const reward = await rewardEngine.creditReward(1, 1, 30.00);
      
      expect(reward.id).toBe(1);
      expect(reward.userId).toBe(1);
      expect(reward.referralId).toBe(1);
      expect(reward.amount).toBe(30.00);
      expect(reward.status).toBe(RewardStatus.EARNED);
    });

    it('should throw error if reward already exists', async () => {
      // Mock existing reward
      mockDb.prepare().get.mockReturnValue({ id: 1 });

      await expect(rewardEngine.creditReward(1, 1, 30.00))
        .rejects.toThrow('Reward already exists for this referral');
    });
  });

  describe('processPayouts', () => {
    it('should process payouts for users above threshold', async () => {
      const minimumThreshold = 100.00;
      
      // Mock config value
      mockDb.prepare().get.mockReturnValue({ config_value: '100.00' });
      
      // Mock users eligible for payout
      const usersForPayout = [
        { user_id: 1, total_earned: 150.00 },
        { user_id: 2, total_earned: 200.00 }
      ];
      mockDb.prepare().all.mockReturnValue(usersForPayout);
      
      // Mock successful payout processing
      mockDb.prepare().run.mockReturnValue({ changes: 2 });

      const result = await rewardEngine.processPayouts();
      
      expect(result.processed).toBe(2);
      expect(result.totalAmount).toBe(350.00);
    });

    it('should handle payout processing errors gracefully', async () => {
      // Mock config value
      mockDb.prepare().get.mockReturnValue({ config_value: '100.00' });
      
      // Mock users eligible for payout
      const usersForPayout = [
        { user_id: 1, total_earned: 150.00 }
      ];
      mockDb.prepare().all.mockReturnValue(usersForPayout);
      
      // Mock payout processing error
      mockDb.prepare().run.mockImplementation(() => {
        throw new Error('Payment processing failed');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await rewardEngine.processPayouts();
      
      expect(result.processed).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to process payout for user 1:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('reverseReward', () => {
    it('should reverse an earned reward successfully', async () => {
      const mockReward = {
        id: 1,
        user_id: 1,
        referral_id: 1,
        amount: 30.00,
        status: 'earned'
      };
      
      // Create a recent hire date (within 90 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago
      const mockReferral = {
        id: 1,
        status: 'hired',
        updated_at: recentDate.toISOString()
      };

      // Mock reward and referral retrieval
      mockDb.prepare().get
        .mockReturnValueOnce(mockReward)
        .mockReturnValueOnce(mockReferral);
      
      // Mock canReferralBeReversed to return true
      vi.mocked(canReferralBeReversed).mockReturnValue(true);
      
      // Mock successful update
      mockDb.prepare().run.mockReturnValue({ changes: 1 });

      await expect(rewardEngine.reverseReward(1, 'Employee left within 90 days'))
        .resolves.not.toThrow();
    });

    it('should throw error if reward not found', async () => {
      mockDb.prepare().get.mockReturnValue(null);

      await expect(rewardEngine.reverseReward(1, 'Test reason'))
        .rejects.toThrow('Reward not found for this referral');
    });

    it('should throw error if reward already reversed', async () => {
      const mockReward = {
        id: 1,
        status: 'reversed'
      };
      
      mockDb.prepare().get.mockReturnValue(mockReward);

      await expect(rewardEngine.reverseReward(1, 'Test reason'))
        .rejects.toThrow('Reward is already reversed');
    });

    it('should throw error if reversal period expired', async () => {
      const mockReward = {
        id: 1,
        status: 'earned'
      };
      
      // Mock referral with old hire date (more than 90 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      const mockReferral = {
        id: 1,
        status: 'hired',
        updated_at: oldDate.toISOString()
      };

      mockDb.prepare().get
        .mockReturnValueOnce(mockReward)
        .mockReturnValueOnce(mockReferral);

      // Mock canReferralBeReversed to return false (expired)
      vi.mocked(canReferralBeReversed).mockReturnValue(false);

      await expect(rewardEngine.reverseReward(1, 'Test reason'))
        .rejects.toThrow('Reward reversal period has expired');
    });

    it('should create negative reward entry for paid rewards', async () => {
      const mockReward = {
        id: 1,
        user_id: 1,
        referral_id: 1,
        amount: 30.00,
        status: 'paid'
      };
      
      // Create a recent hire date (within 90 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago
      const mockReferral = {
        id: 1,
        status: 'hired',
        updated_at: recentDate.toISOString()
      };

      mockDb.prepare().get
        .mockReturnValueOnce(mockReward)
        .mockReturnValueOnce(mockReferral);
      
      // Mock canReferralBeReversed to return true
      vi.mocked(canReferralBeReversed).mockReturnValue(true);
      
      // Mock successful updates
      mockDb.prepare().run.mockReturnValue({ changes: 1 });

      await rewardEngine.reverseReward(1, 'Employee left within 90 days');
      
      // Verify that both update and insert were called
      expect(mockDb.prepare().run).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRewardBalance', () => {
    it('should calculate reward balance correctly', async () => {
      const mockBalanceData = {
        totalEarnings: 150.00,
        pendingRewards: 120.00,
        paidRewards: 30.00
      };
      
      // Mock config value for minimum threshold
      mockDb.prepare().get
        .mockReturnValueOnce(mockBalanceData)
        .mockReturnValueOnce({ config_value: '100.00' });

      const balance = await rewardEngine.getRewardBalance(1);
      
      expect(balance.totalEarnings).toBe(150.00);
      expect(balance.pendingRewards).toBe(120.00);
      expect(balance.paidRewards).toBe(30.00);
      expect(balance.availableForPayout).toBe(120.00); // Above threshold
      expect(balance.minimumPayoutThreshold).toBe(100.00);
      expect(balance.nextPayoutDate).toBeDefined();
    });

    it('should set availableForPayout to 0 when below threshold', async () => {
      const mockBalanceData = {
        totalEarnings: 50.00,
        pendingRewards: 50.00,
        paidRewards: 0.00
      };
      
      mockDb.prepare().get
        .mockReturnValueOnce(mockBalanceData)
        .mockReturnValueOnce({ config_value: '100.00' });

      const balance = await rewardEngine.getRewardBalance(1);
      
      expect(balance.availableForPayout).toBe(0);
      expect(balance.nextPayoutDate).toBeUndefined();
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payment history', () => {
      const mockRewards = [
        {
          id: 1,
          user_id: 1,
          referral_id: 1,
          amount: 30.00,
          status: 'paid',
          earned_at: '2024-01-01T00:00:00Z',
          paid_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];
      
      mockDb.prepare().get.mockReturnValue({ total: 1 });
      mockDb.prepare().all.mockReturnValue(mockRewards);

      const result = rewardEngine.getPaymentHistory(1, 10, 0);
      
      expect(result.total).toBe(1);
      expect(result.rewards).toHaveLength(1);
      expect(result.rewards[0].id).toBe(1);
      expect(result.rewards[0].status).toBe(RewardStatus.PAID);
    });
  });

  describe('getRewardsStatistics', () => {
    it('should return comprehensive reward statistics', () => {
      const mockStats = {
        totalRewards: 10,
        totalAmount: 300.00,
        pendingAmount: 150.00,
        paidAmount: 120.00,
        reversedAmount: 30.00
      };
      
      mockDb.prepare().get.mockReturnValue(mockStats);

      const stats = rewardEngine.getRewardsStatistics();
      
      expect(stats.totalRewards).toBe(10);
      expect(stats.totalAmount).toBe(300.00);
      expect(stats.pendingAmount).toBe(150.00);
      expect(stats.paidAmount).toBe(120.00);
      expect(stats.reversedAmount).toBe(30.00);
    });
  });

  describe('isUserEligibleForRewards', () => {
    it('should return true for active verified user', async () => {
      const mockUser = {
        is_active: 1,
        email_verified: 1
      };
      
      mockDb.prepare().get.mockReturnValue(mockUser);

      const isEligible = await rewardEngine.isUserEligibleForRewards(1);
      expect(isEligible).toBe(true);
    });

    it('should return false for inactive user', async () => {
      const mockUser = {
        is_active: 0,
        email_verified: 1
      };
      
      mockDb.prepare().get.mockReturnValue(mockUser);

      const isEligible = await rewardEngine.isUserEligibleForRewards(1);
      expect(isEligible).toBe(false);
    });

    it('should return false for unverified user', async () => {
      const mockUser = {
        is_active: 1,
        email_verified: 0
      };
      
      mockDb.prepare().get.mockReturnValue(mockUser);

      const isEligible = await rewardEngine.isUserEligibleForRewards(1);
      expect(isEligible).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockDb.prepare().get.mockReturnValue(undefined);

      const isEligible = await rewardEngine.isUserEligibleForRewards(999);
      expect(isEligible).toBe(false);
    });
  });

  describe('getPendingRewardsForReview', () => {
    it('should return high-value rewards needing review', () => {
      const mockRewards = [
        {
          id: 1,
          user_id: 1,
          referral_id: 1,
          amount: 150.00,
          status: 'earned',
          earned_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];
      
      mockDb.prepare().all.mockReturnValue(mockRewards);

      const rewards = rewardEngine.getPendingRewardsForReview();
      
      expect(rewards).toHaveLength(1);
      expect(rewards[0].amount).toBe(150.00);
      expect(rewards[0].status).toBe(RewardStatus.EARNED);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.prepare().get.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(rewardEngine.calculateReward({} as Referral))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle missing configuration values', async () => {
      const referral: Referral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'test@example.com',
        refereeName: 'Test User',
        positionTitle: 'Software Engineer',
        companyName: 'Test Company',
        status: ReferralStatus.PENDING,
        rewardAmount: 30.00,
        referralToken: 'test-token',
        expiresAt: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      // Mock missing config value
      mockDb.prepare().get.mockReturnValue(undefined);

      const reward = await rewardEngine.calculateReward(referral);
      expect(reward).toBe(30.00); // Should use default multiplier of 1.0
    });
  });
});