import { BaseApiClient } from './baseApiClient';
import type { PaymentInitiateResponse, PaymentVerifyResponse, PaymentTransaction } from '@shared/payment';

class PaymentApiClient extends BaseApiClient {
  /**
   * Initiate payment for a subscription plan
   */
  async initiatePayment(planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<PaymentInitiateResponse> {
    const response = await this.post<PaymentInitiateResponse>('/payment/initiate', {
      planId,
      billingCycle
    });
    return response;
  }

  /**
   * Verify payment status
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerifyResponse> {
    const response = await this.get<PaymentVerifyResponse>(`/payment/verify/${transactionId}`);
    return response;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<{ success: boolean; transactions: PaymentTransaction[] }> {
    const response = await this.get<{ success: boolean; transactions: PaymentTransaction[] }>('/payment/history');
    return response;
  }
}

export const paymentApi = new PaymentApiClient();
