/**
 * Referral Analytics API Routes Tests
 * Tests for analytics API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import referralAnalyticsRouter from './referralAnalytics.js';
import { ReferralStatus } from '../../shared/referrals.js';

// Mock the analytics service
vi.mock('../services/referralAnalyticsService.js', () => ({
  ReferralAnalyticsService: vi.fn().mockImplementation(() => ({
    getReferralAnalytics: vi.fn(),
    getConversionFunnel: vi.fn(),
    getTopReferrers: vi.fn(),
    getRealTimeAnalytics: vi.fn(),
    exportReferralData: vi.fn()
  }))
}));

describe('Referral Analytics API Routes', () => {
  let app: express.Application;
  let mockAnalyticsService: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      (req as any).user = { id: 1, role: 'admin' };
      next();
    });

    app.use('/api/analytics', referralAnalyticsRouter);

    // Get the mocked service instance
    const { ReferralAnalyticsService } = await import('../services/referralAnalyticsService.js');
    mockAnalyticsService = new ReferralAnalyticsService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/analytics/referrals', () => {
    it('should return referral analytics data', async () => {
      const mockAnalytics = {
        totalReferrals: 100,
        conversionRate: 25,
        totalRewards: 750,
        averageRewardAmount: 30,
        referralsByStatus: {
          pending: 30,
          contacted: 20,
          interviewed: 15,
          hired: 25,
          rejected: 10
        },
        monthlyTrends: [],
        topPerformingCompanies: [],
        averageTimeToHire: 18.5
      };

      mockAnalyticsService.getReferralAnalytics.mockReturnValue(mockAnalytics);

      const response = await request(app)
        .get('/api/analytics/referrals')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(mockAnalyticsService.getReferralAnalytics).toHaveBeenCalledWith({});
    });

    it('should apply filters from query parameters', async () => {
      const mockAnalytics = { totalReferrals: 50 };
      mockAnalyticsService.getReferralAnalytics.mockReturnValue(mockAnalytics);

      await request(app)
        .get('/api/analytics/referrals')
        .query({
          dateFrom: '2024-01-01T00:00:00.000Z',
          dateTo: '2024-12-31T23:59:59.999Z',
          companyName: 'Tech Corp',
          status: ['hired', 'pending']
        })
        .expect(200);

      expect(mockAnalyticsService.getReferralAnalytics).toHaveBeenCalledWith({
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-12-31T23:59:59.999Z',
        companyName: 'Tech Corp',
        status: ['hired', 'pending']
      });
    });

    it('should return 400 for invalid filter parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/referrals')
        .query({
          dateFrom: 'invalid-date'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid filter parameters');
    });

    it('should return 403 for non-admin users', async () => {
      // Override middleware for this test
      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, res, next) => {
        (req as any).user = { id: 1, role: 'user' };
        next();
      });
      testApp.use('/api/analytics', referralAnalyticsRouter);

      const response = await request(testApp)
        .get('/api/analytics/referrals')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should handle service errors', async () => {
      mockAnalyticsService.getReferralAnalytics.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/analytics/referrals')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve analytics');
    });
  });

  describe('GET /api/analytics/conversion-funnel', () => {
    it('should return conversion funnel data', async () => {
      const mockFunnel = {
        pending: { count: 100, percentage: 40 },
        contacted: { count: 80, percentage: 32, dropOffFromPrevious: 20 },
        interviewed: { count: 60, percentage: 24, dropOffFromPrevious: 25 },
        hired: { count: 30, percentage: 12, dropOffFromPrevious: 50 },
        rejected: { count: 20, percentage: 8 },
        expired: { count: 10, percentage: 4 },
        declined: { count: 5, percentage: 2 }
      };

      mockAnalyticsService.getConversionFunnel.mockReturnValue(mockFunnel);

      const response = await request(app)
        .get('/api/analytics/conversion-funnel')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockFunnel);
    });

    it('should apply filters to conversion funnel', async () => {
      const mockFunnel = { pending: { count: 50, percentage: 50 } };
      mockAnalyticsService.getConversionFunnel.mockReturnValue(mockFunnel);

      await request(app)
        .get('/api/analytics/conversion-funnel')
        .query({ companyName: 'Tech Corp' })
        .expect(200);

      expect(mockAnalyticsService.getConversionFunnel).toHaveBeenCalledWith({
        companyName: 'Tech Corp'
      });
    });
  });

  describe('GET /api/analytics/top-referrers', () => {
    it('should return top referrers leaderboard', async () => {
      const mockTopReferrers = [
        {
          userId: 1,
          userName: 'Alex Morgan',
          userEmail: 'john@example.com',
          totalReferrals: 20,
          successfulReferrals: 8,
          conversionRate: 40,
          totalEarnings: 240,
          pendingRewards: 60,
          paidRewards: 180,
          averageRewardAmount: 30,
          lastReferralDate: '2024-01-15'
        }
      ];

      mockAnalyticsService.getTopReferrers.mockReturnValue(mockTopReferrers);

      const response = await request(app)
        .get('/api/analytics/top-referrers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTopReferrers);
      expect(mockAnalyticsService.getTopReferrers).toHaveBeenCalledWith(10, {});
    });

    it('should respect limit parameter', async () => {
      mockAnalyticsService.getTopReferrers.mockReturnValue([]);

      await request(app)
        .get('/api/analytics/top-referrers')
        .query({ limit: 5 })
        .expect(200);

      expect(mockAnalyticsService.getTopReferrers).toHaveBeenCalledWith(5, {});
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/top-referrers')
        .query({ limit: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid parameters');
    });
  });

  describe('GET /api/analytics/real-time', () => {
    it('should return real-time analytics data', async () => {
      const mockRealTimeData = {
        totalReferralsToday: 5,
        totalReferralsThisWeek: 25,
        totalReferralsThisMonth: 100,
        pendingReferrals: 30,
        recentActivity: [
          {
            id: 1,
            referee_name: 'Alex Morgan',
            position_title: 'Developer',
            company_name: 'Tech Corp',
            status: 'hired',
            created_at: '2024-01-01',
            updated_at: '2024-01-15',
            referrer_name: 'Jane Smith'
          }
        ]
      };

      mockAnalyticsService.getRealTimeAnalytics.mockReturnValue(mockRealTimeData);

      const response = await request(app)
        .get('/api/analytics/real-time')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRealTimeData);
    });
  });

  describe('GET /api/analytics/export', () => {
    it('should export data in JSON format', async () => {
      const mockExportData = {
        referrals: [
          {
            id: 1,
            referrer_name: 'Alex Morgan',
            referee_name: 'Jane Smith',
            status: 'hired'
          }
        ],
        summary: { totalReferrals: 1 },
        exportedAt: '2024-01-01T00:00:00.000Z',
        filters: {}
      };

      mockAnalyticsService.exportReferralData.mockReturnValue(mockExportData);

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'json' })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.body).toEqual(mockExportData);
    });

    it('should export data in CSV format', async () => {
      const mockExportData = {
        referrals: [
          {
            id: 1,
            referrer_name: 'Alex Morgan',
            referrer_email: 'john@example.com',
            referee_name: 'Jane Smith',
            referee_email: 'jane@example.com',
            position_title: 'Developer',
            company_name: 'Tech Corp',
            status: 'hired',
            reward_amount: 30,
            reward_status: 'paid',
            created_at: '2024-01-01',
            updated_at: '2024-01-15',
            reward_paid_at: '2024-01-20'
          }
        ],
        summary: { totalReferrals: 1 },
        exportedAt: '2024-01-01T00:00:00.000Z',
        filters: {}
      };

      mockAnalyticsService.exportReferralData.mockReturnValue(mockExportData);

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'csv' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.text).toContain('ID,Referrer Name,Referrer Email');
      expect(response.text).toContain('1,"Alex Morgan","john@example.com"');
    });

    it('should default to JSON format', async () => {
      const mockExportData = { referrals: [], summary: {}, exportedAt: '', filters: {} };
      mockAnalyticsService.exportReferralData.mockReturnValue(mockExportData);

      const response = await request(app)
        .get('/api/analytics/export')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(mockAnalyticsService.exportReferralData).toHaveBeenCalledWith('json', {});
    });
  });

  describe('GET /api/analytics/dashboard-summary', () => {
    it('should return comprehensive dashboard summary', async () => {
      const mockRealTimeData = { totalReferralsToday: 5 };
      const mockOverallAnalytics = { totalReferrals: 100 };
      const mockConversionFunnel = { pending: { count: 30 } };
      const mockTopReferrers = [{ userId: 1, userName: 'Alex Morgan' }];

      mockAnalyticsService.getRealTimeAnalytics.mockReturnValue(mockRealTimeData);
      mockAnalyticsService.getReferralAnalytics.mockReturnValue(mockOverallAnalytics);
      mockAnalyticsService.getConversionFunnel.mockReturnValue(mockConversionFunnel);
      mockAnalyticsService.getTopReferrers.mockReturnValue(mockTopReferrers);

      const response = await request(app)
        .get('/api/analytics/dashboard-summary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.realTime).toEqual(mockRealTimeData);
      expect(response.body.data.overall).toEqual(mockOverallAnalytics);
      expect(response.body.data.conversionFunnel).toEqual(mockConversionFunnel);
      expect(response.body.data.topReferrers).toEqual(mockTopReferrers);

      expect(mockAnalyticsService.getTopReferrers).toHaveBeenCalledWith(5);
    });
  });

  describe('CSV conversion', () => {
    it('should handle empty data', async () => {
      const mockExportData = {
        referrals: [],
        summary: {},
        exportedAt: '',
        filters: {}
      };

      mockAnalyticsService.exportReferralData.mockReturnValue(mockExportData);

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'csv' })
        .expect(200);

      expect(response.text).toBe('');
    });

    it('should properly escape CSV fields with quotes', async () => {
      const mockExportData = {
        referrals: [
          {
            id: 1,
            referrer_name: 'John "Johnny" Doe',
            referrer_email: 'john@example.com',
            referee_name: 'Jane Smith',
            referee_email: 'jane@example.com',
            position_title: 'Senior Developer, Team Lead',
            company_name: 'Tech Corp',
            status: 'hired',
            reward_amount: 30,
            reward_status: 'paid',
            created_at: '2024-01-01',
            updated_at: '2024-01-15',
            reward_paid_at: '2024-01-20'
          }
        ],
        summary: {},
        exportedAt: '',
        filters: {}
      };

      mockAnalyticsService.exportReferralData.mockReturnValue(mockExportData);

      const response = await request(app)
        .get('/api/analytics/export')
        .query({ format: 'csv' })
        .expect(200);

      expect(response.text).toContain('"John "Johnny" Doe"');
      expect(response.text).toContain('"Senior Developer, Team Lead"');
    });
  });

  describe('authentication and authorization', () => {
    it('should require authentication', async () => {
      const testApp = express();
      testApp.use(express.json());
      // No auth middleware
      testApp.use('/api/analytics', referralAnalyticsRouter);

      const response = await request(testApp)
        .get('/api/analytics/referrals')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should require admin role', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, res, next) => {
        (req as any).user = { id: 1, role: 'user' };
        next();
      });
      testApp.use('/api/analytics', referralAnalyticsRouter);

      const response = await request(testApp)
        .get('/api/analytics/referrals')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Admin access required');
    });

    it('should allow admin access', async () => {
      mockAnalyticsService.getReferralAnalytics.mockReturnValue({ totalReferrals: 0 });

      const response = await request(app)
        .get('/api/analytics/referrals')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockAnalyticsService.getRealTimeAnalytics.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const response = await request(app)
        .get('/api/analytics/real-time')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to retrieve real-time analytics');
    });

    it('should handle export errors', async () => {
      mockAnalyticsService.exportReferralData.mockImplementation(() => {
        throw new Error('Export failed');
      });

      const response = await request(app)
        .get('/api/analytics/export')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to export data');
    });
  });
});