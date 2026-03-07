import { Router, Response } from 'express';
import { z } from 'zod';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import { emailService } from '../services/emailService.js';

const router = Router();

// Validation schema
const createApplicationSchema = z.object({
  jobId: z.number().positive(),
  resumeId: z.number().positive(),
  coverLetter: z.string().optional(),
  resumeFileUrl: z.string().optional()
});

// POST /api/job-applications - Submit job application
router.post('/', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  const { initializeDatabase, closeDatabase } = await import('../database/connection.js');
  let db;
  
  try {
    const userId = req.user.id;
    const validatedData = createApplicationSchema.parse(req.body);

    db = await initializeDatabase();

    // Check if already applied
    const existingApp = await db.query(
      'SELECT id FROM job_applications WHERE job_id = $1 AND user_id = $2',
      [validatedData.jobId, userId]
    );

    if (existingApp.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied to this job'
      });
    }

    // Verify resume belongs to user
    const resumeCheck = await db.query(
      `SELECT r.id, r.personal_info, u.email 
       FROM resumes r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1 AND r.user_id = $2`,
      [validatedData.resumeId, userId]
    );

    if (resumeCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume not found or access denied'
      });
    }

    // Generate unique slug from user's name
    const { generateUniqueSlug } = await import('../lib/slugGenerator.js');
    const resume = resumeCheck.rows[0];
    const personalInfo = typeof resume.personal_info === 'string' 
      ? JSON.parse(resume.personal_info) 
      : resume.personal_info;
    
    // Get user information for candidate name
    const userResult = await db.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    const userName = personalInfo?.name || 
                     personalInfo?.fullName || 
                     `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim() ||
                     resume.email.split('@')[0];
    
    const candidateName = user && (user.first_name || user.last_name)
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : userName;
    
    const slug = await generateUniqueSlug(db, userName);

    // Check if resume_shares entry already exists for this resume
    const existingShare = await db.query(
      'SELECT share_token FROM resume_shares WHERE resume_id = $1 LIMIT 1',
      [validatedData.resumeId]
    );

    let shareToken: string;
    
    if (existingShare.rows.length > 0) {
      // Use existing share token
      shareToken = existingShare.rows[0].share_token;
    } else {
      // Create new resume_shares entry
      const shareResult = await db.query(
        `INSERT INTO resume_shares (resume_id, share_token, user_id, expires_at)
         VALUES ($1, $2, $3, NULL)
         RETURNING share_token`,
        [validatedData.resumeId, slug, userId]
      );
      shareToken = shareResult.rows[0].share_token;
    }

    // Create application with shared_token and resume_file_url
    const result = await db.query(
      `INSERT INTO job_applications (job_id, user_id, resume_id, cover_letter, status, shared_token, resume_file_url)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6)
       RETURNING *`,
      [
        validatedData.jobId, 
        userId, 
        validatedData.resumeId, 
        validatedData.coverLetter || null, 
        shareToken,
        validatedData.resumeFileUrl || null
      ]
    );

    const application = result.rows[0];

    // Get job and recruiter details for email notification
    const jobDetails = await db.query(
      `SELECT 
        jp.title, 
        jp.company_id,
        c.name as company_name,
        u.email as recruiter_email,
        u.first_name as recruiter_first_name,
        u.last_name as recruiter_last_name
       FROM job_postings jp
       LEFT JOIN companies c ON jp.company_id = c.id
       LEFT JOIN users u ON c.created_by::text = u.id::text
       WHERE jp.id = $1`,
      [validatedData.jobId]
    );

    // Send email notification and track usage asynchronously
    setImmediate(async () => {
      try {
        // Send email notification to recruiter
        if (jobDetails.rows.length > 0) {
          const job = jobDetails.rows[0];
          const recruiterEmail = job.recruiter_email;
          const recruiterName = job.recruiter_first_name && job.recruiter_last_name
            ? `${job.recruiter_first_name} ${job.recruiter_last_name}`
            : 'Recruiter';

          if (recruiterEmail) {
            await emailService.sendJobApplicationEmail(
              recruiterEmail,
              recruiterName,
              candidateName,
              resume.email,
              job.title,
              job.company_name || 'Your Company',
              validatedData.resumeFileUrl || `${process.env.APP_URL || 'http://localhost:3000'}/shared/resume/${shareToken}`,
              validatedData.coverLetter,
              validatedData.jobId,
              application.id,
              userId.toString()
            );

            // Send confirmation email to candidate
            await emailService.sendApplicationConfirmationEmail(
              resume.email,
              candidateName,
              job.title,
              job.company_name || 'Your Company',
              validatedData.resumeFileUrl || `${process.env.APP_URL || 'http://localhost:3000'}/shared/resume/${shareToken}`,
              validatedData.jobId,
              application.id,
              userId.toString()
            );
          }
        }

        // Track usage for subscription
        const { SubscriptionService } = await import('../services/subscriptionService.js');
        const subscription = await SubscriptionService.getUserSubscription(userId);
        if (subscription) {
          await SubscriptionService.incrementUsage(
            subscription.id,
            'user',
            'job_applications_monthly',
            1
          );
        }
      } catch (asyncError) {
        console.error('Background task error:', asyncError);
      }
    });

    res.json({
      success: true,
      data: {
        id: application.id,
        jobId: application.job_id,
        userId: application.user_id,
        resumeId: application.resume_id,
        coverLetter: application.cover_letter,
        resumeFileUrl: application.resume_file_url,
        status: application.status,
        appliedAt: application.applied_at,
        updatedAt: application.updated_at
      },
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Job application error:', error);
    console.log('Request body:', req.body);
    console.log('User ID:', req.user?.id);
    
    if (error instanceof z.ZodError) {
      console.log('Zod validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid application data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  } finally {
    if (db) {
      await closeDatabase();
    }
  }
});

// GET /api/job-applications/my-applications - Get user's applications
router.get('/my-applications', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  const { initializeDatabase, closeDatabase } = await import('../database/connection.js');
  let db;
  
  try {
    const userId = req.user.id;
    db = await initializeDatabase();

    const result = await db.query(
      `SELECT 
        ja.*,
        jp.title as job_title,
        jp.department as company,
        jp.location,
        jp.job_type
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_id = jp.id
       WHERE ja.user_id = $1
       ORDER BY ja.applied_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  } finally {
    if (db) {
      await closeDatabase();
    }
  }
});

