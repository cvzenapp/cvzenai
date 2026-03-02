/**
 * Tests for Client-side Referee Follow-up Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RefereeFollowUpService } from './refereeFollowUpService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RefereeFollowUpService', () => {
  let service: RefereeFollowUpService;

  beforeEach(() => {
    service = new RefereeFollowUpService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createProfile', () => {
    it('should create a referee profile successfully', async () => {
      const profileData = {
        userId: 1,
        referralId: 1,
        skills: ['JavaScript', 'React'],
        experience: '3 years of development',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['San Francisco'],
          remoteWork: true
        }
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          userId: 1,
          referralId: 1,
          profileCompletionScore: 100,
          skills: ['JavaScript', 'React'],
          experience: '3 years of development',
          preferences: profileData.preferences,
          onboardingCompleted: false,
          createdAt: '2025-01-08T00:00:00Z',
          updatedAt: '2025-01-08T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.createProfile(profileData);

      expect(mockFetch).toHaveBeenCalledWith('/api/referee/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when API returns failure', async () => {
      const profileData = {
        userId: 1,
        referralId: 1,
        skills: ['JavaScript'],
        experience: 'Test',
        preferences: {
          jobTypes: ['Developer'],
          locations: ['SF'],
          remoteWork: false
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Profile creation failed'
        })
      });

      await expect(service.createProfile(profileData))
        .rejects.toThrow('Profile creation failed');
    });
  });

  describe('getJobMatches', () => {
    it('should fetch job matches successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          matches: [
            {
              id: 1,
              refereeUserId: 1,
              jobTitle: 'Software Engineer',
              companyName: 'Tech Corp',
              matchScore: 85,
              matchReasons: ['Skills match', 'Location preference'],
              jobDescription: 'Great opportunity...',
              requirements: ['JavaScript', 'React'],
              location: 'San Francisco',
              remoteAllowed: true,
              createdAt: '2025-01-08T00:00:00Z'
            }
          ],
          total: 1
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getJobMatches(1, 5);

      expect(mockFetch).toHaveBeenCalledWith('/api/referee/1/job-matches?limit=5');
      expect(result).toEqual(mockResponse.data);
    });

    it('should use default limit when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { matches: [], total: 0 }
        })
      });

      await service.getJobMatches(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/referee/1/job-matches?limit=10');
    });
  });

  describe('trackJobMatchEngagement', () => {
    it('should track engagement successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 1,
          jobMatchId: 1,
          engagementType: 'viewed',
          trackedAt: '2025-01-08T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.trackJobMatchEngagement(1, 1, 'viewed');

      expect(mockFetch).toHaveBeenCalledWith('/api/referee/1/job-matches/1/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ engagementType: 'viewed' })
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedbackData = {
        referralId: 1,
        feedbackType: 'declined_referral' as const,
        feedback: 'Not interested in this role',
        rating: 3,
        suggestions: 'More technical roles please'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          referralId: 1,
          feedbackType: 'declined_referral',
          feedback: 'Not interested in this role',
          rating: 3,
          suggestions: 'More technical roles please',
          createdAt: '2025-01-08T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.submitFeedback(feedbackData);

      expect(mockFetch).toHaveBeenCalledWith('/api/referee/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getJobMatchAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalMatches: 10,
          averageMatchScore: 75,
          viewedMatches: 8,
          appliedMatches: 3,
          topSkillMatches: ['JavaScript', 'React', 'Node.js'],
          engagementRate: 80
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getJobMatchAnalytics(1);

      expect(mockFetch).toHaveBeenCalledWith('/api/referee/1/analytics');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('helper methods', () => {
    describe('formatSalaryRange', () => {
      it('should format salary range correctly', () => {
        const result = service.formatSalaryRange({ min: 80000, max: 120000 });
        expect(result).toBe('$80,000 - $120,000');
      });

      it('should handle undefined salary range', () => {
        const result = service.formatSalaryRange(undefined);
        expect(result).toBe('Not specified');
      });
    });

    describe('calculateProfileCompletion', () => {
      it('should calculate 100% completion for complete profile', () => {
        const profile = {
          skills: ['JavaScript'],
          experience: 'Test experience',
          preferences: {
            jobTypes: ['Developer'],
            locations: ['SF'],
            remoteWork: true
          }
        };

        const result = service.calculateProfileCompletion(profile);
        expect(result).toBe(100);
      });

      it('should calculate 50% completion for partial profile', () => {
        const profile = {
          skills: ['JavaScript'],
          experience: 'Test experience',
          preferences: {
            jobTypes: [],
            locations: [],
            remoteWork: false
          }
        };

        const result = service.calculateProfileCompletion(profile);
        expect(result).toBe(50);
      });

      it('should calculate 0% completion for empty profile', () => {
        const profile = {
          skills: [],
          experience: '',
          preferences: {
            jobTypes: [],
            locations: [],
            remoteWork: false
          }
        };

        const result = service.calculateProfileCompletion(profile);
        expect(result).toBe(0);
      });
    });

    describe('getMatchScoreColor', () => {
      it('should return green for excellent scores', () => {
        expect(service.getMatchScoreColor(85)).toBe('text-green-600');
      });

      it('should return blue for good scores', () => {
        expect(service.getMatchScoreColor(65)).toBe('text-blue-600');
      });

      it('should return yellow for fair scores', () => {
        expect(service.getMatchScoreColor(45)).toBe('text-yellow-600');
      });

      it('should return red for poor scores', () => {
        expect(service.getMatchScoreColor(25)).toBe('text-red-600');
      });
    });

    describe('getMatchScoreLabel', () => {
      it('should return correct labels for different score ranges', () => {
        expect(service.getMatchScoreLabel(85)).toBe('Excellent Match');
        expect(service.getMatchScoreLabel(65)).toBe('Good Match');
        expect(service.getMatchScoreLabel(45)).toBe('Fair Match');
        expect(service.getMatchScoreLabel(25)).toBe('Poor Match');
      });
    });

    describe('validateProfileData', () => {
      it('should return no errors for valid profile data', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: 'Test experience',
          preferences: {
            jobTypes: ['Developer'],
            locations: ['SF'],
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toEqual([]);
      });

      it('should return errors for missing skills', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: [],
          experience: 'Test experience',
          preferences: {
            jobTypes: ['Developer'],
            locations: ['SF'],
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toContain('At least one skill is required');
      });

      it('should return errors for missing experience', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: '',
          preferences: {
            jobTypes: ['Developer'],
            locations: ['SF'],
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toContain('Experience description is required');
      });

      it('should return errors for missing job types', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: 'Test',
          preferences: {
            jobTypes: [],
            locations: ['SF'],
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toContain('At least one job type preference is required');
      });

      it('should return errors for missing locations when remote work is disabled', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: 'Test',
          preferences: {
            jobTypes: ['Developer'],
            locations: [],
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toContain('Either specify locations or enable remote work preference');
      });

      it('should not return location errors when remote work is enabled', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: 'Test',
          preferences: {
            jobTypes: ['Developer'],
            locations: [],
            remoteWork: true
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).not.toContain('Either specify locations or enable remote work preference');
      });

      it('should return errors for invalid salary range', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: 'Test',
          preferences: {
            jobTypes: ['Developer'],
            locations: ['SF'],
            salaryRange: { min: 100000, max: 80000 }, // Invalid: min > max
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toContain('Minimum salary must be less than maximum salary');
      });

      it('should return errors for negative salary values', () => {
        const profileData = {
          userId: 1,
          referralId: 1,
          skills: ['JavaScript'],
          experience: 'Test',
          preferences: {
            jobTypes: ['Developer'],
            locations: ['SF'],
            salaryRange: { min: -1000, max: 80000 },
            remoteWork: false
          }
        };

        const errors = service.validateProfileData(profileData);
        expect(errors).toContain('Salary values must be positive');
      });
    });

    describe('getFeedbackTypeLabel', () => {
      it('should return correct labels for feedback types', () => {
        expect(service.getFeedbackTypeLabel('declined_referral')).toBe('Declined Referral');
        expect(service.getFeedbackTypeLabel('interview_feedback')).toBe('Interview Feedback');
        expect(service.getFeedbackTypeLabel('general')).toBe('General Feedback');
        expect(service.getFeedbackTypeLabel('unknown')).toBe('unknown');
      });
    });

    describe('formatEngagementRate', () => {
      it('should format engagement rate with one decimal place', () => {
        expect(service.formatEngagementRate(75.6789)).toBe('75.7%');
        expect(service.formatEngagementRate(100)).toBe('100.0%');
        expect(service.formatEngagementRate(0)).toBe('0.0%');
      });
    });
  });
});