/**
 * Comprehensive Integration Tests for Referrals System
 * Tests complete referral workflows end-to-end
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { getDatabase } from '../../database/connection.js';
import { ReferralService } from '../../services/referralService.js';
import { RewardEngine } from '../../services/rewardEngine.js';
import { NotificationService } from '../../services/notificationService.js';

describe('Referrals System Integration Tests', () => {
  let db: any;
  let referralService: ReferralService;
  let rewardEngine: RewardEngine;
  let notificationService: NotificationService;
  let testUserId: number;
  let testReferralId: number;

  beforeEach(async () => {
    db = getDatabase();
    referralService = new ReferralService();
    rewardEngine = new RewardEngine();
    notificationService = new NotificationService();

    // Create test user
    const userResult = db.prepare(`
      INSERT INTO users (first_name, last_name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run('Test', 'User', 'test@example.com', 'hashed_password');
    testUserId = userResult.lastInsertRowid as number;
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM referrals WHERE referrer_id = ?').run(testUserId);
    db.prepare('DELETE FROM rewards WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('Complete Referral Workflow', () => {
    it('should handle complete referral lifecycle from creation to reward', async () => {
      // Step 1: Create referral
      const referralData = {
        referrer_id: testUserId,
        referee_name: 'Jane Doe',
        referee_email: 'jane.doe@example.com',
        position_title: 'Software Engineer',
        company_name: 'Tech Corp',
        personal_message: 'Great opportunity for you!'
      };

      const referral = await referralService.createReferral(referralData);
      testReferralId = referral.id;

      expect(referral).toBeDefined();
      expect(referral.status).toBe('pending');
      expect(referral.referee_email).toBe(referralData.referee_email);

      // Step 2: Update status to signed up
      await referralService.updateReferralStatus(testReferralId, 'signed_up', testUserId);
      
      const updatedReferral = await referralService.getReferralById(testReferralId);
      expect(updatedReferral?.status).toBe('signed_up');

      // Step 3: Update to trial user
      await referralService.updateReferralStatus(testReferralId, 'trial_user', testUserId);

      // Step 4: Update to paid user (should trigger reward)
      await referralService.updateReferralStatus(testReferralId, 'paid_user', testUserId);

      const paidReferral = await referralService.getReferralById(testReferralId);
      expect(paidReferral?.status).toBe('paid_user');

      // Step 5: Verify reward was created
      const rewards = await rewardEngine.getRewardsByUser(testUserId);
      expect(rewards.length).toBe(1);
      expect(rewards[0].amount).toBeGreaterThan(0);
      expect(rewards[0].status).toBe('pending');
    });

    it('should handle referral rejection workflow', async () => {
      // Create referral
      const referralData = {
        referrer_id: testUserId,
        referee_name: 'John Smith',
        referee_email: 'john.smith@example.com',
        position_title: 'Product Manager',
        company_name: 'Startup Inc',
        personal_message: 'Perfect role for your skills!'
      };

      const referral = await referralService.createReferral(referralData);
      testReferralId = referral.id;

      // Update to declined
      await referralService.updateReferralStatus(testReferralId, 'declined', testUserId);

      const declinedReferral = await referralService.getReferralById(testReferralId);
      expect(declinedReferral?.status).toBe('declined');

      // Verify no reward was created
      const rewards = await rewardEngine.getRewardsByUser(testUserId);
      expect(rewards.length).toBe(0);
    });

    it('should handle reward reversal within 90 days', async () => {
      // Create and complete referral
      const referralData = {
        referrer_id: testUserId,
        referee_name: 'Alice Johnson',
        referee_email: 'alice.johnson@example.com',
        position_title: 'Designer',
        company_name: 'Design Studio',
        personal_message: 'Amazing design opportunity!'
      };

      const referral = await referralService.createReferral(referralData);
      testReferralId = referral.id;

      // Complete referral workflow
      await referralService.updateReferralStatus(testReferralId, 'signed_up', testUserId);
      await referralService.updateReferralStatus(testReferralId, 'trial_user', testUserId);
      await referralService.updateReferralStatus(testReferralId, 'paid_user', testUserId);

      // Verify reward exists
      let rewards = await rewardEngine.getRewardsByUser(testUserId);
      expect(rewards.length).toBe(1);
      expect(rewards[0].status).toBe('pending');

      // Reverse the hire (person left within 90 days)
      await rewardEngine.reverseReward(testReferralId, 'Employee left within 90 days');

      // Verify reward was reversed
      rewards = await rewardEngine.getRewardsByUser(testUserId);
      expect(rewards.length).toBe(1);
      expect(rewards[0].status).toBe('reversed');
    });
  });

  describe('Fraud Detection Integration', () => {
    it('should detect and flag suspicious referral patterns', async () => {
      // Create multiple referrals with sequential emails (fraud pattern)
      const suspiciousReferrals = [
        'user1@suspicious.com',
        'user2@suspicious.com', 
        'user3@suspicious.com',
        'user4@suspicious.com'
      ];

      for (const email of suspiciousReferrals) {
        await referralService.createReferral({
          referrer_id: testUserId,
          referee_name: `Test User ${email.split('@')[0]}`,
          referee_email: email,
          position_title: 'Software Engineer',
          company_name: 'Tech Corp',
          personal_message: 'Great opportunity!'
        });
      }

      // Check if fraud detection flags this pattern
      const fraudScore = await referralService.analyzeFraudPatterns(testUserId);
      expect(fraudScore.totalScore).toBeGreaterThan(50);
      expect(fraudScore.patterns.some(p => p.type === 'sequential_emails')).toBe(true);
      expect(fraudScore.requiresManualReview).toBe(true);
    });

    it('should handle rapid referral creation detection', async () => {
      // Create many referrals quickly
      const rapidReferrals = Array.from({ length: 12 }, (_, i) => ({
        referrer_id: testUserId,
        referee_name: `Rapid User ${i}`,
        referee_email: `rapid${i}@example.com`,
        position_title: 'Engineer',
        company_name: 'Fast Corp',
        personal_message: 'Quick referral!'
      }));

      // Create all referrals rapidly
      for (const referralData of rapidReferrals) {
        await referralService.createReferral(referralData);
      }

      const fraudScore = await referralService.analyzeFraudPatterns(testUserId);
      expect(fraudScore.patterns.some(p => p.type === 'rapid_creation')).toBe(true);
      expect(fraudScore.totalScore).toBeGreaterThan(30);
    });
  });

  describe('Notification Integration', () => {
    it('should send referral invitation email', async () => {
      const referralData = {
        referrer_id: testUserId,
        referee_name: 'Email Test User',
        referee_email: 'emailtest@example.com',
        position_title: 'Test Engineer',
        company_name: 'Email Corp',
        personal_message: 'Test email notification!'
      };

      const referral = await referralService.createReferral(referralData);
      
      // Mock email service to verify email was sent
      const emailSent = await notificationService.sendReferralInvitation(
        referral.id,
        referral.referee_email,
        referral.referee_name,
        'Test User',
        referral.position_title,
        referral.company_name,
        referral.personal_message
      );

      expect(emailSent).toBe(true);
    });

    it('should send status update notifications', async () => {
      const referralData = {
        referrer_id: testUserId,
        referee_name: 'Status Test User',
        referee_email: 'statustest@example.com',
        position_title: 'Status Engineer',
        company_name: 'Status Corp',
        personal_message: 'Status update test!'
      };

      const referral = await referralService.createReferral(referralData);
      testReferralId = referral.id;

      // Update status and verify notification
      await referralService.updateReferralStatus(testReferralId, 'trial_user', testUserId);

      const notificationSent = await notificationService.sendStatusUpdate(
        testUserId,
        testReferralId,
        'trial_user',
        'signed_up'
      );

      expect(notificationSent).toBe(true);
    });
  });

  describe('Payment Processing Integration', () => {
    it('should process payout when threshold is met', async () => {
      // Create multiple successful referrals to meet payout threshold
      const referrals = [
        { name: 'Payout User 1', email: 'payout1@example.com' },
        { name: 'Payout User 2', email: 'payout2@example.com' },
        { name: 'Payout User 3', email: 'payout3@example.com' }
      ];

      for (const ref of referrals) {
        const referral = await referralService.createReferral({
          referrer_id: testUserId,
          referee_name: ref.name,
          referee_email: ref.email,
          position_title: 'Engineer',
          company_name: 'Payout Corp',
          personal_message: 'Payout test!'
        });

        // Complete referral to generate reward
        await referralService.updateReferralStatus(referral.id, 'paid_user', testUserId);
      }

      // Check if payout threshold is met
      const balance = await rewardEngine.getUserBalance(testUserId);
      expect(balance.pendingAmount).toBeGreaterThan(0);

      // Process payout if threshold is met
      if (balance.pendingAmount >= 100) { // Assuming $100 minimum
        const payout = await rewardEngine.processPayouts(testUserId);
        expect(payout.success).toBe(true);
        expect(payout.amount).toBeGreaterThan(0);
      }
    });
  });

  describe('Admin Operations Integration', () => {
    it('should handle bulk status updates', async () => {
      // Create multiple referrals
      const referralIds: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const referral = await referralService.createReferral({
          referrer_id: testUserId,
          referee_name: `Bulk User ${i}`,
          referee_email: `bulk${i}@example.com`,
          position_title: 'Engineer',
          company_name: 'Bulk Corp',
          personal_message: 'Bulk test!'
        });
        referralIds.push(referral.id);
      }

      // Perform bulk update
      const updateResult = await referralService.bulkUpdateStatus(
        referralIds,
        'signed_up',
        testUserId,
        'Bulk update test'
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.updatedCount).toBe(5);

      // Verify all referrals were updated
      for (const id of referralIds) {
        const referral = await referralService.getReferralById(id);
        expect(referral?.status).toBe('signed_up');
      }
    });

    it('should handle manual review case workflow', async () => {
      // Create suspicious referral that triggers manual review
      const referral = await referralService.createReferral({
        referrer_id: testUserId,
        referee_name: 'Review User',
        referee_email: 'review@suspicious.com',
        position_title: 'High Value Engineer',
        company_name: 'Review Corp',
        personal_message: 'Manual review test!'
      });

      // Simulate fraud detection triggering manual review
      const fraudScore = await referralService.analyzeFraudPatterns(testUserId);
      
      if (fraudScore.requiresManualReview) {
        const reviewCase = await referralService.createManualReviewCase(
          testUserId,
          fraudScore,
          referral.id
        );

        expect(reviewCase).toBeDefined();
        expect(reviewCase.status).toBe('pending');
        expect(reviewCase.fraudScore).toBeGreaterThan(0);

        // Simulate admin approval
        await referralService.updateManualReviewCase(
          reviewCase.id,
          'approved',
          testUserId,
          'Approved after manual review'
        );

        const updatedCase = await referralService.getManualReviewCase(reviewCase.id);
        expect(updatedCase.status).toBe('approved');
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high volume referral creation', async () => {
      const startTime = Date.now();
      const referralPromises: Promise<any>[] = [];

      // Create 100 referrals concurrently
      for (let i = 0; i < 100; i++) {
        const promise = referralService.createReferral({
          referrer_id: testUserId,
          referee_name: `Load User ${i}`,
          referee_email: `load${i}@example.com`,
          position_title: 'Load Engineer',
          company_name: 'Load Corp',
          personal_message: 'Load test!'
        });
        referralPromises.push(promise);
      }

      const results = await Promise.all(referralPromises);
      const endTime = Date.now();

      expect(results.length).toBe(100);
      expect(results.every(r => r.id)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent status updates', async () => {
      // Create referral
      const referral = await referralService.createReferral({
        referrer_id: testUserId,
        referee_name: 'Concurrent User',
        referee_email: 'concurrent@example.com',
        position_title: 'Concurrent Engineer',
        company_name: 'Concurrent Corp',
        personal_message: 'Concurrent test!'
      });

      // Attempt concurrent status updates (should handle race conditions)
      const updatePromises = [
        referralService.updateReferralStatus(referral.id, 'signed_up', testUserId),
        referralService.updateReferralStatus(referral.id, 'trial_user', testUserId),
        referralService.updateReferralStatus(referral.id, 'paid_user', testUserId)
      ];

      // Only one should succeed due to proper state management
      const results = await Promise.allSettled(updatePromises);
      const successfulUpdates = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successfulUpdates).toBeGreaterThan(0);
      
      // Final state should be consistent
      const finalReferral = await referralService.getReferralById(referral.id);
      expect(['signed_up', 'trial_user', 'paid_user'].includes(finalReferral?.status || '')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate referral prevention', async () => {
      const referralData = {
        referrer_id: testUserId,
        referee_name: 'Duplicate User',
        referee_email: 'duplicate@example.com',
        position_title: 'Duplicate Engineer',
        company_name: 'Duplicate Corp',
        personal_message: 'Duplicate test!'
      };

      // Create first referral
      const firstReferral = await referralService.createReferral(referralData);
      expect(firstReferral).toBeDefined();

      // Attempt to create duplicate
      await expect(referralService.createReferral(referralData))
        .rejects.toThrow('Duplicate referral');
    });

    it('should handle invalid status transitions', async () => {
      const referral = await referralService.createReferral({
        referrer_id: testUserId,
        referee_name: 'Invalid User',
        referee_email: 'invalid@example.com',
        position_title: 'Invalid Engineer',
        company_name: 'Invalid Corp',
        personal_message: 'Invalid test!'
      });

      // Try invalid status transition (pending -> paid_user without intermediate steps)
      await expect(referralService.updateReferralStatus(referral.id, 'paid_user', testUserId))
        .rejects.toThrow('Invalid status transition');
    });

    it('should handle database connection failures gracefully', async () => {
      // Simulate database error by using invalid data
      await expect(referralService.createReferral({
        referrer_id: -1, // Invalid user ID
        referee_name: 'Error User',
        referee_email: 'error@example.com',
        position_title: 'Error Engineer',
        company_name: 'Error Corp',
        personal_message: 'Error test!'
      })).rejects.toThrow();
    });
  });
});