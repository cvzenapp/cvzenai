import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface RecruiterAuthRequest extends Request {
  recruiter?: {
    id: number;
    email: string;
    companyId?: number;
  };
}

/**
 * Middleware to require recruiter authentication
 */
export function requireRecruiterAuth(
  req: RecruiterAuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!decoded.recruiterId && !decoded.id) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format'
        });
      }

      // Attach recruiter info to request
      req.recruiter = {
        id: decoded.recruiterId || decoded.id,
        email: decoded.email,
        companyId: decoded.companyId
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Recruiter auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}
