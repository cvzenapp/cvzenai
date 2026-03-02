import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error details
  logger.error('API Error:', error, {
    url: req.url,
    method: req.method,
    statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Don't expose stack traces in production
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    response.data = {
      stack: error.stack,
      code: error.code
    };
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500, code?: string): CustomError => {
  const error = new Error(message) as CustomError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};