// Payment and Invoice types

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface PaymentHistory {
  id: string;
  subscriptionId: string;
  subscriptionType: 'user' | 'company';
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentGatewayId?: string;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  invoiceId?: string;
  billingEmail?: string;
  billingName?: string;
  billingAddress?: any;
  metadata?: Record<string, any>;
  paymentDate?: string;
  refundDate?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  subscriptionType: 'user' | 'company';
  paymentId?: string;
  status: InvoiceStatus;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  billingName: string;
  billingEmail: string;
  billingAddress?: any;
  billingGstin?: string;
  lineItems: InvoiceLineItem[];
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  pdfUrl?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface PaymentSummary {
  totalPaid: number;
  totalRefunded: number;
  paymentCount: number;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  currency: string;
}

export interface SubscriptionWithDetails {
  id: string;
  planName: string;
  planDisplayName: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt?: string;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  isCancelled: boolean;
}

// Usage statistics type
export interface UsageStats {
  [featureKey: string]: {
    current: number;
    limit: number;
    remaining: number;
    unlimited: boolean;
  };
}

