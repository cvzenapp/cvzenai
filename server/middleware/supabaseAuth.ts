import { Request, Response, NextFunction } from 'express';
import { SupabaseAuthService, SupabaseUtils } from '../services/supabaseService.js';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        userType: 'job_seeker' | 'recruiter' | 'unknown';
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: 'job_seeker' | 'recruiter' | 'unknown';
  };
}

// Middleware to verify JWT token and extract user information
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { user } = await SupabaseAuthService.verifyJWT(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'Authentication failed'
      });
    }

    // Get user type
    const userType = await SupabaseUtils.getUserType(user.id);

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email || '',
      userType
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'Invalid token'
    });
  }
};

// Middleware to require specific user type
export const requireUserType = (requiredType: 'job_seeker' | 'recruiter') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
    }

    if (req.user.userType !== requiredType) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: `This endpoint requires ${requiredType} access`
      });
    }

    next();
  };
};

// Middleware to require job seeker access
export const requireJobSeeker = requireUserType('job_seeker');

// Middleware to require recruiter access
export const requireRecruiter = requireUserType('recruiter');

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const { user } = await SupabaseAuthService.verifyJWT(token);
    
    if (user) {
      const userType = await SupabaseUtils.getUserType(user.id);
      req.user = {
        id: user.id,
        email: user.email || '',
        userType
      };
    }

    next();
  } catch (error) {
    // Log error but continue without authentication
    console.error('Optional auth error:', error);
    next();
  }
};

export default {
  requireAuth,
  requireUserType,
  requireJobSeeker,
  requireRecruiter,
  optionalAuth
};