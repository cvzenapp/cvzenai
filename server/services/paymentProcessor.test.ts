/**
 * Payment Processor Tests
 * Tests for Stripe integration and payment processing functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PaymentProcessor } from './paymentProcessor.js';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    paymentMethods: {
      retrieve: vi.fn(),
      update: vi.fn(),
      detach: vi.fn()
    },
    transfers: {
      create: vi.fn()
    }
  };
  
  return {
    default: vi.fn(() => mockStripe)
  };
});

// Mock database
const mockPreparedStatement = {
  get: vi.fn(),
  all: vi.fn(),
  run: vi.fn(() => ({ lastInsertRowid: 1, changes: 1 }))
};

const mockDb = {
  prepare: vi.fn(() => mockPreparedStatement),
  transaction: vi.fn((fn) => fn)
};

vi.mock('../database/connection.js', () => ({
  getDatabase: () => mockDb
}));

describe('PaymentProcessor', () => {
  let paymentProcessor: PaymentProcessor;
  let mockStripeInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variable
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    
    paymentProcessor = new PaymentProcessor();
    mockStripeInstance = (Stripe as any).mock.results[0].value;
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('constructor', () => {
    it('should throw error if STRIPE_SECRET_KEY is not set', () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(() => new PaymentProcessor()).toThrow('STRIPE_SECRET_KEY environment variable is required');
    });

    it('should initialize Stripe with correct API version', () => {
      expect(Stripe).toHaveBeenCalledWith('sk_test_123', {
        apiVersion: '2024-06-20'
      });
    });
  });

  describe('addPaymentMethod', () => {
    it('should add bank account payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 'pm_123',
        type: 'us_bank_account',
        us_bank_account: {
          last4: '1234',
          bank_name: 'Test Bank'
        }
      };

      const mockNewPaymentMethod = {
        id: 1,
        user_id: 1,
        type: 'bank_account',
        stripe_payment_method_id: 'pm_123',
        last4: '1234',
        bank_name: 'Test Bank',
        account_holder_name: 'Alex Morgan',
        is_default: 1,
        is_verified: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockStripeInstance.paymentMethods.retrieve.mockResolvedValue(mockPaymentMethod);
      mockPreparedStatement.get
        .mockReturnValueOnce({ count: 0 }) // First call for existing methods count
        .mockReturnValueOnce(mockNewPaymentMethod); // Second call for getting the created method

      const result = await paymentProcessor.addPaymentMethod(1, 'pm_123', 'Alex Morgan');

      expect(mockStripeInstance.paymentMethods.retrieve).toHaveBeenCalledWith('pm_123');
      expect(mockPreparedStatement.run).toHaveBeenCalled();
      expect(result.type).toBe('bank_account');
      expect(result.last4).toBe('1234');
      expect(result.isDefault).toBe(true);
    });

    it('should add debit card payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 'pm_456',
        type: 'card',
        card: {
          last4: '5678',
          brand: 'visa'
        }
      };

      const mockNewPaymentMethod = {
        id: 2,
        user_id: 1,
        type: 'debit_card',
        stripe_payment_method_id: 'pm_456',
        last4: '5678',
        bank_name: 'visa',
        account_holder_name: 'Jane Doe',
        is_default: 0,
        is_verified: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockStripeInstance.paymentMethods.retrieve.mockResolvedValue(mockPaymentMethod);
      mockPreparedStatement.get
        .mockReturnValueOnce({ count: 1 }) // First call for existing methods count
        .mockReturnValueOnce(mockNewPaymentMethod); // Second call for getting the created method

      const result = await paymentProcessor.addPaymentMethod(1, 'pm_456', 'Jane Doe');

      expect(result.type).toBe('debit_card');
      expect(result.last4).toBe('5678');
      expect(result.isDefault).toBe(false);
    });

    it('should handle Stripe errors', async () => {
      mockStripeInstance.paymentMethods.retrieve.mockRejectedValue(new Error('Invalid payment method'));

      await expect(paymentProcessor.addPaymentMethod(1, 'pm_invalid', 'Alex Morgan'))
        .rejects.toThrow('Failed to add payment method: Invalid payment method');
    });

    it('should reject unsupported payment method types', async () => {
      const mockPaymentMethod = {
        id: 'pm_123',
        type: 'sepa_debit'
      };

      mockStripeInstance.paymentMethods.retrieve.mockResolvedValue(mockPaymentMethod);

      await expect(paymentProcessor.addPaymentMethod(1, 'pm_123', 'Alex Morgan'))
        .rejects.toThrow('Failed to add payment method: Unsupported payment method type');
    });
  });

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        type: 'bank_account'
      };

      const mockTransfer = {
        id: 'tr_123',
        amount: 10000,
        currency: 'usd'
      };

      mockPreparedStatement.get.mockReturnValue(mockPaymentMethod);
      mockStripeInstance.transfers.create.mockResolvedValue(mockTransfer);

      const result = await paymentProcessor.processPayout({
        userId: 1,
        amount: 100.00,
        currency: 'USD',
        description: 'Test payout'
      });

      expect(result.success).toBe(true);
      expect(result.stripeTransferId).toBe('tr_123');
      expect(result.transactionId).toBeDefined();
      expect(mockStripeInstance.transfers.create).toHaveBeenCalledWith({
        amount: 10000, // $100 in cents
        currency: 'usd',
        destination: 'pm_123',
        description: 'Test payout',
        metadata: {
          userId: '1',
          paymentMethodId: '1'
        }
      });
    });

    it('should handle missing payment method', async () => {
      mockPreparedStatement.get.mockReturnValue(null);

      const result = await paymentProcessor.processPayout({
        userId: 1,
        amount: 100.00,
        currency: 'USD',
        description: 'Test payout'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No valid payment method found');
    });

    it('should handle Stripe transfer errors', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        type: 'bank_account'
      };

      mockPreparedStatement.get.mockReturnValue(mockPaymentMethod);
      mockStripeInstance.transfers.create.mockRejectedValue(new Error('Insufficient funds'));

      const result = await paymentProcessor.processPayout({
        userId: 1,
        amount: 100.00,
        currency: 'USD',
        description: 'Test payout'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        expect.any(Number), // userId
        expect.any(Number), // amount
        expect.any(String), // currency
        expect.any(String), // transactionId
        expect.any(String), // description
        'Insufficient funds' // error message
      );
    });
  });

  describe('removePaymentMethod', () => {
    it('should remove payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        is_default: 0
      };

      mockPreparedStatement.get.mockReturnValue(mockPaymentMethod);
      mockStripeInstance.paymentMethods.detach.mockResolvedValue({});

      await paymentProcessor.removePaymentMethod(1, '1');

      expect(mockStripeInstance.paymentMethods.detach).toHaveBeenCalledWith('pm_123');
      expect(mockPreparedStatement.run).toHaveBeenCalledWith('1');
    });

    it('should set new default when removing default payment method', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        is_default: 1
      };

      const mockNextMethod = { id: 2 };

      mockPreparedStatement.get
        .mockReturnValueOnce(mockPaymentMethod)
        .mockReturnValueOnce(mockNextMethod);
      mockStripeInstance.paymentMethods.detach.mockResolvedValue({});

      await paymentProcessor.removePaymentMethod(1, '1');

      expect(mockPreparedStatement.run).toHaveBeenCalledWith(2); // Set new default
    });

    it('should handle non-existent payment method', async () => {
      mockPreparedStatement.get.mockReturnValue(null);

      await expect(paymentProcessor.removePaymentMethod(1, '999'))
        .rejects.toThrow('Failed to remove payment method: Payment method not found');
    });
  });

  describe('generateTaxDocument', () => {
    it('should generate new tax document', async () => {
      const mockRewardsTotal = { total: 1500.00 };
      const mockExistingDoc = null;
      const mockNewDoc = {
        id: 1,
        user_id: 1,
        year: 2024,
        total_amount: 1500.00,
        document_type: '1099-NEC',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockPreparedStatement.get
        .mockReturnValueOnce(mockRewardsTotal)
        .mockReturnValueOnce(mockExistingDoc)
        .mockReturnValueOnce(mockNewDoc);

      const result = await paymentProcessor.generateTaxDocument(1, 2024);

      expect(result.documentType).toBe('1099-NEC');
      expect(result.totalAmount).toBe(1500.00);
      expect(result.year).toBe(2024);
    });

    it('should return existing tax document', async () => {
      const mockExistingDoc = {
        id: 1,
        user_id: 1,
        year: 2024,
        total_amount: 800.00,
        document_type: '1099-MISC',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockPreparedStatement.get.mockReturnValue(mockExistingDoc);

      const result = await paymentProcessor.generateTaxDocument(1, 2024);

      expect(result.documentType).toBe('1099-MISC');
      expect(result.totalAmount).toBe(800.00);
    });

    it('should use 1099-MISC for amounts under $600', async () => {
      const mockRewardsTotal = { total: 400.00 };
      const mockExistingDoc = null;
      const mockNewDoc = {
        id: 1,
        user_id: 1,
        year: 2024,
        total_amount: 400.00,
        document_type: '1099-MISC',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockPreparedStatement.get
        .mockReturnValueOnce(mockRewardsTotal)
        .mockReturnValueOnce(mockExistingDoc)
        .mockReturnValueOnce(mockNewDoc);

      const result = await paymentProcessor.generateTaxDocument(1, 2024);

      expect(result.documentType).toBe('1099-MISC');
    });
  });

  describe('getReconciliationData', () => {
    it('should return reconciliation data', () => {
      const mockSummary = {
        totalPayouts: 10,
        totalAmount: 1000.00,
        successfulPayouts: 8,
        failedPayouts: 2
      };

      const mockTransactions = [
        {
          id: 1,
          user_id: 1,
          amount: 100.00,
          status: 'completed',
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe'
        }
      ];

      mockPreparedStatement.get.mockReturnValue(mockSummary);
      mockPreparedStatement.all.mockReturnValue(mockTransactions);

      const result = paymentProcessor.getReconciliationData('2024-01-01', '2024-01-31');

      expect(result.totalPayouts).toBe(10);
      expect(result.totalAmount).toBe(1000.00);
      expect(result.successfulPayouts).toBe(8);
      expect(result.failedPayouts).toBe(2);
      expect(result.transactions).toHaveLength(1);
    });
  });

  describe('validatePaymentMethod', () => {
    it('should validate bank account with micro-deposits', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        type: 'bank_account'
      };

      mockPreparedStatement.get.mockReturnValue(mockPaymentMethod);
      mockStripeInstance.paymentMethods.update.mockResolvedValue({});

      const result = await paymentProcessor.validatePaymentMethod(1, '1', [0.32, 0.45]);

      expect(result).toBe(true);
      expect(mockStripeInstance.paymentMethods.update).toHaveBeenCalledWith('pm_123', {
        us_bank_account: {
          account_holder_type: 'individual'
        }
      });
      expect(mockPreparedStatement.run).toHaveBeenCalledWith('1'); // Mark as verified
    });

    it('should handle validation errors', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        type: 'bank_account'
      };

      mockPreparedStatement.get.mockReturnValue(mockPaymentMethod);
      mockStripeInstance.paymentMethods.update.mockRejectedValue(new Error('Invalid amounts'));

      const result = await paymentProcessor.validatePaymentMethod(1, '1', [0.32, 0.45]);

      expect(result).toBe(false);
    });

    it('should reject non-bank account payment methods', async () => {
      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        type: 'debit_card'
      };

      mockPreparedStatement.get.mockReturnValue(mockPaymentMethod);

      const result = await paymentProcessor.validatePaymentMethod(1, '1', [0.32, 0.45]);

      expect(result).toBe(false);
    });
  });

  describe('retryPayout', () => {
    it('should retry failed payout successfully', async () => {
      const mockTransaction = {
        user_id: 1,
        amount: 100.00,
        currency: 'USD',
        description: 'Retry payout',
        payment_method_id: 1
      };

      const mockPaymentMethod = {
        id: 1,
        stripe_payment_method_id: 'pm_123',
        type: 'bank_account'
      };

      const mockTransfer = {
        id: 'tr_retry_123',
        amount: 10000,
        currency: 'usd'
      };

      mockPreparedStatement.get
        .mockReturnValueOnce(mockTransaction)
        .mockReturnValueOnce(mockPaymentMethod);
      mockStripeInstance.transfers.create.mockResolvedValue(mockTransfer);

      const result = await paymentProcessor.retryPayout('txn_failed_123');

      expect(result.success).toBe(true);
      expect(result.stripeTransferId).toBe('tr_retry_123');
    });

    it('should handle non-existent transaction', async () => {
      mockPreparedStatement.get.mockReturnValue(null);

      const result = await paymentProcessor.retryPayout('txn_nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found or not in failed status');
    });
  });
});