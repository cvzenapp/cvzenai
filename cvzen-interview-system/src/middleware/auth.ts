import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { AuthenticatedRequest } from '../types/api';

export interface AuthRequest extends Request {
  user?: AuthenticatedRequest;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw createError('Access token required', 401, 'NO_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Extract user information from token
    req.user = {
      userId: parseInt(decoded.userId || decoded.id),
      userType: decoded.type || 'candidate',
      token: token
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError('Token expired', 401, 'TOKEN_EXPIRED');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid token', 401, 'INVALID_TOKEN');
    } else {
      throw createError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError('Authentication required', 401, 'NO_AUTH');
    }

    if (!allowedRoles.includes(req.user.userType)) {
      throw createError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

export const requireRecruiter = requireRole(['recruiter']);
export const requireCandidate = requireRole(['candidate']);
export const requireAnyUser = requireRole(['recruiter', 'candidate']);