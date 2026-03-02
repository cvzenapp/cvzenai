import { Router, Request, Response } from 'express';
import { fakeJobDetector } from '../services/dspy/fakeJobDetector.js';
import { createRateLimiter, getRateLimitInfo } from '../middleware/rateLimiter.js';
import { initializeDatabase } from '../database/connection.js';

const router = Router();

// Rate limiter: 5 requests per hour per IP
const publicRateLimiter = createRateLimiter(5, 60 * 60 * 1000);

/**
 * Public endpoint to analyze a single job posting
 * Rate limited to 5 requests per hour per IP
 */
router.post('/analyze', publicRateLimiter, async (req: Request, res: Response) => {
  const startTime = Date.now();
  let db;
  
  try {
    const jobData = req.body;
    
    // Validate required fields
    if (!jobData.title && !jobData.description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide at least a job title or description'
      });
    }
    
    // Limit description length to prevent abuse
    if (jobData.description && jobData.description.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Description too long',
        message: 'Job description must be less than 10,000 characters'
      });
    }
    
    // Get client IP and user agent
    const ip = req.ip || 
               req.headers['x-forwarded-for'] as string || 
               req.headers['x-real-ip'] as string ||
               req.socket.remoteAddress || 
               'unknown';
    const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    console.log(`🔍 Public fake job detection request from IP: ${clientIp}`);
    
    // Detect fake job
    const result = await fakeJobDetector.detect(jobData);
    const analysisTime = Date.now() - startTime;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (result.confidence >= 61) {
      riskLevel = 'high';
    } else if (result.confidence >= 31) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // Save to database (async, don't block response)
    try {
      db = await initializeDatabase();
      
      // Truncate description for privacy (first 500 chars only)
      const descriptionSnippet = jobData.description 
        ? jobData.description.substring(0, 500) 
        : null;
      
      await db.query(`
        INSERT INTO fake_job_analyses (
          user_id,
          ip_address,
          user_agent,
          job_title,
          job_description_snippet,
          is_fake,
          confidence_score,
          risk_level,
          red_flags_count,
          red_flags,
          reasoning,
          analysis_duration_ms,
          model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        null, // user_id (null for anonymous)
        clientIp,
        userAgent,
        jobData.title || null,
        descriptionSnippet,
        result.isFake,
        result.confidence,
        riskLevel,
        result.redFlags.length,
        JSON.stringify(result.redFlags),
        result.reasoning,
        analysisTime,
        'llama-3.1-8b-instant' // Current model version
      ]);
      
      console.log(`✅ Analysis saved to database (${analysisTime}ms)`);
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('Failed to save analysis to database:', dbError);
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Public fake job detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze job posting',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get rate limit status for current IP
 */
router.get('/rate-limit-status', (req: Request, res: Response) => {
  const ip = req.ip || 
             req.headers['x-forwarded-for'] as string || 
             req.headers['x-real-ip'] as string ||
             req.socket.remoteAddress || 
             'unknown';
  
  const clientIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
  
  // Get rate limit info from store
  const rateLimitInfo = getRateLimitInfo(clientIp);
  
  if (!rateLimitInfo) {
    // No rate limit entry exists - user has full quota
    res.json({
      success: true,
      data: {
        ip: clientIp,
        limit: 5,
        remaining: 5,
        resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        ip: clientIp,
        limit: 5,
        remaining: rateLimitInfo.remaining,
        resetTime: new Date(rateLimitInfo.resetTime).toISOString()
      }
    });
  }
});

/**
 * Get public statistics (total analyses count)
 * No authentication required - public stats only
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = await initializeDatabase();
    
    // Get overall statistics
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_analyses,
        SUM(CASE WHEN is_fake THEN 1 ELSE 0 END) as fake_jobs_detected,
        SUM(CASE WHEN NOT is_fake THEN 1 ELSE 0 END) as legitimate_jobs,
        AVG(confidence_score)::INTEGER as avg_confidence,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk_count,
        AVG(analysis_duration_ms)::INTEGER as avg_duration_ms
      FROM fake_job_analyses
    `);
    
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      data: {
        totalAnalyses: parseInt(stats.total_analyses) || 0,
        fakeJobsDetected: parseInt(stats.fake_jobs_detected) || 0,
        legitimateJobs: parseInt(stats.legitimate_jobs) || 0,
        avgConfidence: stats.avg_confidence || 0,
        highRiskCount: parseInt(stats.high_risk_count) || 0,
        avgDurationMs: stats.avg_duration_ms || 0
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
