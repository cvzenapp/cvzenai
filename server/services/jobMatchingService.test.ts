/**
 * Tests for Job Matching Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JobMatchingService } from './jobMatchingService.js';
import { RefereeFollowUpService } from './refereeFollowUpService.js';
import { getDatabase } from '../database/connection.js';

describe('JobMatchingService', () => {
  let jobMatchingService: JobMatchingService;
  let refereeService: RefereeFollowUpService;
  let db: any;

  beforeEach(() => {
    jobMatchingService = new JobMatchingService();
    refereeService = new RefereeFollowUpService();
    db = getDatabase();
    
    // Clean up test data
    db.exec('DELETE FROM job_matches');
    db.exec('DELETE FROM referee_profiles');
    db.exec('DELETE FROM referee_engagement');
    
    // Insert test users
    db.exec(`
      INSERT OR IGNORE INTO users (id, email, first_name, last_name) 
      VALUES 
      (1, 'referrer@test.com', 'John', 'Referrer'),
      (2, 'referee@test.com', 'Jane', 'Referee')
    `);
    
    // Insert test referral
    db.exec(`
      INSERT OR IGNORE INTO referrals (
        id, referrer_id, referee_email, referee_name, position_title, 
        company_name, status, reward_amount, referral_token, expires_at, referee_user_id
      ) VALUES (
        1, 1, 'referee@test.com', 'Jane Referee', 'Software Engineer',
        'Test Corp', 'contacted', 30.00, 'test_token_123', '2025-02-01 00:00:00', 2
      )
    `);
  });

  afterEach(() => {
    // Clean up test data
    db.exec('DELETE FROM job_matches');
    db.exec('DELETE FROM referee_profiles');
    db.exec('DELETE FROM referee_engagement');
  });

  describe('findJobMatches', () => {
    beforeEach(async () => {
      // Create a referee profile for testing
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        experience: '5+ years of software development experience',
        preferences: {
          jobTypes: ['Software Engineer', 'Full-stack Developer'],
          locations: ['San Francisco', 'New York'],
          salaryRange: { min: 90000, max: 130000 },
          remoteWork: true
        }
      });
    });

    it('should find job matches for a referee', async () => {
      const matches = await jobMatchingService.findJobMatches(2, 5);
      
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.length).toBeLessThanOrEqual(5);
    });

    it('should return matches sorted by score descending', async () => {
      const matches = await jobMatchingService.findJobMatches(2);
      
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i-1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore);
      }
    });

    it('should include match details for each job', async () => {
      const matches = await jobMatchingService.findJobMatches(2, 1);
      
      if (matches.length > 0) {
        const match = matches[0];
        
        expect(match.job).toBeDefined();
        expect(match.job.title).toBeDefined();
        expect(match.job.company).toBeDefined();
        expect(match.matchScore).toBeGreaterThan(0);
        expect(match.matchReasons).toBeDefined();
        expect(Array.isArray(match.matchReasons)).toBe(true);
        expect(match.skillMatches).toBeDefined();
        expect(Array.isArray(match.skillMatches)).toBe(true);
        expect(['perfect', 'good', 'acceptable', 'poor']).toContain(match.salaryFit);
        expect(['perfect', 'good', 'poor']).toContain(match.locationFit);
      }
    });

    it('should filter out low-scoring matches', async () => {
      // Create a profile with very different preferences
      await refereeService.createRefereeProfile(3, 1, {
        skills: ['Cooking', 'Baking'], // Completely unrelated skills
        experience: '10 years as a chef',
        preferences: {
          jobTypes: ['Chef', 'Cook'],
          locations: ['Paris', 'Tokyo'],
          salaryRange: { min: 30000, max: 50000 },
          remoteWork: false
        }
      });

      // Insert another user for this test
      db.exec(`
        INSERT OR IGNORE INTO users (id, email, first_name, last_name) 
        VALUES (3, 'chef@test.com', 'Chef', 'User')
      `);

      const matches = await jobMatchingService.findJobMatches(3);
      
      // Should have fewer or no matches due to low relevance
      expect(matches.length).toBeLessThan(3);
    });

    it('should handle referee without profile', async () => {
      // Try to find matches for user without profile
      await expect(jobMatchingService.findJobMatches(999))
        .rejects.toThrow('Referee profile not found');
    });
  });

  describe('storeJobMatch', () => {
    let testMatch: any;

    beforeEach(async () => {
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript', 'React'],
        experience: '3 years',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['SF'],
          remoteWork: true
        }
      });

      const matches = await jobMatchingService.findJobMatches(2, 1);
      testMatch = matches[0];
    });

    it('should store job match in database', async () => {
      await jobMatchingService.storeJobMatch(2, testMatch);
      
      const storedMatch = db.prepare(`
        SELECT * FROM job_matches WHERE referee_user_id = 2
      `).get();
      
      expect(storedMatch).toBeDefined();
      expect(storedMatch.job_title).toBe(testMatch.job.title);
      expect(storedMatch.company_name).toBe(testMatch.job.company);
      expect(storedMatch.match_score).toBe(testMatch.matchScore);
      expect(storedMatch.viewed).toBe(0);
      expect(storedMatch.applied).toBe(0);
    });
  });

  describe('trackJobMatchEngagement', () => {
    let jobMatchId: number;

    beforeEach(async () => {
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript'],
        experience: '2 years',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['NYC'],
          remoteWork: false
        }
      });

      const matches = await jobMatchingService.findJobMatches(2, 1);
      await jobMatchingService.storeJobMatch(2, matches[0]);
      
      const storedMatch = db.prepare(`
        SELECT id FROM job_matches WHERE referee_user_id = 2
      `).get();
      
      jobMatchId = storedMatch.id;
    });

    it('should track job view engagement', async () => {
      await jobMatchingService.trackJobMatchEngagement(2, jobMatchId, 'viewed');
      
      const updatedMatch = db.prepare(`
        SELECT * FROM job_matches WHERE id = ?
      `).get(jobMatchId);
      
      expect(updatedMatch.viewed).toBe(1);
      expect(updatedMatch.applied).toBe(0);
      
      const engagement = db.prepare(`
        SELECT * FROM referee_engagement WHERE referee_user_id = 2
      `).get();
      
      expect(engagement).toBeDefined();
      expect(engagement.engagement_type).toBe('job_viewed');
    });

    it('should track job application engagement', async () => {
      await jobMatchingService.trackJobMatchEngagement(2, jobMatchId, 'applied');
      
      const updatedMatch = db.prepare(`
        SELECT * FROM job_matches WHERE id = ?
      `).get(jobMatchId);
      
      expect(updatedMatch.applied).toBe(1);
      
      const engagement = db.prepare(`
        SELECT * FROM referee_engagement WHERE referee_user_id = 2
      `).get();
      
      expect(engagement.engagement_type).toBe('job_applied');
    });
  });

  describe('getJobMatchAnalytics', () => {
    beforeEach(async () => {
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript', 'React', 'Python'],
        experience: '4 years',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['SF'],
          remoteWork: true
        }
      });

      // Create some test job matches
      const matches = await jobMatchingService.findJobMatches(2, 3);
      
      for (let i = 0; i < matches.length; i++) {
        await jobMatchingService.storeJobMatch(2, matches[i]);
        
        // Simulate some engagement
        if (i === 0) {
          const jobMatch = db.prepare(`
            SELECT id FROM job_matches WHERE referee_user_id = 2 ORDER BY id LIMIT 1
          `).get();
          await jobMatchingService.trackJobMatchEngagement(2, jobMatch.id, 'viewed');
          await jobMatchingService.trackJobMatchEngagement(2, jobMatch.id, 'applied');
        } else if (i === 1) {
          const jobMatch = db.prepare(`
            SELECT id FROM job_matches WHERE referee_user_id = 2 ORDER BY id LIMIT 1 OFFSET 1
          `).get();
          await jobMatchingService.trackJobMatchEngagement(2, jobMatch.id, 'viewed');
        }
      }
    });

    it('should return comprehensive analytics', () => {
      const analytics = jobMatchingService.getJobMatchAnalytics(2);
      
      expect(analytics).toBeDefined();
      expect(analytics.totalMatches).toBeGreaterThan(0);
      expect(analytics.averageMatchScore).toBeGreaterThan(0);
      expect(analytics.viewedMatches).toBeGreaterThanOrEqual(0);
      expect(analytics.appliedMatches).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.topSkillMatches)).toBe(true);
      expect(analytics.engagementRate).toBeGreaterThanOrEqual(0);
      expect(analytics.engagementRate).toBeLessThanOrEqual(100);
    });

    it('should calculate engagement rate correctly', () => {
      const analytics = jobMatchingService.getJobMatchAnalytics(2);
      
      // We viewed 2 out of 3 matches, so engagement rate should be ~67%
      expect(analytics.engagementRate).toBeGreaterThan(50);
      expect(analytics.engagementRate).toBeLessThanOrEqual(100);
    });

    it('should return empty analytics for user with no matches', () => {
      const analytics = jobMatchingService.getJobMatchAnalytics(999);
      
      expect(analytics.totalMatches).toBe(0);
      expect(analytics.averageMatchScore).toBe(0);
      expect(analytics.viewedMatches).toBe(0);
      expect(analytics.appliedMatches).toBe(0);
      expect(analytics.topSkillMatches).toEqual([]);
      expect(analytics.engagementRate).toBe(0);
    });
  });

  describe('skill matching logic', () => {
    it('should match similar skills correctly', async () => {
      // Create profile with JavaScript skills
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '3 years',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['SF'],
          remoteWork: true
        }
      });

      const matches = await jobMatchingService.findJobMatches(2);
      
      // Should find matches for JavaScript-related jobs
      const jsMatches = matches.filter(match => 
        match.skillMatches.some(skill => 
          skill.toLowerCase().includes('javascript') || 
          skill.toLowerCase().includes('react') ||
          skill.toLowerCase().includes('node')
        )
      );
      
      expect(jsMatches.length).toBeGreaterThan(0);
    });
  });

  describe('location matching logic', () => {
    it('should prefer remote jobs for remote-preferring candidates', async () => {
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript'],
        experience: '2 years',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['Remote'],
          remoteWork: true
        }
      });

      const matches = await jobMatchingService.findJobMatches(2);
      
      // Remote-allowed jobs should have better location fit
      const remoteMatches = matches.filter(match => match.locationFit === 'perfect');
      expect(remoteMatches.length).toBeGreaterThan(0);
    });
  });

  describe('salary matching logic', () => {
    it('should match salary ranges appropriately', async () => {
      await refereeService.createRefereeProfile(2, 1, {
        skills: ['JavaScript', 'React'],
        experience: '5 years',
        preferences: {
          jobTypes: ['Senior Developer'],
          locations: ['SF'],
          salaryRange: { min: 100000, max: 150000 },
          remoteWork: false
        }
      });

      const matches = await jobMatchingService.findJobMatches(2);
      
      // Should have some matches with good salary fit
      const goodSalaryMatches = matches.filter(match => 
        match.salaryFit === 'perfect' || match.salaryFit === 'good'
      );
      
      expect(goodSalaryMatches.length).toBeGreaterThan(0);
    });
  });
});