import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60 * 60 * 1000);

/**
 * Rate limiter middleware with IP-based tracking
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds
 */
export function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP (handle proxies)
    const ip = req.ip || 
               req.headers['x-forwarded-for'] as string || 
               req.headers['x-real-ip'] as string ||
               req.socket.remoteAddress || 
               'unknown';
    
    const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
    
    const now = Date.now();
    const entry = rateLimitStore.get(clientIp);
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      });
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - 1).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      
      return next();
    }
    
    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      const resetTime = new Date(entry.resetTime);
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
      res.setHeader('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
        resetTime: resetTime.toISOString()
      });
    }
    
    // Increment count
    entry.count++;
    rateLimitStore.set(clientIp, entry);
    
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
    
    next();
  };
}

/**
 * Get rate limit info for an IP
 */
export function getRateLimitInfo(ip: string, maxRequests: number = 5): { remaining: number; resetTime: number } | null {
  const entry = rateLimitStore.get(ip);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.resetTime) {
    rateLimitStore.delete(ip);
    return null;
  }
  
  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime
  };
}
