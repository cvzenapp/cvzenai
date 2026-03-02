/**
 * Service for handling referee responses
 */

export interface ReferralDetails {
  id: number;
  refereeName: string;
  referrerName: string;
  positionTitle: string;
  companyName: string;
  personalMessage?: string;
  rewardAmount: number;
  expiresAt: string;
  status: string;
}

export interface RefereeResponseData {
  action: 'interested' | 'declined';
  feedback?: string;
  createAccount?: boolean;
  accountData?: {
    firstName: string;
    lastName: string;
    phone?: string;
    linkedinUrl?: string;
  };
}

export interface RefereeResponseResult {
  referralId: number;
  status: string;
  accountCreated: boolean;
  userId?: number;
}

export class RefereeResponseService {
  /**
   * Get referral details by token
   */
  async getReferralByToken(token: string): Promise<ReferralDetails> {
    const response = await fetch(`/api/referrals/referee/${token}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to load referral details');
    }

    return data.data;
  }

  /**
   * Submit referee response
   */
  async submitResponse(token: string, responseData: RefereeResponseData): Promise<RefereeResponseResult> {
    const response = await fetch(`/api/referrals/referee/${token}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to submit response');
    }

    return data.data;
  }
}