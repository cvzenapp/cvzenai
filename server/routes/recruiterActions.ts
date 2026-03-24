import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { initializeDatabase, closeDatabase } from '../database/connection';
import { emailService } from '../services/emailService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Validation schema for shortlisting candidates
const shortlistCandidateSchema = z.object({
  applicationId: z.number().positive(),
  nextSteps: z.string().optional(),
});

// POST /api/recruiter/shortlist - Shortlist a candidate
router.post('/shortlist', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  const recruiterId = decoded.userId || decoded.id;
  let db;

  try {
    const validatedData = shortlistCandidateSchema.parse(req.body);
    db = await initializeDatabase();

    // Get application details with job and candidate information
    const applicationQuery = `
      SELECT 
        ja.*,
        jp.title as job_title,
        jp.company_id,
        c.name as company_name,
        u.email as candidate_email,
        u.first_name as candidate_first_name,
        u.last_name as candidate_last_name,
        rp.user_id as recruiter_user_id,
        ru.first_name as recruiter_first_name,
        ru.last_name as recruiter_last_name
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      LEFT JOIN companies c ON jp.company_id = c.id
      LEFT JOIN users u ON ja.user_id = u.id
      LEFT JOIN recruiter_profiles rp ON c.created_by = rp.id
      LEFT JOIN users ru ON rp.user_id = ru.id
      WHERE ja.id = $1 AND rp.user_id = $2
    `;

    const applicationResult = await db.query(applicationQuery, [validatedData.applicationId, recruiterId]);

    if (applicationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or access denied',
      });
    }

    const application = applicationResult.rows[0];

    // Update application status to shortlisted
    await db.query(
      'UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['shortlisted', validatedData.applicationId]
    );

    // Prepare candidate information
    const candidateName = application.guest_name || 
      (application.candidate_first_name && application.candidate_last_name 
        ? `${application.candidate_first_name} ${application.candidate_last_name}`.trim()
        : 'Candidate');

    const candidateEmail = application.guest_email || application.candidate_email;
    const recruiterName = application.recruiter_first_name && application.recruiter_last_name
      ? `${application.recruiter_first_name} ${application.recruiter_last_name}`.trim()
      : 'Recruiter';

    // Send shortlisted notification email to candidate
    if (candidateEmail) {
      try {
        await emailService.sendShortlistedNotification(
          candidateEmail,
          candidateName,
          application.job_title,
          application.company_name || 'Company',
          recruiterName,
          validatedData.nextSteps,
          application.job_id,
          application.id,
          application.user_id
        );
        console.log('✅ Shortlisted notification sent to:', candidateEmail);
      } catch (emailError) {
        console.error('❌ Failed to send shortlisted notification:', emailError);
        // Don't fail the shortlisting if email fails
      }
    }

    res.json({
      success: true,
      message: 'Candidate shortlisted successfully',
      data: {
        applicationId: application.id,
        status: 'shortlisted',
        candidateName,
        jobTitle: application.job_title,
        companyName: application.company_name,
      },
    });

  } catch (error) {
    console.error('❌ Shortlist candidate error:', error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to shortlist candidate',
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// GET /api/recruiter/applications - Get all applications for recruiter's jobs
router.get('/applications', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  const recruiterId = decoded.userId || decoded.id;
  let db;

  try {
    db = await initializeDatabase();

    const applicationsQuery = `
      SELECT 
        ja.*,
        jp.title as job_title,
        jp.company_id,
        c.name as company_name,
        u.email as candidate_email,
        u.first_name as candidate_first_name,
        u.last_name as candidate_last_name,
        r.personal_info,
        r.personal_info::json->>'name' as resume_name,
        COALESCE(interview_count.count, 0) as interview_count,
        COALESCE(interview_count.max_round, 0) as current_round
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      LEFT JOIN companies c ON jp.company_id = c.id
      LEFT JOIN users u ON ja.user_id = u.id
      LEFT JOIN resumes r ON ja.resume_id = r.id
      LEFT JOIN recruiter_profiles rp ON c.created_by = rp.id
      LEFT JOIN (
        SELECT application_id, COUNT(*) as count, MAX(interview_round) as max_round
        FROM interview_invitations 
        WHERE application_id IS NOT NULL
        GROUP BY application_id
      ) interview_count ON interview_count.application_id = ja.id
      WHERE rp.user_id = $1
      ORDER BY ja.applied_at DESC
    `;

    const result = await db.query(applicationsQuery, [recruiterId]);

    const applications = result.rows.map(row => {
      // Parse personal_info JSON to get the name
      let candidateName = row.candidate_email; // fallback
      if (row.personal_info) {
        try {
          const personalInfo = typeof row.personal_info === 'string' ? JSON.parse(row.personal_info) : row.personal_info;
          candidateName = personalInfo.name || candidateName;
        } catch (e) {
          console.error('Error parsing personal_info:', e);
        }
      }
      
      return {
        id: row.id,
        job_id: row.job_id,
        user_id: row.user_id,
        resume_id: row.resume_id,
        job_title: row.job_title,
        company_name: row.company_name,
        applicant_name: candidateName,
        applicant_email: row.candidate_email,
        cover_letter: row.cover_letter,
        status: row.status,
        applied_at: row.applied_at,
        updated_at: row.updated_at,
        shared_token: row.shared_token,
        resume_file_url: row.resume_file_url,
        interviewCount: parseInt(row.interview_count) || 0,
        currentRound: parseInt(row.current_round) || 0,
        hasScheduledInterview: parseInt(row.interview_count) > 0,
        ai_score: row.ai_score,
        ai_recommendation: row.ai_recommendation,
        ai_reasoning: row.ai_reasoning,
        ai_strengths: row.ai_strengths ? JSON.parse(row.ai_strengths) : null,
        ai_concerns: row.ai_concerns ? JSON.parse(row.ai_concerns) : null,
        ai_screened_at: row.ai_screened_at
      };
    });

    res.json({
      success: true,
      data: applications,
    });

  } catch (error) {
    console.error('❌ Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

export default router;