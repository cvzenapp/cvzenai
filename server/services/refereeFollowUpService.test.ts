/**
 * Tests for Referee Follow-up Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RefereeFollowUpService } from './refereeFollowUpService.js';
import { getDatabase } from '../database/connection.js';
import { ReferralStatus } from '../../shared/referrals.js';

describe('RefereeFollowUpService', () => {
  let service: RefereeFollowUpService;
  let db: any;

  beforeEach(() => {
    service = new RefereeFollowUpService();
    db = getDatabase();
    
    // Clean up test data
    db.exec('DELETE FROM follow_up_sequences');
    db.exec('DELETE FROM referee_profiles');
    db.exec('DELETE FROM job_matches');
    db.exec('DELETE FROM feedback_collections');
    db.exec('DELETE FROM referee_engagement');
    
    // Insert test referral
    db.exec(`
      INSERT OR IGNORE INTO users (id, email, first_name, last_name) 
      VALUES (1, 'referrer@test.com', 'John', 'Referrer')
    `);
    
    db.exec(`
      INSERT OR IGNORE INTO referrals (
        id, referrer_id, referee_email, referee_name, position_title, 
        company_name, status, reward_amount, referral_token, expires_at
      ) VALUES (
        1, 1, 'referee@test.com', 'Jane Referee', 'Software Engineer',
        'Test Corp', 'pending', 30.00, 'test_token_123', '2025-02-01 00:00:00'
      )
    `);
  });

  afterEach(() => {
    // Clean up test data
    db.exec('DELETE FROM follow_up_sequences');
    db.exec('DELETE FROM referee_profiles');
    db.exec('DELETE FROM job_matches');
    db.exec('DELETE FROM feedback_collections');
    db.exec('DELETE FROM referee_engagement');
  });

  describe('initializeFollowUpSequence', () => {
    it('should create a new non-responder follow-up sequence', async () => {
      const sequence = await service.initializeFollowUpSequence(1, 'non_responder');
      
      expect(sequence).toBeDefined();
      expect(sequence.referralId).toBe(1);
      expect(sequence.sequenceType).toBe('non_responder');
      expect(sequence.currentStep).toBe(1);
      expect(sequence.totalSteps).toBe(3);
      expect(sequence.completed).toBe(false);
      expect(new Date(sequence.nextFollowUpAt)).toBeInstanceOf(Date);
    });

    it('should create an onboarding follow-up sequence', async () => {
      const sequence = await service.initializeFollowUpSequence(1, 'onboarding');
      
      expect(sequence.sequenceType).toBe('onboarding');
      expect(sequence.totalSteps).toBe(4);
    });

    it('should create a job matching follow-up sequence', async () => {
      const sequence = await service.initializeFollowUpSequence(1, 'job_matching');
      
      expect(sequence.sequenceType).toBe('job_matching');
      expect(sequence.totalSteps).toBe(2);
    });

    it('should not create duplicate sequences', async () => {
      const sequence1 = await service.initializeFollowUpSequence(1, 'non_responder');
      const sequence2 = await service.initializeFollowUpSequence(1, 'non_responder');
      
      expect(sequence1.id).toBe(sequence2.id);
    });
  });

  describe('createRefereeProfile', () => {
    beforeEach(() => {
      // Insert test user for referee
      db.exec(`
        INSERT OR IGNORE INTO users (id, email, first_name, last_name) 
        VALUES (2, 'referee@test.com', 'Jane', 'Referee')
      `);
    });

    it('should create a referee profile with correct completion score', async () => {
      const profileData = {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '5 years of software development',
        preferences: {
          jobTypes: ['Full-time', 'Remote'],
          locations: ['San Francisco', 'New York'],
          salaryRange: { min: 80000, max: 120000 },
          remoteWork: true
        }
      };

      const profile = await service.createRefereeProfile(2, 1, profileData);
      
      expect(profile).toBeDefined();
      expect(profile.userId).toBe(2);
      expect(profile.referralId).toBe(1);
      expect(profile.profileCompletionScore).toBe(100); // All fields filled
      expect(profile.skills).toEqual(profileData.skills);
      expect(profile.experience).toBe(profileData.experience);
      expect(profile.preferences).toEqual(profileData.preferences);
      expect(profile.onboardingCompleted).toBe(false);
    });

    it('should calculate partial completion score correctly', async () => {
      const profileData = {
        skills: ['JavaScript'],
        experience: '', // Missing
        preferences: {
          jobTypes: ['Full-time'],
          locations: [], // Missing
          remoteWork: true
        }
      };

      const profile = await service.createRefereeProfile(2, 1, profileData);
      
      expect(profile.profileCompletionScore).toBe(50); // 2 out of 4 sections completed
    });
  });

  describe('findJobMatches', () => {
    beforeEach(async () => {
      // Create referee user and profile
      db.exec(`
        INSERT OR IGNORE INTO users (id, email, first_name, last_name) 
        VALUES (2, 'referee@test.com', 'Jane', 'Referee')
      `);

      await service.createRefereeProfile(2, 1, {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '5 years of software development',
        preferences: {
          jobTypes: ['Software Engineer', 'Full-stack'],
          locations: ['San Francisco'],
          salaryRange: { min: 80000, max: 120000 },
          remoteWork: true
        }
      });
    });

    it('should find relevant job matches', async () => {
      const matches = await service.findJobMatches(2);
      
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      
      // Check that matches are sorted by score
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i-1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore);
      }
    });

    it('should include match reasons and skill matches', async () => {
      const matches = await service.findJobMatches(2);
      
      if (matches.length > 0) {
        const topMatch = matches[0];
        expect(topMatch.matchReasons).toBeDefined();
        expect(Array.isArray(topMatch.matchReasons)).toBe(true);
        expect(topMatch.skillMatches).toBeDefined();
        expect(Array.isArray(topMatch.skillMatches)).toBe(true);
      }
    });
  });

  describe('collectFeedback', () => {
    it('should collect declined referral feedback', async () => {
      const feedbackData = {
        feedbackType: 'declined_referral' as const,
        feedback: 'Not interested in this type of role',
        rating: 3,
        suggestions: 'More technical roles would be better'
      };

      const feedback = await service.collectFeedback(1, feedbackData);
      
      expect(feedback).toBeDefined();
      expect(feedback.referralId).toBe(1);
      expect(feedback.feedbackType).toBe('declined_referral');
      expect(feedback.feedback).toBe(feedbackData.feedback);
      expect(feedback.rating).toBe(3);
      expect(feedback.suggestions).toBe(feedbackData.suggestions);
    });

    it('should collect feedback without rating', async () => {
      const feedbackData = {
        feedbackType: 'general' as const,
        feedback: 'The process was smooth'
      };

      const feedback = await service.collectFeedback(1, feedbackData);
      
      expect(feedback.rating).toBeUndefined();
    });
  });

  describe('getRefereeConversionMetrics', () => {
    beforeEach(() => {
      // Insert additional test data for metrics
      db.exec(`
        INSERT INTO referrals (
          id, referrer_id, referee_email, referee_name, position_title, 
          company_name, status, reward_amount, referral_token, expires_at, referee_user_id
        ) VALUES 
        (2, 1, 'referee2@test.com', 'John Referee', 'Product Manager',
         'Test Corp', 'contacted', 30.00, 'test_token_456', '2025-02-01 00:00:00', 3),
        (3, 1, 'referee3@test.com', 'Bob Referee', 'Designer',
         'Test Corp', 'hired', 30.00, 'test_token_789', '2025-02-01 00:00:00', 4)
      `);

      db.exec(`
        INSERT INTO users (id, email, first_name, last_name) VALUES 
        (3, 'referee2@test.com', 'John', 'Referee'),
        (4, 'referee3@test.com', 'Bob', 'Referee')
      `);

      db.exec(`
        INSERT INTO referee_profiles (user_id, referral_id, profile_completion_score, skills, experience, preferences, onboarding_completed)
        VALUES 
        (3, 2, 75, '["Product Management"]', '3 years PM experience', '{"jobTypes":["PM"],"locations":["NYC"],"remoteWork":false}', 0),
        (4, 3, 100, '["Design", "Figma"]', '4 years design experience', '{"jobTypes":["Designer"],"locations":["LA"],"remoteWork":true}', 1)
      `);
    });

    it('should calculate conversion metrics correctly', () => {
      const metrics = service.getRefereeConversionMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalReferrals).toBe(3);
      expect(metrics.responseRate).toBeCloseTo(66.67, 1); // 2 out of 3 responded
      expect(metrics.interestRate).toBeCloseTo(66.67, 1); // 2 out of 3 interested
      expect(metrics.accountCreationRate).toBeCloseTo(66.67, 1); // 2 out of 3 created accounts
      expect(metrics.profileCompletionRate).toBe(50); // 1 out of 2 completed onboarding
    });
  });

  describe('processDueFollowUps', () => {
    beforeEach(async () => {
      // Create a follow-up sequence that's due
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      
      db.exec(`
        INSERT INTO follow_up_sequences (
          referral_id, sequence_type, current_step, total_steps, next_follow_up_at, completed
        ) VALUES (1, 'non_responder', 1, 3, '${pastDate.toISOString()}', 0)
      `);
    });

    it('should process due follow-up sequences', async () => {
      const processedCount = await service.processDueFollowUps();
      
      expect(processedCount).toBe(1);
      
      // Check that the sequence was advanced
      const sequence = db.prepare(`
        SELECT * FROM follow_up_sequences WHERE referral_id = 1
      `).get();
      
      expect(sequence.current_step).toBe(2);
    });

    it('should not process future follow-ups', async () => {
      // Update the follow-up to be in the future
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      db.exec(`
        UPDATE follow_up_sequences 
        SET next_follow_up_at = '${futureDate.toISOString()}'
        WHERE referral_id = 1
      `);

      const processedCount = await service.processDueFollowUps();
      
      expect(processedCount).toBe(0);
    });

    it('should complete sequence when all steps are done', async () => {
      // Set sequence to last step
      db.exec(`
        UPDATE follow_up_sequences 
        SET current_step = 3
        WHERE referral_id = 1
      `);

      const processedCount = await service.processDueFollowUps();
      
      expect(processedCount).toBe(1);
      
      // Check that sequence is completed
      const sequence = db.prepare(`
        SELECT * FROM follow_up_sequences WHERE referral_id = 1
      `).get();
      
      expect(sequence.completed).toBe(1);
    });
  });

  describe('integration with referral status changes', () => {
    beforeEach(async () => {
      await service.initializeFollowUpSequence(1, 'non_responder');
    });

    it('should complete non-responder sequence when referral status changes', async () => {
      // Simulate referral status change to contacted
      db.exec(`
        UPDATE referrals SET status = 'contacted' WHERE id = 1
      `);

      // Process follow-ups
      await service.processDueFollowUps();

      // Check that non-responder sequence is completed
      const sequence = db.prepare(`
        SELECT * FROM follow_up_sequences 
        WHERE referral_id = 1 AND sequence_type = 'non_responder'
      `).get();

      expect(sequence.completed).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid referral ID gracefully', async () => {
      await expect(service.initializeFollowUpSequence(999, 'non_responder'))
        .rejects.toThrow();
    });

    it('should handle invalid user ID in profile creation', async () => {
      const profileData = {
        skills: ['JavaScript'],
        experience: 'Test experience',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['Test City'],
          remoteWork: true
        }
      };

      await expect(service.createRefereeProfile(999, 1, profileData))
        .rejects.toThrow();
    });
  });
});