// GET /api/job-applications/check/:jobId - Check if user applied
router.get('/check/:jobId', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  const { initializeDatabase, closeDatabase } = await import('../database/connection.js');
  let db;
  
  try {
    const userId = req.user.id;
    const jobId = parseInt(req.params.jobId);
    
    db = await initializeDatabase();

    const result = await db.query(
      'SELECT id, status, applied_at FROM job_applications WHERE job_id = $1 AND user_id = $2',
      [jobId, userId]
    );

    res.json({
      success: true,
      data: {
        hasApplied: result.rows.length > 0,
        application: result.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Check application error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check application status'
    });
  } finally {
    if (db) {
      await closeDatabase();
    }
  }
});

export default router;

// Guest application schema (updated to include parsed resume data)
const guestApplicationSchema = z.object({
  jobId: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  resumeFileUrl: z.string(),
  userId: z.string().optional(), // From guest resume parsing
  resumeId: z.number().optional(), // From guest resume parsing
  shareToken: z.string().optional(), // From guest resume parsing
  coverLetter: z.string().optional() // Cover letter from job application
});

// POST /api/job-applications/guest - Submit guest job application (no auth required)
// This endpoint expects the resume to already be parsed via /api/guest/resume/parse
router.post('/guest', async (req, res: Response) => {
  const { initializeDatabase, closeDatabase } = await import('../database/connection.js');
  let db;
  
  try {
    const validatedData = guestApplicationSchema.parse(req.body);

    db = await initializeDatabase();

    // Get job details
    const jobResult = await db.query(
      `SELECT jp.*, c.name as company_name, u.email as recruiter_email
       FROM job_postings jp
       LEFT JOIN companies c ON jp.company_id = c.id
       LEFT JOIN recruiter_profiles rp ON c.created_by = rp.id
       LEFT JOIN users u ON rp.user_id = u.id
       WHERE jp.id = $1`,
      [validatedData.jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const job = jobResult.rows[0];

    // Create application with parsed resume data if available
    const result = await db.query(
      `INSERT INTO job_applications (
        job_id, 
        user_id,
        resume_id,
        guest_name, 
        guest_email, 
        resume_file_url,
        shared_token,
        cover_letter,
        status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        validatedData.jobId,
        validatedData.userId || null,
        validatedData.resumeId || null,
        validatedData.name,
        validatedData.email,
        validatedData.resumeFileUrl,
        validatedData.shareToken || null,
        validatedData.coverLetter || null
      ]
    );

    const application = result.rows[0];

    // Send email notifications
    try {
      const recruiterEmail = job.recruiter_email;
      if (recruiterEmail) {
        // Send email to recruiter about new application
        await emailService.sendJobApplicationEmail(
          recruiterEmail,
          job.company_name || 'Recruiter',
          validatedData.name,
          validatedData.email,
          job.title,
          job.company_name || 'Company',
          validatedData.shareToken 
            ? `${process.env.APP_URL || 'http://localhost:3000'}/shared/resume/${validatedData.shareToken}`
            : validatedData.resumeFileUrl,
          validatedData.coverLetter,
          validatedData.jobId,
          application.id
        );

        // Send confirmation email to candidate
        await emailService.sendApplicationConfirmationEmail(
          validatedData.email,
          validatedData.name,
          job.title,
          job.company_name || 'Company',
          validatedData.shareToken 
            ? `${process.env.APP_URL || 'http://localhost:3000'}/shared/resume/${validatedData.shareToken}`
            : validatedData.resumeFileUrl,
          validatedData.jobId,
          application.id
        );
      }
    } catch (emailError) {
      console.error('Failed to send email notifications:', emailError);
      // Don't fail the application if email fails
    }

    res.json({
      success: true,
      application: {
        id: application.id,
        jobId: application.job_id,
        status: application.status,
        appliedAt: application.created_at
      }
    });
  } catch (error) {
    console.error('Guest job application error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid application data',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  } finally {
    if (db) {
      await closeDatabase();
    }
  }
});
