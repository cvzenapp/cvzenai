/**
 * Job Matching Integration Routes
 * API endpoints for job matching and placement tracking integration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { JobMatchingIntegrationService, PlacementRecord } from '../services/jobMatchingIntegrationService.js';
import { referralAuth, AuthenticatedRequest } from '../middleware/referralAuth.js';

const router = Router();
const jobMatchingService = new JobMatchingIntegrationService();

// Validation schemas
const connectJobSchema = z.object({
  referralId: z.number().int().positive(),
  jobId: z.string().min(1)
});

const placementRecordSchema = z.object({
  id: z.string().min(1),
  candidateId: z.number().int().positive(),
  jobId: z.string().min(1),
  referralId: z.number().int().positive().optional(),
  hiredDate: z.string().datetime(),
  startDate: z.string().datetime().optional(),
  salary: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(['confirmed', 'started', 'ended', 'cancelled']).optional()
});

const jobApplicationSchema = z.object({
  candidateId: z.number().int().positive(),
  jobId: z.string().min(1),
  referralId: z.number().int().positive().optional()
});

// POST /api/job-matching/connect - Connect referral to job opportunity
router.post('/connect', 
  referralAuth.requireAuth,
  referralAuth.requirePermission('create_referral'),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = connectJobSchema.parse(req.body);

    await jobMatchingService.connectReferralToJobOpportunity(
      validatedData.referralId,
      validatedData.jobId
    );

    res.json({
      success: true,
      message: 'Referral connected to job opportunity successfully'
    });
  } catch (error) {
    console.error('Connect referral to job error:', error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/job-matching/placement - Process placement record for hire detection
router.post('/placement',
  referralAuth.requireAuth,
  referralAuth.requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = placementRecordSchema.parse(req.body);
    const placementRecord: PlacementRecord = {
      ...validatedData,
      status: validatedData.status || 'confirmed'
    };

    await jobMatchingService.detectHireFromPlacement(placementRecord);
    await jobMatchingService.createPlacementConfirmationWorkflow(placementRecord);

    res.json({
      success: true,
      message: 'Placement record processed successfully'
    });
  } catch (error) {
    console.error('Process placement record error:', error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/job-matching/application - Track job application
router.post('/application',
  referralAuth.requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = jobApplicationSchema.parse(req.body);

    await jobMatchingService.trackJobApplication(
      validatedData.candidateId,
      validatedData.jobId,
      validatedData.referralId
    );

    res.json({
      success: true,
      message: 'Job application tracked successfully'
    });
  } catch (error) {
    console.error('Track job application error:', error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/job-matching/referral/:id/jobs - Get matching jobs for referral
router.get('/referral/:id/jobs',
  referralAuth.requireAuth,
  referralAuth.requireReferralOwnership,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const referralId = parseInt(req.params.id);
    
    if (isNaN(referralId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid referral ID'
      });
    }

    const jobs = await jobMatchingService.getMatchingJobsForReferral(referralId);

    res.json({
      success: true,
      data: {
        jobs,
        count: jobs.length
      }
    });
  } catch (error) {
    console.error('Get matching jobs error:', error);
    
    if (error instanceof Error && error.message === 'Referral not found') {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/job-matching/analytics - Get referral attribution analytics
router.get('/analytics',
  referralAuth.requireAuth,
  referralAuth.requirePermission('view_analytics'),
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    // If userId is provided and it's not the current user, require admin permission
    if (userId && userId !== req.user.id && !req.user.permissions.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied: Can only view own analytics'
      });
    }

    const analytics = jobMatchingService.getReferralAttributionAnalytics(
      userId || req.user.id
    );

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get attribution analytics error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/job-matching/analytics/global - Get global attribution analytics (admin only)
router.get('/analytics/global',
  referralAuth.requireAuth,
  referralAuth.requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = jobMatchingService.getReferralAttributionAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get global attribution analytics error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/job-matching/attribution - Create manual referral attribution (admin only)
router.post('/attribution',
  referralAuth.requireAuth,
  referralAuth.requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { referralId, placementRecord } = req.body;

    if (!referralId || !placementRecord) {
      return res.status(400).json({
        success: false,
        error: 'Referral ID and placement record are required'
      });
    }

    const validatedPlacement = placementRecordSchema.parse(placementRecord);
    const attribution = await jobMatchingService.createReferralAttribution(
      referralId,
      validatedPlacement
    );

    res.json({
      success: true,
      data: attribution,
      message: 'Referral attribution created successfully'
    });
  } catch (error) {
    console.error('Create referral attribution error:', error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/job-matching/manual-review - Get manual review queue (admin only)
router.get('/manual-review',
  referralAuth.requireAuth,
  referralAuth.requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status = 'pending', limit = 20, offset = 0 } = req.query;

    const queue = jobMatchingService.db.prepare(`
      SELECT 
        mrq.*,
        r.referee_name,
        r.position_title,
        r.company_name,
        u.first_name || ' ' || u.last_name as referrer_name
      FROM manual_review_queue mrq
      JOIN referrals r ON mrq.referral_id = r.id
      JOIN users u ON r.referrer_id = u.id
      WHERE mrq.status = ?
      ORDER BY mrq.priority DESC, mrq.created_at ASC
      LIMIT ? OFFSET ?
    `).all(status, Number(limit), Number(offset));

    const total = jobMatchingService.db.prepare(`
      SELECT COUNT(*) as count FROM manual_review_queue WHERE status = ?
    `).get(status) as any;

    res.json({
      success: true,
      data: {
        queue,
        total: total.count,
        hasMore: Number(offset) + queue.length < total.count
      }
    });
  } catch (error) {
    console.error('Get manual review queue error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;