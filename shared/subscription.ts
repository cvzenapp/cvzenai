// Subscription types and interfaces

export type UserType = 'candidate' | 'recruiter';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial';
export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';
export type PlanName = 'free' | 'pro' | 'starter' | 'growth' | 'scale' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: PlanName;
  displayName: string;
  userType: UserType;
  priceMonthly: number; // in paise/cents
  priceYearly?: number;
  features: Record<string, any>;
  limits: Record<string, number>; // -1 means unlimited
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  expiresAt?: string;
  trialEndsAt?: string;
  paymentMethod?: string;
  paymentId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySubscription {
  id: string;
  companyId: string;
  planId: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  expiresAt?: string;
  trialEndsAt?: string;
  paymentMethod?: string;
  paymentId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUsage {
  id: string;
  subscriptionId: string;
  subscriptionType: 'user' | 'company';
  featureKey: string;
  usageCount: number;
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistory {
  id: string;
  subscriptionId: string;
  subscriptionType: 'user' | 'company';
  action: string;
  oldPlanId?: string;
  newPlanId?: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
}

export interface UsageCheck {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}

export interface SubscriptionFeatures {
  // Candidate features
  digitalCv?: boolean;
  shareableLink?: boolean;
  atsScore?: boolean;
  fakeJobDetection?: boolean;
  guestResumeParsing?: boolean;
  aiJobMatching?: boolean;
  priorityVisibility?: boolean;
  resumeOptimization?: boolean;
  unlimitedCustomization?: boolean;
  
  // Recruiter features
  jobPostings?: number;
  aiScreening?: boolean;
  jdGeneration?: boolean;
  resumeParsing?: boolean;
  atsScoring?: boolean;
  analytics?: boolean;
  bulkScreening?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
  prioritySupport?: boolean;
  privateDeployment?: boolean;
  customIntegrations?: boolean;
  sla?: boolean;
  dedicatedSupport?: boolean;
}
