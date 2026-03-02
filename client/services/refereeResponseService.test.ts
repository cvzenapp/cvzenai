import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RefereeResponseService } from './refereeResponseService';

// Mock fetch
global.fetch = vi.fn();

describe('RefereeResponseService', () => {
  let service: RefereeResponseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RefereeResponseService();
  });

  describe('getReferralByToken', () => {
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
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReferralDetails
        })
      });

      const result = await service.getReferralByToken('valid-token');

      expect(fetch).toHaveBeenCalledWith('/api/referrals/referee/valid-token');
      expect(result).toEqual(mockReferralDetails);
    });

    it('should throw error for invalid token', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Referral not found'
        })
      });

      await expect(service.getReferralByToken('invalid-token'))
        .rejects.toThrow('Referral not found');
    });

    it('should throw error for network failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getReferralByToken('some-token'))
        .rejects.toThrow('Network error');
    });

    it('should handle missing error message', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false
        })
      });

      await expect(service.getReferralByToken('invalid-token'))
        .rejects.toThrow('Failed to load referral details');
    });
  });

  describe('submitResponse', () => {
    const mockResponseResult = {
      referralId: 1,
      status: 'contacted',
      accountCreated: false
    };

    const interestedResponse = {
      action: 'interested' as const,
      feedback: 'Very interested!',
      createAccount: false
    };

    const declinedResponse = {
      action: 'declined' as const,
      feedback: 'Not looking right now'
    };

    const accountCreationResponse = {
      action: 'interested' as const,
      createAccount: true,
      accountData: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        linkedinUrl: 'https://linkedin.com/in/johndoe'
      }
    };

    it('should submit interested response successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponseResult
        })
      });

      const result = await service.submitResponse('valid-token', interestedResponse);

      expect(fetch).toHaveBeenCalledWith('/api/referrals/referee/valid-token/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interestedResponse)
      });
      expect(result).toEqual(mockResponseResult);
    });

    it('should submit declined response successfully', async () => {
      const declinedResult = { ...mockResponseResult, status: 'declined' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: declinedResult
        })
      });

      const result = await service.submitResponse('valid-token', declinedResponse);

      expect(result).toEqual(declinedResult);
    });

    it('should submit account creation response successfully', async () => {
      const accountResult = { ...mockResponseResult, accountCreated: true, userId: 123 };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: accountResult
        })
      });

      const result = await service.submitResponse('valid-token', accountCreationResponse);

      expect(result).toEqual(accountResult);
    });

    it('should throw error for invalid response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid response data'
        })
      });

      await expect(service.submitResponse('valid-token', interestedResponse))
        .rejects.toThrow('Invalid response data');
    });

    it('should throw error for expired referral', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'This referral has expired'
        })
      });

      await expect(service.submitResponse('expired-token', interestedResponse))
        .rejects.toThrow('This referral has expired');
    });

    it('should throw error for already submitted response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Response has already been submitted for this referral'
        })
      });

      await expect(service.submitResponse('responded-token', interestedResponse))
        .rejects.toThrow('Response has already been submitted for this referral');
    });

    it('should handle network failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.submitResponse('some-token', interestedResponse))
        .rejects.toThrow('Network error');
    });

    it('should handle missing error message', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false
        })
      });

      await expect(service.submitResponse('invalid-token', interestedResponse))
        .rejects.toThrow('Failed to submit response');
    });

    it('should handle minimal response data', async () => {
      const minimalResponse = {
        action: 'interested' as const
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockResponseResult
        })
      });

      const result = await service.submitResponse('valid-token', minimalResponse);

      expect(fetch).toHaveBeenCalledWith('/api/referrals/referee/valid-token/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalResponse)
      });
      expect(result).toEqual(mockResponseResult);
    });
  });
});