import { BaseApiClient } from './baseApiClient';
import type { PaymentHistory, Invoice, PaymentSummary, SubscriptionWithDetails } from '@shared/payment';

class PaymentHistoryApi extends BaseApiClient {
  // Company payment history
  async getCompanyPaymentHistory(companyId: string): Promise<PaymentHistory[]> {
    const response = await this.get<PaymentHistory[]>(`/api/payment-history/company/${companyId}`);
    return response.data || [];
  }

  async getCompanyInvoices(companyId: string): Promise<Invoice[]> {
    const response = await this.get<Invoice[]>(`/api/payment-history/company/${companyId}/invoices`);
    return response.data || [];
  }

  // User payment history
  async getUserPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    const response = await this.get<PaymentHistory[]>(`/api/payment-history/user/${userId}`);
    return response.data || [];
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    const response = await this.get<Invoice[]>(`/api/payment-history/user/${userId}/invoices`);
    return response.data || [];
  }

  // Subscription details
  async getPaymentSummary(subscriptionId: string): Promise<PaymentSummary> {
    const response = await this.get<PaymentSummary>(
      `/api/payment-history/subscription/${subscriptionId}/summary`
    );
    return response.data!;
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionWithDetails> {
    const response = await this.get<SubscriptionWithDetails>(
      `/api/payment-history/subscription/${subscriptionId}/details`
    );
    return response.data!;
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const response = await this.get<Invoice>(`/api/payment-history/invoice/${invoiceId}`);
    return response.data!;
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await fetch(`/api/payment-history/invoice/${invoiceId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }
    
    return response.blob();
  }
}

export const paymentHistoryApi = new PaymentHistoryApi();
