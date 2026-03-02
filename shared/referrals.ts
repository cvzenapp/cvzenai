/**
 * Referrals System Types and Interfaces
 * Shared between client and server
 */

// Enums for referral system
export enum ReferralStatus {
  PENDING = 'pending',           // Referral sent, waiting for signup
  SIGNED_UP = 'signed_up',       // Referee created account
  TRIAL_USER = 'trial_user',     // Referee is using free trial
  PAID_USER = 'paid_user',       // Referee became paid subscriber (reward earned!)
  EXPIRED = 'expired',           // Referral link expired
  DECLINED = 'declined'          // Referee declined to join
}

export enum RewardStatus {
  PENDING = 'pending',
  EARNED = 'earned',
  PAID = 'paid',
  REVERSED = 'reversed'
}

// Core data interfaces
export interface Referral {
  id: number;
  referrerId: number;
  refereeEmail: string;
  refereeName: string;
  status: ReferralStatus;
  personalMessage?: string;
  rewardAmount: number;
  referralToken: string;
  expiresAt: string;
  refereeUserId?: number;
  refereeSignupDate?: string;
  refereePaidDate?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralStatusHistory {
  id: number;
  referralId: number;
  previousStatus?: ReferralStatus;
  newStatus: ReferralStatus;
  changedByUserId?: number;
  notes?: string;
  createdAt: string;
}

export interface Reward {
  id: number;
  userId: number;
  referralId: number;
  amount: number;
  status: RewardStatus;
  earnedAt: string;
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  reversedAt?: string;
  reversalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralProgramConfig {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  updatedByUserId?: number;
  createdAt: string;
  updatedAt: string;
}

// Request/Response interfaces
export interface CreateReferralRequest {
  refereeEmail: string;
  refereeName: string;
  positionTitle: string;
  companyName: string;
  personalMessage?: string;
  rewardAmount?: number;
}

export interface UpdateReferralRequest {
  status?: ReferralStatus;
  personalMessage?: string;
  notes?: string;
}

export interface ReferralFilters {
  status?: ReferralStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  contactedReferrals: number;
  interviewedReferrals: number;
  successfulReferrals: number;
  rejectedReferrals: number;
  expiredReferrals: number;
  totalEarnings: number;
  pendingRewards: number;
  paidRewards: number;
  conversionRate: number;
  averageTimeToHire: number;
}

export interface RewardBalance {
  totalEarnings: number;
  pendingRewards: number;
  availableForPayout: number;
  paidRewards: number;
  nextPayoutDate?: string;
  minimumPayoutThreshold: number;
}

export interface ReferralResponse {
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

// API Response interfaces
export interface ReferralApiResponse {
  success: boolean;
  data?: Referral;
  error?: string;
}

export interface ReferralsListApiResponse {
  success: boolean;
  data?: {
    referrals: Referral[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

export interface ReferralStatsApiResponse {
  success: boolean;
  data?: ReferralStats;
  error?: string;
}

export interface RewardBalanceApiResponse {
  success: boolean;
  data?: RewardBalance;
  error?: string;
}

export interface PaymentHistoryApiResponse {
  success: boolean;
  data?: {
    rewards: Reward[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

// Validation schemas (for use with zod or similar)
export const CreateReferralSchema = {
  refereeEmail: { required: true, type: 'email' },
  refereeName: { required: true, minLength: 2, maxLength: 255 },
  personalMessage: { required: false, maxLength: 1000 },
  rewardAmount: { required: false, min: 0, max: 1000 }
};

// Constants
export const REFERRAL_CONSTANTS = {
  DEFAULT_REWARD_AMOUNT: 30.00,
  MINIMUM_PAYOUT_THRESHOLD: 100.00,
  REFERRAL_EXPIRY_DAYS: 30,
  HIRE_REVERSAL_DAYS: 90,
  MAX_REFERRALS_PER_DAY: 10,
  MAX_PERSONAL_MESSAGE_LENGTH: 1000,
  VALID_STATUS_TRANSITIONS: {
    [ReferralStatus.PENDING]: [ReferralStatus.SIGNED_UP, ReferralStatus.DECLINED, ReferralStatus.EXPIRED],
    [ReferralStatus.SIGNED_UP]: [ReferralStatus.TRIAL_USER, ReferralStatus.PAID_USER],
    [ReferralStatus.TRIAL_USER]: [ReferralStatus.PAID_USER, ReferralStatus.EXPIRED],
    [ReferralStatus.PAID_USER]: [] as ReferralStatus[], // Terminal state - reward earned!
    [ReferralStatus.EXPIRED]: [] as ReferralStatus[], // Terminal state
    [ReferralStatus.DECLINED]: [] as ReferralStatus[] // Terminal state
  }
};

// Utility functions
export function isValidStatusTransition(from: ReferralStatus, to: ReferralStatus): boolean {
  return REFERRAL_CONSTANTS.VALID_STATUS_TRANSITIONS[from].includes(to);
}

export function calculateConversionRate(stats: ReferralStats): number {
  if (stats.totalReferrals === 0) return 0;
  return (stats.successfulReferrals / stats.totalReferrals) * 100;
}

export function isReferralExpired(referral: Referral): boolean {
  return new Date(referral.expiresAt) < new Date();
}

export function canReferralBeReversed(referral: Referral): boolean {
  if (referral.status !== ReferralStatus.PAID_USER) return false;
  const paidDate = new Date(referral.refereePaidDate || referral.updatedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - paidDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= REFERRAL_CONSTANTS.HIRE_REVERSAL_DAYS;
}

export function generateReferralToken(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatRewardAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getReferralStatusColor(status: ReferralStatus): string {
  const colors = {
    [ReferralStatus.PENDING]: '#f59e0b', // amber
    [ReferralStatus.SIGNED_UP]: '#3b82f6', // blue
    [ReferralStatus.TRIAL_USER]: '#8b5cf6', // purple
    [ReferralStatus.PAID_USER]: '#10b981', // green
    [ReferralStatus.EXPIRED]: '#6b7280', // gray
    [ReferralStatus.DECLINED]: '#6b7280' // gray
  };
  return colors[status];
}

export function getReferralStatusLabel(status: ReferralStatus): string {
  const labels = {
    [ReferralStatus.PENDING]: 'Pending Signup',
    [ReferralStatus.SIGNED_UP]: 'Signed Up',
    [ReferralStatus.TRIAL_USER]: 'Trial User',
    [ReferralStatus.PAID_USER]: 'Paid User',
    [ReferralStatus.EXPIRED]: 'Expired',
    [ReferralStatus.DECLINED]: 'Declined'
  };
  return labels[status];
}