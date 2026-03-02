import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import referralsRouter from './referrals.js';
import { ReferralStatus } from '../../shared/referrals.js';

// Mock the services
vi.mock('../services/referralService.js', () => ({
  ReferralService: vi.fn().mockImplementation(() => ({
    createReferral: vi.fn(),
    getReferralsByUser: vi.fn(),
    updateReferralStatus: vi.fn(),
    getReferralStats: vi.fn(),
    getReferralById: vi.fn(),
    getReferralStatusHistory: vi.fn(),
  }))
}));

vi.mock('../services/rewardEngine.js', () => ({
  RewardEngine: vi.fn().mockImplementation(() => ({}))
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/referrals', referralsRouter);
  return app;
};

// Mock auth token
const mockAuthToken = 'Bearer mock-token';

describe('Referrals API Routes', () => {
  let app: express.Application;
  let mockReferralService: any;

  beforeEach(() => {
    app = createTestApp();
    // Get the mocked service instance
    const { ReferralService } = require('../services/referralService.js');
    mockReferralService = new ReferralService();
    vi.clearAllMocks();
  });

  describe('POST /api/referrals', () => {
    const validReferralData = {
      refereeEmail: 'john.doe@example.com',
      refereeName: 'Alex Morgan',
      positionTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      personalMessage: 'Great opportunity for you!',
      rewardAmount: 50
    };

    it('should create a referral successfully', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'john.doe@example.com',
        refereeName: 'Alex Morgan',
        positionTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        status: ReferralStatus.PENDING,
        personalMessage: 'Great opportunity for you!',
        rewardAmount: 50,
        referralToken: 'ref_123456789',
        expiresAt: '2024-02-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockReferralService.createReferral.mockResolvedValue(mockReferral);

      const response = await request(app)
        .post('/api/referrals')
        .set('Authorization', mockAuthToken)
        .send(validReferralData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReferral);
      expect(mockReferralService.createReferral).toHaveBeenCalledWith(1, validReferralData);
    });

    it('should return 401 when no auth token provided', async () => {
      const response = await request(app)
        .post('/api/referrals')
        .send(validReferralData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 400 for invalid email', async () => {
      const invalidData = { ...validReferralData, refereeEmail: 'invalid-email' };

      const response = await request(app)
        .post('/api/referrals')
        .set('Authorization', mockAuthToken)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.refereeEmail).toBe('Invalid email format');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { refereeEmail: 'john@example.com' };

      const response = await request(app)
        .post('/api/referrals')
        .set('Authorization', mockAuthToken)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockReferralService.createReferral.mockRejectedValue(new Error('Duplicate referral'));

      const response = await request(app)
        .post('/api/referrals')
        .set('Authorization', mockAuthToken)
        .send(validReferralData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Duplicate referral');
    });
  });

  describe('GET /api/referrals', () => {
    it('should get user referrals successfully', async () => {
      const mockReferrals = [
        {
          id: 1,
          referrerId: 1,
          refereeEmail: 'john@example.com',
          refereeName: 'Alex Morgan',
          positionTitle: 'Software Engineer',
          companyName: 'Tech Corp',
          status: ReferralStatus.PENDING,
          rewardAmount: 30,
          referralToken: 'ref_123',
          expiresAt: '2024-02-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockReferralService.getReferralsByUser.mockReturnValue({
        referrals: mockReferrals,
        total: 1
      });

      const response = await request(app)
        .get('/api/referrals')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.referrals).toEqual(mockReferrals);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.hasMore).toBe(false);
    });

    it('should handle filtering by status', async () => {
      mockReferralService.getReferralsByUser.mockReturnValue({
        referrals: [],
        total: 0
      });

      const response = await request(app)
        .get('/api/referrals?status=pending&status=contacted')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(200);
      expect(mockReferralService.getReferralsByUser).toHaveBeenCalledWith(1, {
        status: ['pending', 'contacted']
      });
    });

    it('should handle pagination', async () => {
      mockReferralService.getReferralsByUser.mockReturnValue({
        referrals: [],
        total: 50
      });

      const response = await request(app)
        .get('/api/referrals?limit=10&offset=20')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(200);
      expect(mockReferralService.getReferralsByUser).toHaveBeenCalledWith(1, {
        limit: 10,
        offset: 20
      });
    });

    it('should return 401 when no auth token provided', async () => {
      const response = await request(app).get('/api/referrals');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('PUT /api/referrals/:id/status', () => {
    it('should update referral status successfully', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'john@example.com',
        refereeName: 'Alex Morgan',
        positionTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        status: ReferralStatus.CONTACTED,
        rewardAmount: 30,
        referralToken: 'ref_123',
        expiresAt: '2024-02-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockReferralService.getReferralById.mockReturnValue(mockReferral);
      mockReferralService.updateReferralStatus.mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/referrals/1/status')
        .set('Authorization', mockAuthToken)
        .send({ status: ReferralStatus.CONTACTED, notes: 'Contacted via email' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockReferralService.updateReferralStatus).toHaveBeenCalledWith(
        1,
        ReferralStatus.CONTACTED,
        1,
        'Contacted via email'
      );
    });

    it('should return 400 for invalid referral ID', async () => {
      const response = await request(app)
        .put('/api/referrals/invalid/status')
        .set('Authorization', mockAuthToken)
        .send({ status: ReferralStatus.CONTACTED });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid referral ID');
    });

    it('should return 403 when user does not own referral', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 2, // Different user
        status: ReferralStatus.PENDING
      };

      mockReferralService.getReferralById.mockReturnValue(mockReferral);

      const response = await request(app)
        .put('/api/referrals/1/status')
        .set('Authorization', mockAuthToken)
        .send({ status: ReferralStatus.CONTACTED });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/api/referrals/1/status')
        .set('Authorization', mockAuthToken)
        .send({ status: 'invalid-status' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /api/referrals/stats', () => {
    it('should get user referral statistics successfully', async () => {
      const mockStats = {
        totalReferrals: 10,
        pendingReferrals: 3,
        contactedReferrals: 2,
        interviewedReferrals: 1,
        successfulReferrals: 2,
        rejectedReferrals: 2,
        expiredReferrals: 0,
        totalEarnings: 60,
        pendingRewards: 30,
        paidRewards: 30,
        conversionRate: 20,
        averageTimeToHire: 14
      };

      mockReferralService.getReferralStats.mockReturnValue(mockStats);

      const response = await request(app)
        .get('/api/referrals/stats')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(mockReferralService.getReferralStats).toHaveBeenCalledWith(1);
    });

    it('should return 401 when no auth token provided', async () => {
      const response = await request(app).get('/api/referrals/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Authentication required');
    });
  });

  describe('GET /api/referrals/:id', () => {
    it('should get specific referral successfully', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 1,
        refereeEmail: 'john@example.com',
        refereeName: 'Alex Morgan',
        positionTitle: 'Software Engineer',
        companyName: 'Tech Corp',
        status: ReferralStatus.PENDING,
        rewardAmount: 30,
        referralToken: 'ref_123',
        expiresAt: '2024-02-01T00:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };

      mockReferralService.getReferralById.mockReturnValue(mockReferral);

      const response = await request(app)
        .get('/api/referrals/1')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReferral);
    });

    it('should return 403 when user does not own referral', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 2, // Different user
        status: ReferralStatus.PENDING
      };

      mockReferralService.getReferralById.mockReturnValue(mockReferral);

      const response = await request(app)
        .get('/api/referrals/1')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should return 404 when referral not found', async () => {
      mockReferralService.getReferralById.mockImplementation(() => {
        throw new Error('Referral not found');
      });

      const response = await request(app)
        .get('/api/referrals/999')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Referral not found');
    });
  });

  describe('GET /api/referrals/:id/history', () => {
    it('should get referral status history successfully', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 1,
        status: ReferralStatus.CONTACTED
      };

      const mockHistory = [
        {
          id: 1,
          referralId: 1,
          previousStatus: null,
          newStatus: ReferralStatus.PENDING,
          changedByUserId: 1,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          referralId: 1,
          previousStatus: ReferralStatus.PENDING,
          newStatus: ReferralStatus.CONTACTED,
          changedByUserId: 1,
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      mockReferralService.getReferralById.mockReturnValue(mockReferral);
      mockReferralService.getReferralStatusHistory.mockReturnValue(mockHistory);

      const response = await request(app)
        .get('/api/referrals/1/history')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
    });

    it('should return 403 when user does not own referral', async () => {
      const mockReferral = {
        id: 1,
        referrerId: 2, // Different user
        status: ReferralStatus.PENDING
      };

      mockReferralService.getReferralById.mockReturnValue(mockReferral);

      const response = await request(app)
        .get('/api/referrals/1/history')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors', async () => {
      mockReferralService.getReferralsByUser.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/referrals')
        .set('Authorization', mockAuthToken);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
     