/**
 * Payment API Routes Tests
 * Tests for payment processing API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import paymentsRouter from './payments.js';

// Create mock functions
const mockRewardEngineMethods = {
  getUserPaymentMethods: vi.fn(),
  addPaymentMethod: vi.fn(),
  removePaymentMethod: vi.fn(),
  setDefaultPaymentMethod: vi.fn(),
  validatePaymentMethod: vi.fn(),
  getPayoutHistory: vi.fn(),
  getPaymentAuditLog: vi.fn(),
  generateTaxDocument: vi.fn(),
  getUserTaxDocuments: vi.fn(),
  retryFailedPayout: vi.fn(),
  getPaymentReconciliation: vi.fn(),
  getPaymentStatistics: vi.fn(),
  processPayouts: vi.fn()
};

// Mock the enhanced reward engine
vi.mock('../services/enhancedRewardEngine.js', () => ({
  EnhancedRewardEngine: vi.fn(() => ({
    getUserPaymentMethods: vi.fn(),
    addPaymentMethod: vi.fn(),
    removePaymentMethod: vi.fn(),
    setDefaultPaymentMethod: vi.fn(),
    validatePaymentMethod: vi.fn(),
    getPayoutHistory: vi.fn(),
    getPaymentAuditLog: vi.fn(),
    generateTaxDocument: vi.fn(),
    getUserTaxDocuments: vi.fn(),
    retryFailedPayout: vi.fn(),
    getPaymentReconciliation: vi.fn(),
    getPaymentStatistics: vi.fn(),
    processPayouts: vi.fn()
  }))
}));

vi.mock('../services/paymentProcessor.js', () => ({
  PaymentProcessor: vi.fn(() => ({}))
}));

describe('Payment API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentsRouter);
  });

  describe('GET /api/payments/methods', () => {
    it('should return user payment methods', async () => {
      const mockPaymentMethods = [
        {
          id: '1',
          type: 'bank_account',
          last4: '1234',
          isDefault: true
        }
      ];

      mockRewardEngineMethods.getUserPaymentMethods.mockReturnValue(mockPaymentMethods);

      const response = await request(app)
        .get('/api/payments/methods')
        .set('x-user-id', '1')
        .expect(200);

      expect(response.body.paymentMethods).toEqual(mockPaymentMethods);
      expect(mockRewardEngineMethods.getUserPaymentMethods).toHaveBeenCalledWith(1);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/payments/methods')
        .expect(401);
    });

    it('should handle service errors', async () => {
      mockRewardEngineMethods.getUserPaymentMethods.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/payments/methods')
        .set('x-user-id', '1')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch payment methods');
      expect(response.body.details).toBe('Database error');
    });
  });

  describe('POST /api/payments/methods', () => {
    it('should add payment method successfully', async () => {
      const mockPaymentMethod = {
        id: '1',
        type: 'bank_account',
        last4: '1234',
        isDefault: true
      };

      mockRewardEngineMethods.addPaymentMethod.mockResolvedValue(mockPaymentMethod);

      const response = await request(app)
        .post('/api/payments/methods')
        .set('x-user-id', '1')
        .send({
          stripePaymentMethodId: 'pm_123',
          accountHolderName: 'Alex Morgan'
        })
        .expect(201);

      expect(response.body.paymentMethod).toEqual(mockPaymentMethod);
      expect(mockRewardEngineMethods.addPaymentMethod).toHaveBeenCalledWith(1, 'pm_123', 'Alex Morgan');
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .post('/api/payments/methods')
        .set('x-user-id', '1')
        .send({
          stripePaymentMethodId: '', // Invalid
          accountHolderName: 'Alex Morgan'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid request data');
    });

    it('should handle service errors', async () => {
      mockRewardEngineMethods.addPaymentMethod.mockRejectedValue(new Error('Stripe error'));

      const response = await request(app)
        .post('/api/payments/methods')
        .set('x-user-id', '1')
        .send({
          stripePaymentMethodId: 'pm_123',
          accountHolderName: 'Alex Morgan'
        })
        .expect(500);

      expect(response.body.error).toBe('Failed to add payment method');
      expect(response.body.details).toBe('Stripe error');
    });
  });

  describe('DELETE /api/payments/methods/:id', () => {
    it('should remove payment method successfully', async () => {
      mockRewardEngineMethods.removePaymentMethod.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/payments/methods/1')
        .set('x-user-id', '1')
        .expect(200);

      expect(mockRewardEngineMethods.removePaymentMethod).toHaveBeenCalledWith(1, '1');
    });

    it('should handle service errors', async () => {
      mockRewardEngineMethods.removePaymentMethod.mockRejectedValue(new Error('Payment method not found'));

      const response = await request(app)
        .delete('/api/payments/methods/999')
        .set('x-user-id', '1')
        .expect(500);

      expect(response.body.error).toBe('Failed to remove payment method');
    });
  });

  describe('PUT /api/payments/methods/default', () => {
    it('should set default payment method successfully', async () => {
      mockRewardEngineMethods.setDefaultPaymentMethod.mockResolvedValue(undefined);

      await request(app)
        .put('/api/payments/methods/default')
        .set('x-user-id', '1')
        .send({ paymentMethodId: '1' })
        .expect(200);

      expect(mockRewardEngineMethods.setDefaultPaymentMethod).toHaveBeenCalledWith(1, '1');
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .put('/api/payments/methods/default')
        .set('x-user-id', '1')
        .send({ paymentMethodId: '' }) // Invalid
        .expect(400);

      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('POST /api/payments/methods/:id/validate', () => {
    it('should validate payment method successfully', async () => {
      mockRewardEngineMethods.validatePaymentMethod.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/payments/methods/1/validate')
        .set('x-user-id', '1')
        .send({ amounts: [0.32, 0.45] })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(mockRewardEngineMethods.validatePaymentMethod).toHaveBeenCalledWith(1, '1', [0.32, 0.45]);
    });

    it('should validate amounts array', async () => {
      const response = await request(app)
        .post('/api/payments/methods/1/validate')
        .set('x-user-id', '1')
        .send({ amounts: [0.32] }) // Should be 2 amounts
        .expect(400);

      expect(response.body.error).toBe('Invalid request data');
    });

    it('should validate amount range', async () => {
      const response = await request(app)
        .post('/api/payments/methods/1/validate')
        .set('x-user-id', '1')
        .send({ amounts: [1.50, 0.45] }) // First amount too high
        .expect(400);

      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should return payout history', async () => {
      const mockHistory = {
        transactions: [
          {
            id: 1,
            amount: 100.00,
            status: 'completed',
            created_at: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1
      };

      mockRewardEngineMethods.getPayoutHistory.mockReturnValue(mockHistory);

      const response = await request(app)
        .get('/api/payments/history?limit=10&offset=0')
        .set('x-user-id', '1')
        .expect(200);

      expect(response.body).toEqual(mockHistory);
      expect(mockRewardEngineMethods.getPayoutHistory).toHaveBeenCalledWith(1, 10, 0);
    });

    it('should use default pagination parameters', async () => {
      const mockHistory = { transactions: [], total: 0 };
      mockRewardEngineMethods.getPayoutHistory.mockReturnValue(mockHistory);

      await request(app)
        .get('/api/payments/history')
        .set('x-user-id', '1')
        .expect(200);

      expect(mockRewardEngineMethods.getPayoutHistory).toHaveBeenCalledWith(1, 50, 0);
    });
  });

  describe('GET /api/payments/audit', () => {
    it('should return payment audit log', async () => {
      const mockAuditLog = {
        logs: [
          {
            id: 1,
            action: 'payout_completed',
            details: { amount: 100.00 },
            created_at: '2024-01-01T00:00:00Z'
          }
        ],
        total: 1
      };

      mockRewardEngineMethods.getPaymentAuditLog.mockReturnValue(mockAuditLog);

      const response = await request(app)
        .get('/api/payments/audit')
        .set('x-user-id', '1')
        .expect(200);

      expect(response.body).toEqual(mockAuditLog);
      expect(mockRewardEngineMethods.getPaymentAuditLog).toHaveBeenCalledWith(1, 50, 0);
    });
  });

  describe('POST /api/payments/tax-documents', () => {
    it('should generate tax document successfully', async () => {
      const mockDocument = {
        userId: 1,
        year: 2024,
        totalAmount: 1500.00,
        documentType: '1099-NEC',
        generatedAt: '2024-01-01T00:00:00Z'
      };

      mockRewardEngineMethods.generateTaxDocument.mockResolvedValue(mockDocument);

      const response = await request(app)
        .post('/api/payments/tax-documents')
        .set('x-user-id', '1')
        .send({ year: 2024 })
        .expect(201);

      expect(response.body.document).toEqual(mockDocument);
      expect(mockRewardEngineMethods.generateTaxDocument).toHaveBeenCalledWith(1, 2024);
    });

    it('should validate year', async () => {
      const response = await request(app)
        .post('/api/payments/tax-documents')
        .set('x-user-id', '1')
        .send({ year: 2019 }) // Too early
        .expect(400);

      expect(response.body.error).toBe('Invalid request data');
    });
  });

  describe('GET /api/payments/tax-documents', () => {
    it('should return tax documents', async () => {
      const mockDocuments = [
        {
          userId: 1,
          year: 2024,
          totalAmount: 1500.00,
          documentType: '1099-NEC'
        }
      ];

      mockRewardEngineMethods.getUserTaxDocuments.mockReturnValue(mockDocuments);

      const response = await request(app)
        .get('/api/payments/tax-documents')
        .set('x-user-id', '1')
        .expect(200);

      expect(response.body.documents).toEqual(mockDocuments);
      expect(mockRewardEngineMethods.getUserTaxDocuments).toHaveBeenCalledWith(1);
    });
  });

  describe('Admin routes', () => {
    describe('POST /api/payments/admin/retry-payout', () => {
      it('should retry payout successfully', async () => {
        const mockResult = {
          success: true,
          transactionId: 'txn_retry_123'
        };

        mockRewardEngineMethods.retryFailedPayout.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/payments/admin/retry-payout')
          .set('x-user-id', '1')
          .set('x-is-admin', 'true')
          .send({ transactionId: 'txn_failed_123' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(mockRewardEngineMethods.retryFailedPayout).toHaveBeenCalledWith('txn_failed_123');
      });

      it('should require admin access', async () => {
        await request(app)
          .post('/api/payments/admin/retry-payout')
          .set('x-user-id', '1')
          .send({ transactionId: 'txn_failed_123' })
          .expect(403);
      });
    });

    describe('GET /api/payments/admin/reconciliation', () => {
      it('should return reconciliation data', async () => {
        const mockReconciliation = {
          totalPayouts: 10,
          totalAmount: 1000.00,
          successfulPayouts: 8,
          failedPayouts: 2,
          transactions: []
        };

        mockRewardEngineMethods.getPaymentReconciliation.mockReturnValue(mockReconciliation);

        const response = await request(app)
          .get('/api/payments/admin/reconciliation?startDate=2024-01-01&endDate=2024-01-31')
          .set('x-user-id', '1')
          .set('x-is-admin', 'true')
          .expect(200);

        expect(response.body).toEqual(mockReconciliation);
        expect(mockRewardEngineMethods.getPaymentReconciliation).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
      });

      it('should validate date format', async () => {
        const response = await request(app)
          .get('/api/payments/admin/reconciliation?startDate=invalid&endDate=2024-01-31')
          .set('x-user-id', '1')
          .set('x-is-admin', 'true')
          .expect(400);

        expect(response.body.error).toBe('Invalid request parameters');
      });
    });

    describe('GET /api/payments/admin/statistics', () => {
      it('should return payment statistics', async () => {
        const mockStatistics = {
          totalPayouts: 100,
          totalAmount: 10000.00,
          successRate: 95.00,
          averagePayoutAmount: 100.00,
          pendingPayouts: 3,
          failedPayouts: 2
        };

        mockRewardEngineMethods.getPaymentStatistics.mockReturnValue(mockStatistics);

        const response = await request(app)
          .get('/api/payments/admin/statistics')
          .set('x-user-id', '1')
          .set('x-is-admin', 'true')
          .expect(200);

        expect(response.body).toEqual(mockStatistics);
        expect(mockRewardEngineMethods.getPaymentStatistics).toHaveBeenCalled();
      });
    });

    describe('POST /api/payments/admin/process-payouts', () => {
      it('should process payouts successfully', async () => {
        const mockResult = {
          processed: 5,
          totalAmount: 500.00
        };

        mockRewardEngineMethods.processPayouts.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/payments/admin/process-payouts')
          .set('x-user-id', '1')
          .set('x-is-admin', 'true')
          .expect(200);

        expect(response.body.message).toBe('Payout processing completed');
        expect(response.body.processed).toBe(5);
        expect(response.body.totalAmount).toBe(500.00);
        expect(mockRewardEngineMethods.processPayouts).toHaveBeenCalled();
      });
    });
  });
});