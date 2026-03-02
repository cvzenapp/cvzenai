/**
 * Job Matching Integration Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JobMatchingIntegrationService, PlacementRecord } from './jobMatchingIntegrationService.js';
import { ReferralService } from './referralService.js';
import { getDatabase } from '../database/connection.js';
import { ReferralStatus } from '../../shared/referrals.js';

describe('JobMatchingIntegrationService', () => {
  let service: JobMatchingIntegrationService;
  let referralService: ReferralService;
  let db: any;
  let testUserId: number;
  let testReferralId: number;

  beforeEach(async () => {
    service = new JobMatchingIntegrationService();
    referralService = new ReferralService();
    db = getDatabase();
    
    // Create test user
    const userResult = db.prepare(`
      INSERT INTO users (email, first_name, last_name, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run('test@example.com', 'Test', 'User', 'hash', 1);
    
    testUserId = userResult.lastInsertRowid as number;

    // Create test referral
    const referralData = {
      refereeEmail: 'referee@example.com',
      refereeName: 'Test Referee',
      positionTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      personalMessage: 'Great opportunity!'
    };

    const referral = await referralService.createReferral(testUserId, referralData);
    testReferralId = parseInt(referral.id);
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM referral_job_connections WHERE referral_id = ?').run(testReferralId);
    db.prepare('DELETE FROM job_matches WHERE referral_id = ?').run(testReferralId);
    db.prepare('DELETE FROM referral_attributions WHERE referral_id = ?').run(testReferralId);
    db.prepare('DELETE FROM placement_confirmations WHERE referral_id = ?').run(testReferralId);
    db.prepare('DELETE FROM manual_review_queue WHERE referral_id = ?').run(testReferralId);
    db.prepare('DELETE FROM activities WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM referrals WHERE id = ?').run(testReferralId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('connectReferralToJobOpportunity', () => {
    it('should connect referral to job opportunity', async () => {
      const jobId = 'job-123';

      await service.connectReferralToJobOpportunity(testReferralId, jobId);

      // Check connection was created
      const connection = db.prepare(`
        SELECT * FROM referral_job_connections 
        WHERE referral_id = ? AND job_id = ?
      `).get(testReferralId, jobId);

      expect(connection).toBeDefined();
      expect(connection.referral_id).toBe(testReferralId);
      expect(connection.job_id).toBe(jobId);

      // Check referral metadata was updated
      const referral = referralService.getReferralById(testReferralId);
      expect(referral.metadata?.connectedJob).toBeDefined();
      expect(referral.metadata.connectedJob.jobId).toBe(jobId);
    });

    it('should throw error for non-existent referral', async () => {
      await expect(service.connectReferralToJobOpportunity(99999, 'job-123'))
        .rejects.toThrow('Referral not found');
    });
  });

  describe('detectHireFromPlacement', () => {
    it('should detect hire and update referral status', async () => {
      // Create referee user
      const refereeResult = db.prepare(`
        INSERT INTO users (email, first_name, last_name, password_hash, is_active)
        VALUES (?, ?, ?, ?, ?)
      `).run('referee@example.com', 'Test', 'Referee', 'hash', 1);
      
      const refereeUserId = refereeResult.lastInsertRowid as number;

      // Link referral to referee
      await referralService.linkRefereeToUser('test-token', refereeUserId);

      // Create placement record
      const placementRecord: PlacementRecord = {
        id: 'placement-123',
        candidateId: refereeUserId,
        jobId: 'job-123',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      await service.detectHireFromPlacement(placementRecord);

      // Check referral status was updated
      const updatedReferral = referralService.getReferralById(testReferralId);
      expect(updatedReferral.status).toBe(ReferralStatus.PAID_USER);

      // Check attribution was created
      const attribution = db.prepare(`
        SELECT * FROM referral_attributions WHERE referral_id = ?
      `).get(testReferralId);

      expect(attribution).toBeDefined();
      expect(attribution.placement_id).toBe(placementRecord.id);

      // Clean up
      db.prepare('DELETE FROM users WHERE id = ?').run(refereeUserId);
    });

    it('should not detect hire for low attribution score', async () => {
      // Create unrelated placement
      const placementRecord: PlacementRecord = {
        id: 'placement-456',
        candidateId: 99999, // Non-existent user
        jobId: 'job-456',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      await service.detectHireFromPlacement(placementRecord);

      // Check referral status was not updated
      const referral = referralService.getReferralById(testReferralId);
      expect(referral.status).toBe(ReferralStatus.PENDING);

      // Check no attribution was created
      const attribution = db.prepare(`
        SELECT * FROM referral_attributions WHERE referral_id = ?
      `).get(testReferralId);

      expect(attribution).toBeUndefined();
    });
  });

  describe('createReferralAttribution', () => {
    it('should create referral attribution', async () => {
      const placementRecord: PlacementRecord = {
        id: 'placement-789',
        candidateId: testUserId,
        jobId: 'job-789',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      const attribution = await service.createReferralAttribution(testReferralId, placementRecord);

      expect(attribution).toBeDefined();
      expect(attribution.referralId).toBe(testReferralId);
      expect(attribution.placementId).toBe(placementRecord.id);
      expect(attribution.attributionScore).toBeGreaterThan(0);
      expect(attribution.attributionReasons).toBeDefined();

      // Check database record
      const dbAttribution = db.prepare(`
        SELECT * FROM referral_attributions WHERE referral_id = ?
      `).get(testReferralId);

      expect(dbAttribution).toBeDefined();
      expect(dbAttribution.placement_id).toBe(placementRecord.id);
    });

    it('should throw error for non-existent referral', async () => {
      const placementRecord: PlacementRecord = {
        id: 'placement-999',
        candidateId: testUserId,
        jobId: 'job-999',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      await expect(service.createReferralAttribution(99999, placementRecord))
        .rejects.toThrow('Referral not found');
    });
  });

  describe('createPlacementConfirmationWorkflow', () => {
    beforeEach(async () => {
      // Create attribution first
      const placementRecord: PlacementRecord = {
        id: 'placement-workflow',
        candidateId: testUserId,
        jobId: 'job-workflow',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      await service.createReferralAttribution(testReferralId, placementRecord);
    });

    it('should create placement confirmation workflow', async () => {
      const placementRecord: PlacementRecord = {
        id: 'placement-workflow',
        candidateId: testUserId,
        jobId: 'job-workflow',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      await service.createPlacementConfirmationWorkflow(placementRecord);

      // Check confirmation was created
      const confirmation = db.prepare(`
        SELECT * FROM placement_confirmations WHERE referral_id = ?
      `).get(testReferralId);

      expect(confirmation).toBeDefined();
      expect(confirmation.placement_id).toBe(placementRecord.id);
      expect(confirmation.status).toBeDefined();
    });
  });

  describe('getMatchingJobsForReferral', () => {
    it('should return matching jobs for referral', async () => {
      const jobs = await service.getMatchingJobsForReferral(testReferralId);

      expect(Array.isArray(jobs)).toBe(true);
      expect(jobs.length).toBeGreaterThan(0);
      
      // Should include jobs that match referral criteria
      const matchingJob = jobs.find(job => 
        job.title.toLowerCase().includes('software engineer') ||
        job.company.toLowerCase().includes('tech corp')
      );
      
      expect(matchingJob).toBeDefined();
    });

    it('should throw error for non-existent referral', async () => {
      await expect(service.getMatchingJobsForReferral(99999))
        .rejects.toThrow('Referral not found');
    });
  });

  describe('trackJobApplication', () => {
    it('should track job application with referral', async () => {
      const candidateId = testUserId;
      const jobId = 'job-application';

      await service.trackJobApplication(candidateId, jobId, testReferralId);

      // Check job match was created
      const jobMatch = db.prepare(`
        SELECT * FROM job_matches 
        WHERE candidate_id = ? AND job_id = ? AND referral_id = ?
      `).get(candidateId, jobId, testReferralId);

      expect(jobMatch).toBeDefined();
      expect(jobMatch.status).toBe('applied');
      expect(jobMatch.match_score).toBe(0.8); // Higher score for referral

      // Check referral status was updated
      const referral = referralService.getReferralById(testReferralId);
      expect(referral.status).toBe(ReferralStatus.SIGNED_UP);
    });

    it('should track job application without referral', async () => {
      const candidateId = testUserId;
      const jobId = 'job-no-referral';

      await service.trackJobApplication(candidateId, jobId);

      // Check job match was created
      const jobMatch = db.prepare(`
        SELECT * FROM job_matches 
        WHERE candidate_id = ? AND job_id = ? AND referral_id IS NULL
      `).get(candidateId, jobId);

      expect(jobMatch).toBeDefined();
      expect(jobMatch.status).toBe('applied');
      expect(jobMatch.match_score).toBe(0.5); // Lower score without referral
    });
  });

  describe('getReferralAttributionAnalytics', () => {
    beforeEach(async () => {
      // Create test attributions
      const placementRecord1: PlacementRecord = {
        id: 'placement-analytics-1',
        candidateId: testUserId,
        jobId: 'job-analytics-1',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      const placementRecord2: PlacementRecord = {
        id: 'placement-analytics-2',
        candidateId: testUserId,
        jobId: 'job-analytics-2',
        hiredDate: new Date().toISOString(),
        status: 'confirmed'
      };

      await service.createReferralAttribution(testReferralId, placementRecord1);
      await service.createReferralAttribution(testReferralId, placementRecord2);
    });

    it('should return analytics for all referrals', () => {
      const analytics = service.getReferralAttributionAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalAttributions).toBeGreaterThanOrEqual(2);
      expect(analytics.averageAttributionScore).toBeGreaterThan(0);
      expect(typeof analytics.highConfidenceAttributions).toBe('number');
      expect(typeof analytics.mediumConfidenceAttributions).toBe('number');
      expect(typeof analytics.lowConfidenceAttributions).toBe('number');
    });

    it('should return analytics for specific user', () => {
      const analytics = service.getReferralAttributionAnalytics(testUserId);

      expect(analytics).toBeDefined();
      expect(analytics.totalAttributions).toBeGreaterThanOrEqual(2);
      expect(analytics.averageAttributionScore).toBeGreaterThan(0);
    });

    it('should return zero analytics for user with no referrals', () => {
      const analytics = service.getReferralAttributionAnalytics(99999);

      expect(analytics.totalAttributions).toBe(0);
      expect(analytics.averageAttributionScore).toBe(0);
      expect(analytics.highConfidenceAttributions).toBe(0);
      expect(analytics.mediumConfidenceAttributions).toBe(0);
      expect(analytics.lowConfidenceAttributions).toBe(0);
    });
  });
});