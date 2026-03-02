/**
 * Referral Authentication Middleware Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { ReferralAuthMiddleware, AuthenticatedRequest } from './referralAuth.js';
import { getDatabase } from '../database/connection.js';

describe('ReferralAuthMiddleware', () => {
  let middleware: ReferralAuthMiddleware;
  let db: any;
  let testUserId: number;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    middleware = new ReferralAuthMiddleware();
    db = getDatabase();
    
    // Create test user
    const userResult = db.prepare(`
      INSERT INTO users (email, first_name, last_name, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run('test@example.com', 'Test', 'User', 'hash', 1);
    
    testUserId = userResult.lastInsertRowid as number;

    // Mock request and response objects
    mockReq = {
      headers: {},
      params: {},
      body: {}
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    // Clean up test data
    db.prepare('DELETE FROM activities WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM referrals WHERE referrer_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  });

  describe('requireAuth', () => {
    it('should authenticate valid token', async () => {
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };

      await middleware.requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as AuthenticatedRequest).user).toBeDefined();
      expect((mockReq as AuthenticatedRequest).user.id).toBe(testUserId);
    });

    it('should reject request without token', async () => {
      await middleware.requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      await middleware.requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      mockReq.headers = {
        authorization: 'Bearer mock-token-99999'
      };

      await middleware.requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    beforeEach(async () => {
      // Set up authenticated request
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());
    });

    it('should allow user with valid permission', async () => {
      const permissionMiddleware = middleware.requirePermission('create_referral');
      
      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny user without permission', async () => {
      const permissionMiddleware = middleware.requirePermission('admin_action');
      
      await permissionMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Permission denied: admin_action'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unauthenticated request', async () => {
      const unauthReq = { headers: {} };
      const permissionMiddleware = middleware.requirePermission('create_referral');
      
      await permissionMiddleware(unauthReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', async () => {
      // Update user to admin email
      db.prepare('UPDATE users SET email = ? WHERE id = ?')
        .run('admin@cvzen.com', testUserId);

      // Re-authenticate with admin user
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());

      await middleware.requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny non-admin user', async () => {
      // Set up regular user
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());

      await middleware.requireAdmin(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Admin access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireReferralOwnership', () => {
    let referralId: number;

    beforeEach(async () => {
      // Create test referral
      const referralResult = db.prepare(`
        INSERT INTO referrals (referrer_id, referee_email, referee_name, position_title, company_name, referral_token, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testUserId, 'referee@example.com', 'Referee', 'Developer', 'Tech Corp', 'token1', '2024-12-31');
      
      referralId = referralResult.lastInsertRowid as number;

      // Set up authenticated request
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());
    });

    it('should allow referral owner', async () => {
      mockReq.params = { id: referralId.toString() };

      await middleware.requireReferralOwnership(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny non-owner', async () => {
      // Create another user
      const otherUserResult = db.prepare(`
        INSERT INTO users (email, first_name, last_name, password_hash, is_active)
        VALUES (?, ?, ?, ?, ?)
      `).run('other@example.com', 'Other', 'User', 'hash', 1);
      
      const otherUserId = otherUserResult.lastInsertRowid as number;

      // Authenticate as other user
      mockReq.headers = {
        authorization: `Bearer mock-token-${otherUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());
      
      mockReq.params = { id: referralId.toString() };

      await middleware.requireReferralOwnership(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied: You can only access your own referrals'
      });
      expect(mockNext).not.toHaveBeenCalled();

      // Clean up
      db.prepare('DELETE FROM users WHERE id = ?').run(otherUserId);
    });

    it('should handle non-existent referral', async () => {
      mockReq.params = { id: '99999' };

      await middleware.requireReferralOwnership(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Referral not found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing referral ID', async () => {
      mockReq.params = {};

      await middleware.requireReferralOwnership(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Referral ID required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireHighValuePermission', () => {
    beforeEach(async () => {
      // Set up authenticated request
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());
    });

    it('should allow normal reward amount', async () => {
      mockReq.body = { rewardAmount: 50 };

      await middleware.requireHighValuePermission(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny high reward amount for regular user', async () => {
      mockReq.body = { rewardAmount: 500 };

      await middleware.requireHighValuePermission(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Reward amount exceeds maximum allowed (100)'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('checkDailyLimits', () => {
    beforeEach(async () => {
      // Set up authenticated request
      mockReq.headers = {
        authorization: `Bearer mock-token-${testUserId}`
      };
      await middleware.requireAuth(mockReq as Request, mockRes as Response, vi.fn());
    });

    it('should allow when under daily limit', async () => {
      await middleware.checkDailyLimits(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny when daily limit reached', async () => {
      // Create maximum referrals for today
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO referrals (referrer_id, referee_email, referee_name, position_title, company_name, referral_token, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(testUserId, `referee${i}@example.com`, `Referee ${i}`, 'Developer', 'Tech Corp', `token${i}`, '2024-12-31');
      }

      await middleware.checkDailyLimits(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Daily referral limit reached (10)'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});