import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import referralsRouter from './referrals.js';
import { ReferralService } from '../services/referralService.js';

// Mock the ReferralService
vi.mock('../services/referralService.js');

const app = express();
app.use(express.json());
app.use('/api/referrals', referralsRouter);

describe('Referee API Endpoints', () => {
  let mockReferralService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReferralService = vi.mocked(ReferralService).prototype;
  });

  describe('GET /api/referrals/referee/:token', () => {
    const mockReferralDetails = {
      id: 1,
      refereeName: 'Alex Morgan',
      referrerName: 'Jane Smith',
      positionTitle: 'Software Engineer',
      companyName: 'Tech Corp',
      personalMessage: 'Perfect fit for this role!',
      rewardAmount: 30,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    };

    it('should return referral details for valid token', async () => {
      mockReferralService.getReferralByToken.mockResolvedValue(mockReferralDetails);

      const response = await request(app)
        .get('/api/referrals/referee/valid-token-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReferralDetails);
      expect(mockReferralService.getReferralByToken).toHaveBeenCalledWith('valid-token-123');
    });

    it('should return 404 for invalid token', async () => {
      mockReferralService.getReferralByToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get('/api/referrals/referee/invalid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Referral not found or invalid token');
    });

    it('should return 410 for expired referral', async () => {
      mockReferralService.getReferralByToken.mockRejectedValue(new Error('Referral expired'));

      const response = await request(app)
        .get('/api/referrals/referee/expired-token')
        .expect(410);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('This referral has expired');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .get('/api/referrals/referee/')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should handle service errors gracefully', async () => {
      mockReferralService.getReferralByToken.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/referrals/referee/some-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/referrals/referee/:token/respond', () => {
    const validInterestedResponse = {
      action: 'interested',
      feedback: 'Very interested in this opportunity!',
      createAccount: false
    };

    const validDeclinedResponse = {
      action: 'declined',
      feedback: 'Not looking for new opportunities right now'
    };

    const validAccountCreationResponse = {
      action: 'interested',
      createAccount: true,
      accountData: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        linkedinUrl: 'https://linkedin.com/in/johndoe'
      }
    };

    const mockProcessResult = {
      referralId: 1,
      status: 'contacted',
      accountCreated: false,
      userId: null
    };

    it('should process interested response successfully', async () => {
      mockReferralService.processRefereeResponse.mockResolvedValue(mockProcessResult);

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(validInterestedResponse)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockProcessResult);
      expect(mockReferralService.processRefereeResponse).toHaveBeenCalledWith(
        'valid-token',
        validInterestedResponse
      );
    });

    it('should process declined response successfully', async () => {
      const declinedResult = { ...mockProcessResult, status: 'declined' };
      mockReferralService.processRefereeResponse.mockResolvedValue(declinedResult);

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(validDeclinedResponse)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(declinedResult);
    });

    it('should process account creation response successfully', async () => {
      const accountCreationResult = { ...mockProcessResult, accountCreated: true, userId: 123 };
      mockReferralService.processRefereeResponse.mockResolvedValue(accountCreationResult);

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(validAccountCreationResponse)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(accountCreationResult);
    });

    it('should validate required action field', async () => {
      const invalidResponse = {
        feedback: 'Some feedback'
        // Missing action field
      };

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(invalidResponse)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveProperty('action');
    });

    it('should validate action field values', async () => {
      const invalidResponse = {
        action: 'maybe' // Invalid action
      };

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(invalidResponse)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveProperty('action');
    });

    it('should validate feedback length', async () => {
      const invalidResponse = {
        action: 'interested',
        feedback: 'x'.repeat(1001) // Too long
      };

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(invalidResponse)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveProperty('feedback');
    });

    it('should validate account data when createAccount is true', async () => {
      const invalidResponse = {
        action: 'interested',
        createAccount: true
        // Missing accountData
      };

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(invalidResponse)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account data is required when creating an account');
    });

    it('should validate account data fields', async () => {
      const invalidResponse = {
        action: 'interested',
        createAccount: true,
        accountData: {
          firstName: '', // Empty required field
          lastName: 'Doe',
          linkedinUrl: 'not-a-url' // Invalid URL
        }
      };

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(invalidResponse)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toHaveProperty('accountData.firstName');
      expect(response.body.details).toHaveProperty('accountData.linkedinUrl');
    });

    it('should return 404 for invalid token', async () => {
      mockReferralService.processRefereeResponse.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/referrals/referee/invalid-token/respond')
        .send(validInterestedResponse)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Referral not found or invalid token');
    });

    it('should return 410 for expired referral', async () => {
      mockReferralService.processRefereeResponse.mockRejectedValue(new Error('Referral expired'));

      const response = await request(app)
        .post('/api/referrals/referee/expired-token/respond')
        .send(validInterestedResponse)
        .expect(410);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('This referral has expired');
    });

    it('should return 409 for already submitted response', async () => {
      mockReferralService.processRefereeResponse.mockRejectedValue(new Error('Response already submitted'));

      const response = await request(app)
        .post('/api/referrals/referee/already-responded-token/respond')
        .send(validInterestedResponse)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Response has already been submitted for this referral');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/referrals/referee//respond')
        .send(validInterestedResponse)
        .expect(404); // Express returns 404 for missing route params
    });

    it('should handle service errors gracefully', async () => {
      mockReferralService.processRefereeResponse.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/referrals/referee/some-token/respond')
        .send(validInterestedResponse)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle optional fields correctly', async () => {
      const minimalResponse = {
        action: 'interested'
      };

      mockReferralService.processRefereeResponse.mockResolvedValue(mockProcessResult);

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(minimalResponse)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockReferralService.processRefereeResponse).toHaveBeenCalledWith(
        'valid-token',
        minimalResponse
      );
    });

    it('should handle account data with optional fields', async () => {
      const responseWithPartialAccountData = {
        action: 'interested',
        createAccount: true,
        accountData: {
          firstName: 'John',
          lastName: 'Doe'
          // phone and linkedinUrl are optional
        }
      };

      mockReferralService.processRefereeResponse.mockResolvedValue({
        ...mockProcessResult,
        accountCreated: true,
        userId: 123
      });

      const response = await request(app)
        .post('/api/referrals/referee/valid-token/respond')
        .send(responseWithPartialAccountData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});