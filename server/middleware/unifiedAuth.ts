/**
 * Unified Authentication Middleware
 * Consolidates authentication logic for consistent token validation across all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { serverAuthLogger, ServerAuthOperation } from '../services/authLogger';
import { isTokenBlacklisted } from './tokenBlacklist.js';

dotenv.config();

export interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: 'job_seeker' | 'recruiter' | 'unknown';
    name?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getDbClient() {
  return new Client({ connectionString });
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Validate authentication token
 * Supports both JWT tokens and base64 encoded tokens from TempAuthService
 */
async function validateToken(token: string): Promise<{ id: string; email: string; jti?: string; type?: string } | null> {
  try {
    // First try to decode as JWT
    const decoded = verifyToken(token);
    if (decoded && (decoded.id || decoded.userId) && decoded.email) {
      // Check if token is blacklisted
      if (decoded.jti) {
        const blacklisted = await isTokenBlacklisted(decoded.jti);
        if (blacklisted) {
          console.log('🚫 Token is blacklisted:', decoded.jti);
          return null;
        }
      }
      
      return {
        id: (decoded.id || decoded.userId).toString(),
        email: decoded.email,
        type: decoded.type // Include type from JWT (e.g., 'recruiter')
      };
    }
    
    // If JWT fails, try to decode as base64 token from TempAuthService
    // Format: base64(userId:timestamp)
    try {
      const decodedBase64 = Buffer.from(token, 'base64').toString('utf8');
      const [userId, timestamp] = decodedBase64.split(':');
      
      if (userId && timestamp) {
        // Basic token age check (optional - tokens older than 24 hours are invalid)
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > maxAge) {
          console.log('🕒 Token expired:', { tokenAge, maxAge });
          return null;
        }
        
        return {
          id: userId,
          email: '' // Will be populated from database
        };
      }
    } catch (base64Error) {
      console.log('Base64 decode failed:', base64Error);
    }
    
    return null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Get user data from database by ID (supports both regular users and recruiters)
 */
async function getUserFromDatabase(userId: string, tokenType?: string): Promise<AuthRequest['user'] | null> {
  const client = getDbClient();

  try {
    await client.connect();

    // If token explicitly says 'recruiter', trust it and set userType accordingly
    if (tokenType === 'recruiter') {
      const recruiterResult = await client.query(
        `SELECT id, email, first_name, last_name, user_type FROM users WHERE id = $1`,
        [userId]
      );

      if (recruiterResult.rows.length > 0) {
        const user = recruiterResult.rows[0];
        
        console.log('✅ Recruiter found in database (from token type):', {
          id: user.id,
          email: user.email,
          userType: 'recruiter'
        });
        
        return {
          id: user.id.toString(),
          email: user.email,
          userType: 'recruiter',
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          firstName: user.first_name,
          lastName: user.last_name
        };
      }
    }

    // Otherwise, query users table and check user_type column
    const userResult = await client.query(
      `SELECT id, email, first_name, last_name, user_type FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const userType = user.user_type === 'recruiter' ? 'recruiter' : 'job_seeker';
      
      console.log('✅ User found in database:', {
        id: user.id,
        email: user.email,
        userType: userType,
        rawUserType: user.user_type
      });
      
      return {
        id: user.id.toString(),
        email: user.email,
        userType: userType,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        firstName: user.first_name,
        lastName: user.last_name
      };
    }

    console.log('❌ User not found in database:', userId);
    return null;
  } catch (error) {
    console.error('Database error in getUserFromDatabase:', error);
    return null;
  } finally {
    await client.end();
  }
}

/**
 * Unified authentication middleware - requires authentication
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }
  
  const tokenData = await validateToken(token);
  if (!tokenData) {
    return res.status(401).json({
      success: false,
      error: "Invalid token"
    });
  }

  try {
    const user = await getUserFromDatabase(tokenData.id, tokenData.type);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Authentication error"
    });
  }
};

/**
 * Optional authentication middleware - doesn't require authentication but adds user if available
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return next();
  }

  const tokenData = await validateToken(token);
  if (!tokenData) {
    return next();
  }

  try {
    const user = await getUserFromDatabase(tokenData.id);

    if (user) {
      (req as any).user = user;
    }
  } catch (error) {
    console.error('🔐 Optional Auth - Error:', error);
    // Don't fail the request, just continue without user
  }

  next();
};

/**
 * Validate token utility function for use in other services
 */
export const validateAuthToken = async (token: string): Promise<AuthRequest['user'] | null> => {
  const tokenData = await validateToken(token);
  if (!tokenData) {
    return null;
  }

  try {
    return await getUserFromDatabase(tokenData.id);
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};

/**
 * Extract user from request (utility function)
 */
export const getAuthenticatedUser = (req: Request): AuthRequest['user'] | null => {
  return (req as AuthRequest).user || null;
};

// Export the unified auth middleware as default
export default {
  requireAuth,
  optionalAuth,
  validateAuthToken,
  getAuthenticatedUser
};