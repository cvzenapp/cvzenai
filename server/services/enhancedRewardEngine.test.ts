/**
 * Enhanced Reward Engine Tests
 * Tests for payment processing integration with reward engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedRewardEngine } from './enhancedRewardEngine.js';

// Mock the base RewardEngine
vi.mock('./rewardEngine.js', () => ({
  RewardEngine: class MockRewardEngine {
    processPayouts = vi.fn();
    creditReward = vi.fn();
    getRewardBalance = vi.fn();
    getPaymentHistory = vi.fn();
    getRewardsStatistics = vi.fn();
  }
}));

// Mock PaymentProcessor
vi.mock('./paymentProcessor.js', () => ({
  PaymentProcessor: class MockPaymentProcessor {
    processPayout = vi.fn();
    getUserPaymentMethods = vi.fn();
    addPaymentMethod = vi.fn();
    removePaymentMethod = vi.fn();
    setDefaultPaymentMethod = vi.fn();
    validatePaymentMethod = vi.fn();
    generateTaxDocument = vi.fn();
    getUserTaxDocuments = vi.fn();
    getPayoutHistory = vi.fn();
    retryPayout = vi.fn();
    getReconciliationData = vi.fn();
  }
}));

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

describe('EnhancedRewardEngine', () => {
  let enhancedRewardEngine: EnhancedRewardEngine;
  let mockPaymentProcessor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    enhancedRewardEngine = new EnhancedRewardEngine();
    mockPaymentProcessor = (enhancedRewardEngine as any).paymentProcessor;
  });

  describe('processUserPayout', () => {
    it('should process payout successfully', async () => {
      const mockPayoutResult = {
        success: true,
        transactionId: 'txn_123',
        stripeTransferId: 'tr_123',
        estimatedArrival: '2024-01-05T00:00:00Z'
      };

      mockPaymentProcessor.processPayout.mockResolvedValue(mockPayoutResult);

      await (enhancedRewardEngine as any).processUserPayout(1, 100.00);

      expect(mockPaymentProcessor.processPayout).toHaveBeenCalledWith({
        userId: 1,
        amount: 100.00,
        currency: 'USD',
        description: 'Referral rewards payout - 100 USD'
      });

      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        'txn_123', 'txn_123', 1
      );
    });

    it('should handle payout failure', async () => {
      const mockPayoutResult = {
        success: false,
        error: 'Insufficient funds'
      };

      mockPaymentProcessor.processPayout.mockResolvedValue(mockPayoutResult);

      await expect((enhancedRewardEngine as any).processUserPayout(1, 100.00))
        .rejects.toThrow('Insufficient funds');

      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'payout_failed', 
        JSON.stringify({
          amount: 100.00,
          error: 'Insufficient funds'
        })
      );
    });

    it('should handle payment processor exceptions', async () => {
      mockPaymentProcessor.processPayout.mockRejectedValue(new Error('Network error'));

      await expect((enhancedRewardEngine as any).processUserPayout(1, 100.00))
        .rejects.toThrow('Network error');

      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'payout_failed',
        JSON.stringify({
          amount: 100.00,
          error: 'Network error'
        })
      );
    });
  });

  describe('processPayoutWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockPayoutResult = {
        success: true,
        transactionId: 'txn_123',
        stripeTransferId: 'tr_123'
      };

      mockPaymentProcessor.processPayout.mockResolvedValue(mockPayoutResult);

      await enhancedRewardEngine.processPayoutWithRetry(1, 100.00);

      expect(mockPaymentProcessor.processPayout).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFailureResult = {
        success: false,
        error: 'Temporary error'
      };

      const mockSuccessResult = {
        success: true,
        transactionId: 'txn_123',
        stripeTransferId: 'tr_123'
      };

      mockPaymentProcessor.processPayout
        .mockResolvedValueOnce(mockFailureResult)
        .mockResolvedValueOnce(mockSuccessResult);

      await enhancedRewardEngine.processPayoutWithRetry(1, 100.00, 3);

      expect(mockPaymentProcessor.processPayout).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const mockFailureResult = {
        success: false,
        error: 'Persistent error'
      };

      mockPaymentProcessor.processPayout.mockResolvedValue(mockFailureResult);

      await expect(enhancedRewardEngine.processPayoutWithRetry(1, 100.00, 2))
        .rejects.toThrow('Payout failed after 2 attempts: Persistent error');

      expect(mockPaymentProcessor.processPayout).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff', async () => {
      const mockFailureResult = {
        success: false,
        error: 'Temporary error'
      };

      mockPaymentProcessor.processPayout.mockResolvedValue(mockFailureResult);

      const startTime = Date.now();
      
      try {
        await enhancedRewardEngine.processPayoutWithRetry(1, 100.00, 2);
      } catch (error) {
        // Expected to fail
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have waited at least 2 seconds (2^1 * 1000ms) for the retry
      expect(duration).toBeGreaterThan(2000);
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method and log audit', async () => {
      const mockPaymentMethod = {
        id: 'pm_123',
        type: 'bank_account',
        last4: '1234'
      };

      mockPaymentProcessor.addPaymentMethod.mockResolvedValue(mockPaymentMethod);

      const result = await enhancedRewardEngine.addPaymentMethod(1, 'pm_stripe_123', 'Alex Morgan');

      expect(mockPaymentProcessor.addPaymentMethod).toHaveBeenCalledWith(1, 'pm_stripe_123', 'Alex Morgan');
      expect(result).toEqual(mockPaymentMethod);
      
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'method_added',
        JSON.stringify({
          paymentMethodId: 'pm_123',
          type: 'bank_account',
          last4: '1234'
        })
      );
    });
  });

  describe('removePaymentMethod', () => {
    it('should remove payment method and log audit', async () => {
      mockPaymentProcessor.removePaymentMethod.mockResolvedValue(undefined);

      await enhancedRewardEngine.removePaymentMethod(1, 'pm_123');

      expect(mockPaymentProcessor.removePaymentMethod).toHaveBeenCalledWith(1, 'pm_123');
      
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'method_removed',
        JSON.stringify({ paymentMethodId: 'pm_123' })
      );
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set default payment method and log audit', async () => {
      mockPaymentProcessor.setDefaultPaymentMethod.mockResolvedValue(undefined);

      await enhancedRewardEngine.setDefaultPaymentMethod(1, 'pm_123');

      expect(mockPaymentProcessor.setDefaultPaymentMethod).toHaveBeenCalledWith(1, 'pm_123');
      
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'method_set_default',
        JSON.stringify({ paymentMethodId: 'pm_123' })
      );
    });
  });

  describe('validatePaymentMethod', () => {
    it('should validate payment method and log audit', async () => {
      mockPaymentProcessor.validatePaymentMethod.mockResolvedValue(true);

      const result = await enhancedRewardEngine.validatePaymentMethod(1, 'pm_123', [0.32, 0.45]);

      expect(mockPaymentProcessor.validatePaymentMethod).toHaveBeenCalledWith(1, 'pm_123', [0.32, 0.45]);
      expect(result).toBe(true);
      
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'method_validation',
        JSON.stringify({
          paymentMethodId: 'pm_123',
          success: true
        })
      );
    });
  });

  describe('generateTaxDocument', () => {
    it('should generate tax document and log audit', async () => {
      const mockTaxDocument = {
        userId: 1,
        year: 2024,
        totalAmount: 1500.00,
        documentType: '1099-NEC',
        generatedAt: '2024-01-01T00:00:00Z'
      };

      mockPaymentProcessor.generateTaxDocument.mockResolvedValue(mockTaxDocument);

      const result = await enhancedRewardEngine.generateTaxDocument(1, 2024);

      expect(mockPaymentProcessor.generateTaxDocument).toHaveBeenCalledWith(1, 2024);
      expect(result).toEqual(mockTaxDocument);
      
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, null, 'tax_document_generated',
        JSON.stringify({
          year: 2024,
          documentType: '1099-NEC',
          totalAmount: 1500.00
        })
      );
    });
  });

  describe('retryFailedPayout', () => {
    it('should retry payout and log audit', async () => {
      const mockRetryResult = {
        success: true,
        transactionId: 'txn_retry_123'
      };

      const mockTransaction = { user_id: 1 };

      mockPaymentProcessor.retryPayout.mockResolvedValue(mockRetryResult);
      mockPreparedStatement.get.mockReturnValue(mockTransaction);

      const result = await enhancedRewardEngine.retryFailedPayout('txn_failed_123');

      expect(mockPaymentProcessor.retryPayout).toHaveBeenCalledWith('txn_failed_123');
      expect(result).toEqual(mockRetryResult);
      
      expect(mockPreparedStatement.run).toHaveBeenCalledWith(
        1, 'txn_failed_123', 'payout_retry',
        JSON.stringify({
          success: true,
          error: undefined
        })
      );
    });
  });

  describe('getPaymentAuditLog', () => {
    it('should return payment audit log with parsed details', () => {
      const mockLogs = [
        {
          id: 1,
          user_id: 1,
          action: 'payout_completed',
          details: '{"amount": 100.00}',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockTotal = { count: 1 };

      mockPreparedStatement.get.mockReturnValue(mockTotal);
      mockPreparedStatement.all.mockReturnValue(mockLogs);

      const result = enhancedRewardEngine.getPaymentAuditLog(1, 10, 0);

      expect(result.total).toBe(1);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].details).toEqual({ amount: 100.00 });
    });

    it('should handle null details gracefully', () => {
      const mockLogs = [
        {
          id: 1,
          user_id: 1,
          action: 'method_added',
          details: null,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockTotal = { count: 1 };

      mockPreparedStatement.get.mockReturnValue(mockTotal);
      mockPreparedStatement.all.mockReturnValue(mockLogs);

      const result = enhancedRewardEngine.getPaymentAuditLog(1, 10, 0);

      expect(result.logs[0].details).toBeNull();
    });
  });

  describe('getPaymentStatistics', () => {
    it('should return payment statistics', () => {
      const mockStats = {
        totalPayouts: 100,
        totalAmount: 10000.00,
        averagePayoutAmount: 100.00,
        successfulPayouts: 95,
        pendingPayouts: 3,
        failedPayouts: 2
      };

      mockPreparedStatement.get.mockReturnValue(mockStats);

      const result = enhancedRewardEngine.getPaymentStatistics();

      expect(result.totalPayouts).toBe(100);
      expect(result.totalAmount).toBe(10000.00);
      expect(result.successRate).toBe(95.00);
      expect(result.averagePayoutAmount).toBe(100.00);
      expect(result.pendingPayouts).toBe(3);
      expect(result.failedPayouts).toBe(2);
    });

    it('should handle zero payouts', () => {
      const mockStats = {
        totalPayouts: 0,
        totalAmount: 0,
        averagePayoutAmount: 0,
        successfulPayouts: 0,
        pendingPayouts: 0,
        failedPayouts: 0
      };

      mockPreparedStatement.get.mockReturnValue(mockStats);

      const result = enhancedRewardEngine.getPaymentStatistics();

      expect(result.successRate).toBe(0);
    });
  });

  describe('processBulkPayouts', () => {
    it('should process multiple payouts successfully', async () => {
      const userPayouts = [
        { userId: 1, amount: 100.00 },
        { userId: 2, amount: 150.00 },
        { userId: 3, amount: 200.00 }
      ];

      const mockSuccessResult = {
        success: true,
        transactionId: 'txn_123'
      };

      mockPaymentProcessor.processPayout.mockResolvedValue(mockSuccessResult);

      const result = await enhancedRewardEngine.processBulkPayouts(userPayouts);

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it('should handle mixed success and failure', async () => {
      const userPayouts = [
        { userId: 1, amount: 100.00 },
        { userId: 2, amount: 150.00 }
      ];

      const mockSuccessResult = {
        success: true,
        transactionId: 'txn_123'
      };

      const mockFailureResult = {
        success: false,
        error: 'Payment failed'
      };

      mockPaymentProcessor.processPayout
        .mockResolvedValueOnce(mockSuccessResult)
        .mockResolvedValueOnce(mockFailureResult);

      const result = await enhancedRewardEngine.processBulkPayouts(userPayouts);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBe('Payment failed');
    });
  });
});