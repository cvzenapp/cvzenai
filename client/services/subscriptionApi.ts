import { BaseApiClient } from './baseApiClient';
import type { 
  CompanySubscription, 
  UserSubscription, 
  SubscriptionUsage,
  SubscriptionPlan 
} from '@shared/subscription';

class SubscriptionApi extends BaseApiClient {
  // Company subscriptions
  async getCompanySubscription(companyId: string): Promise<CompanySubscription | null> {
    const response = await this.get<CompanySubscription>(`/subscriptions/company/${companyId}`);
    return response.data || null;
  }

  async createCompanySubscription(data: {
    companyId: string;
    planId: string;
    billingCycle: 'monthly' | 'yearly';
  }): Promise<{ subscription: CompanySubscription; paymentUrl?: string }> {
    const response = await this.post<{ subscription: CompanySubscription; paymentUrl?: string }>(
      '/subscriptions/company',
      data
    );
    return response.data!;
  }

  async upgradeCompanySubscription(companyId: string, planId: string): Promise<CompanySubscription> {
    const response = await this.post<CompanySubscription>(
      `/subscriptions/company/${companyId}/upgrade`,
      { planId }
    );
    return response.data!;
  }

  async cancelCompanySubscription(companyId: string): Promise<CompanySubscription> {
    const response = await this.post<CompanySubscription>(
      `/subscriptions/company/${companyId}/cancel`,
      {}
    );
    return response.data!;
  }

  async getCompanyUsage(companyId: string): Promise<SubscriptionUsage[]> {
    const response = await this.get<SubscriptionUsage[]>(
      `/subscriptions/company/${companyId}/usage`
    );
    return response.data || [];
  }

  // User subscriptions
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const response = await this.get<UserSubscription>(`/subscriptions/user/${userId}`);
    return response.data || null;
  }

  async createUserSubscription(data: {
    userId: string;
    planId: string;
    billingCycle: 'monthly' | 'yearly';
  }): Promise<{ subscription?: UserSubscription; paymentUrl?: string; transactionId?: string }> {
    const response = await this.post<{ subscription?: UserSubscription; paymentUrl?: string; transactionId?: string }>(
      '/subscriptions/user',
      data
    );
    return response.data!;
  }

  async upgradeUserSubscription(userId: string, planId: string): Promise<UserSubscription> {
    const response = await this.post<UserSubscription>(
      `/subscriptions/user/${userId}/upgrade`,
      { planId }
    );
    return response.data!;
  }

  async cancelUserSubscription(userId: string): Promise<UserSubscription> {
    const response = await this.post<UserSubscription>(
      `/subscriptions/user/${userId}/cancel`,
      {}
    );
    return response.data!;
  }

  async getUserUsage(userId: string): Promise<SubscriptionUsage[]> {
    const response = await this.get<SubscriptionUsage[]>(
      `/subscriptions/user/${userId}/usage`
    );
    return response.data || [];
  }

  // Plans
  async getPlans(userType: 'candidate' | 'recruiter'): Promise<SubscriptionPlan[]> {
    const response = await this.get<SubscriptionPlan[]>(`/subscriptions/plans?userType=${userType}`);
    return response.data || [];
  }

  async getPlanById(planId: string): Promise<SubscriptionPlan> {
    const response = await this.get<SubscriptionPlan>(`/subscriptions/plans/${planId}`);
    return response.data!;
  }

  // Usage tracking
  async trackUsage(data: {
    subscriptionId: string;
    subscriptionType: 'user' | 'company';
    featureKey: string;
    incrementBy?: number;
  }): Promise<void> {
    await this.post('/subscriptions/usage/track', data);
  }

  async checkFeatureAccess(data: {
    subscriptionId: string;
    subscriptionType: 'user' | 'company';
    featureKey: string;
  }): Promise<{ hasAccess: boolean; remaining: number; limit: number }> {
    const response = await this.post<{ hasAccess: boolean; remaining: number; limit: number }>(
      '/subscriptions/usage/check',
      data
    );
    return response.data!;
  }
}

export const subscriptionApi = new SubscriptionApi();
