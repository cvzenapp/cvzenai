import express from "express";
import { getDatabase } from "../database/connection.js";
import jwt from 'jsonwebtoken';
import { emailService } from "../services/emailService.js";
import type { Request, Response } from "express";
import type { 
  CreateInterviewRequest, 
  RespondToInterviewRequest, 
  RescheduleInterviewRequest,
  InterviewInvitation 
} from "@shared/api";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to map integer userId to UUID (for legacy tokens)
function mapUserIdToUUID(userId: number | string): string {
  // If already UUID format, return as is
  if (typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return userId;
  }
  
  // Map known integer IDs to UUIDs (legacy token support)
  if (userId === 7 || userId === '7') {
    return '7d56be89-2f99-4dc5-abf5-5f2238e3bda0';
  }
  
  // If it's a number but not mapped, throw error
  throw new Error(`Cannot map userId ${userId} to UUID. Please regenerate auth token.`);
}

// Helper function to authenticate user and get user ID
async function authenticateUser(req: Request): Promise<{ userId: string; userType: string } | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  console.log('🔍 Interview Auth Debug:', {
    hasAuthHeader: !!req.headers.authorization,
    authHeader: req.headers.authorization?.substring(0, 50) + '...',
    hasToken: !!token,
    tokenPreview: token?.substring(0, 30) + '...',
    tokenLength: token?.length,
    allHeaders: Object.keys(req.headers)
  });
  
  if (!token) {
    console.log('❌ No authorization token provided');
    return null;
  }

  // Check if token looks like a JWT (should have 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    console.log('❌ Token is not a valid JWT format:', {
      parts: tokenParts.length,
      tokenPreview: token.substring(0, 50) + '...',
      tokenLength: token.length,
      message: 'JWT tokens must have exactly 3 parts separated by dots (header.payload.signature)'
    });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('🔍 JWT decoded successfully:', { userId: decoded.userId, type: decoded.type });
    
    if (decoded.userId) {
      const mappedUserId = mapUserIdToUUID(decoded.userId);
      console.log('✅ Mapped userId:', { original: decoded.userId, mapped: mappedUserId });
      return {
        userId: mappedUserId,
        userType: decoded.type || 'job_seeker'
      };
    }
    console.log('❌ Invalid token - missing userId');
    return null;
  } catch (error) {
    console.error("❌ JWT verification failed:", error.message);
    console.log('🔍 Token details:', {
      tokenLength: token.length,
      tokenParts: token.split('.').length,
      tokenStart: token.substring(0, 20),
      tokenEnd: token.substring(token.length - 20)
    });
    return null;
  }
}

// Create interview invitation (recruiter only)
router.post("/create", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth || auth.userType !== 'recruiter') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Recruiter access required'
      });
    }

    const {
      candidateId: rawCandidateId,
      resumeId,
      jobPostingId,
      applicationId: requestApplicationId,
      title,
      description,
      interviewType,
      interviewRoundType,
      proposedDatetime,
      durationMinutes = 60,
      timezone = 'UTC',
      meetingLink,
      meetingLocation,
      meetingInstructions,
      recruiterNotes,
      evaluationMetrics,
      // Guest candidate fields
      guestCandidateName,
      guestCandidateEmail
    }: CreateInterviewRequest = req.body;

    // Determine if this is a guest candidate
    const isGuestCandidate = !rawCandidateId || rawCandidateId === 0;
    
    let candidateId: string | null = null;
    
    if (!isGuestCandidate) {
      // Map candidateId to UUID if needed
      try {
        candidateId = mapUserIdToUUID(rawCandidateId);
        console.log('✅ Mapped candidateId:', { original: rawCandidateId, mapped: candidateId });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid candidate ID format'
        });
      }
    }

    // Validate required fields based on candidate type
    if (isGuestCandidate) {
      if (!guestCandidateName || !guestCandidateEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields for guest candidate: guestCandidateName, guestCandidateEmail'
        });
      }
    } else {
      if (!candidateId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: candidateId'
        });
      }
    }

    if (!title || !proposedDatetime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, proposedDatetime'
      });
    }

    const db = await getDatabase();

    // Check if interview tables exist
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'interview_invitations'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('⚠️ Interview tables do not exist yet');
        return res.status(503).json({
          success: false,
          error: 'Interview system is being set up',
          message: 'The interview scheduling system is currently being set up. Database tables are being created. Please try again in a few minutes.',
          type: 'SETUP_IN_PROGRESS'
        });
      }
    } catch (tableError) {
      console.error('❌ Error checking table existence:', tableError);
      return res.status(503).json({
        success: false,
        error: 'Interview system is being set up',
        message: 'The interview scheduling system is currently being set up. Please try again later.',
        type: 'SETUP_IN_PROGRESS'
      });
    }

    // Verify the candidate exists and owns the resume (skip for guest candidates)
    let candidateName = guestCandidateName;
    let candidateEmail = guestCandidateEmail;
    
    if (!isGuestCandidate && candidateId) {
      const candidateCheck = await db.query(
        `SELECT u.id, u.email, 
         COALESCE(
           NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''),
           NULLIF(TRIM(u.first_name), ''),
           SPLIT_PART(u.email, '@', 1)
         ) as name, 
         r.id as resume_id, r.title as resume_title
         FROM users u
         LEFT JOIN resumes r ON r.user_id = u.id
         WHERE u.id = $1 AND u.user_type = 'job_seeker'`,
        [candidateId]
      );

      if (candidateCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      candidateName = candidateCheck.rows[0].name;
      candidateEmail = candidateCheck.rows[0].email;
    }

    // Verify job posting belongs to recruiter (if provided)
    if (jobPostingId) {
      const jobCheck = await db.query(
        'SELECT id FROM job_postings WHERE id = $1 AND recruiter_id = $2',
        [jobPostingId, auth.userId]
      );

      if (jobCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job posting not found or not owned by recruiter'
        });
      }
    }

    // Find the application_id and next round for this candidate and job
    let applicationId = requestApplicationId; // Use the provided applicationId first
    let nextRound = 1;
    
    if (jobPostingId) {
      // If applicationId was provided, use it and find the next round
      if (applicationId) {
        const roundQuery = await db.query(
          'SELECT COALESCE(MAX(interview_round), 0) + 1 as next_round FROM interview_invitations WHERE application_id = $1',
          [applicationId]
        );
        nextRound = roundQuery.rows[0]?.next_round || 1;
        console.log('✅ Using provided applicationId:', applicationId, 'next round:', nextRound);
      } else {
        // Fallback: try to find application by candidate and job
        if (isGuestCandidate) {
          // For guest candidates, find by email and job_id
          const appQuery = await db.query(
            'SELECT id FROM job_applications WHERE applicant_email = $1 AND job_id = $2',
            [guestCandidateEmail, jobPostingId]
          );
          applicationId = appQuery.rows[0]?.id || null;
        } else if (candidateId) {
          // For registered candidates, find by user_id and job_id
          const appQuery = await db.query(
            'SELECT id FROM job_applications WHERE user_id = $1 AND job_id = $2',
            [candidateId, jobPostingId]
          );
          applicationId = appQuery.rows[0]?.id || null;
        }
        
        // Find the next round number for this application
        if (applicationId) {
          const roundQuery = await db.query(
            'SELECT COALESCE(MAX(interview_round), 0) + 1 as next_round FROM interview_invitations WHERE application_id = $1',
            [applicationId]
          );
          nextRound = roundQuery.rows[0]?.next_round || 1;
        } else {
          // If no application found, try to create one for this interview
          console.log('🔧 Creating application record for interview');
          try {
            if (isGuestCandidate) {
              const newAppResult = await db.query(
                'INSERT INTO job_applications (job_id, guest_name, guest_email, applicant_name, applicant_email, status, applied_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id',
                [jobPostingId, guestCandidateName, guestCandidateEmail, guestCandidateName, guestCandidateEmail, 'shortlisted']
              );
              applicationId = newAppResult.rows[0]?.id;
            } else if (candidateId) {
              const newAppResult = await db.query(
                'INSERT INTO job_applications (job_id, user_id, applicant_name, applicant_email, status, applied_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
                [jobPostingId, candidateId, candidateName, candidateEmail, 'shortlisted']
              );
              applicationId = newAppResult.rows[0]?.id;
            }
            console.log('✅ Created application:', applicationId);
          } catch (appError) {
            console.error('❌ Failed to create application:', appError);
          }
        }
      }
      
      console.log('🔍 Final application_id:', applicationId, 'next round:', nextRound);
      
      if (!applicationId) {
        console.log('⚠️ Warning: No application_id found for candidate/job combination');
        console.log('Debug info:', {
          isGuestCandidate,
          candidateId,
          guestCandidateEmail,
          jobPostingId,
          requestApplicationId
        });
      }
    }

    // Create interview invitation
    console.log('📝 Creating interview invitation with values:', {
      recruiter_id: auth.userId,
      candidate_id: candidateId,
      resume_id: resumeId,
      job_posting_id: jobPostingId,
      application_id: applicationId,
      title,
      interview_type: interviewType || 'video_call',
      proposed_datetime: proposedDatetime,
      duration_minutes: durationMinutes,
      timezone,
      isGuestCandidate
    });

    const result = await db.query(
      isGuestCandidate ? `
        INSERT INTO interview_invitations (
          recruiter_id, guest_candidate_name, guest_candidate_email, job_posting_id, application_id, interview_round, interview_round_type,
          title, description, interview_type,
          proposed_datetime, duration_minutes, timezone,
          meeting_link, meeting_location, meeting_instructions,
          recruiter_notes, evaluation_metrics
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, created_at`
      : `
        INSERT INTO interview_invitations (
          recruiter_id, candidate_id, resume_id, job_posting_id, application_id, interview_round, interview_round_type,
          title, description, interview_type,
          proposed_datetime, duration_minutes, timezone,
          meeting_link, meeting_location, meeting_instructions,
          recruiter_notes, evaluation_metrics
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id, created_at`,
      isGuestCandidate ? [
        auth.userId, guestCandidateName, guestCandidateEmail, jobPostingId, applicationId, nextRound, interviewRoundType,
        title, description, interviewType || 'video_call',
        proposedDatetime, durationMinutes, timezone,
        meetingLink, meetingLocation, meetingInstructions,
        recruiterNotes, JSON.stringify(evaluationMetrics || [])
      ] : [
        auth.userId, candidateId, resumeId, jobPostingId, applicationId, nextRound, interviewRoundType,
        title, description, interviewType || 'video_call',
        proposedDatetime, durationMinutes, timezone,
        meetingLink, meetingLocation, meetingInstructions,
        recruiterNotes, JSON.stringify(evaluationMetrics || [])
      ]
    );

    console.log('✅ Interview invitation created successfully:', result.rows[0]);

    const interviewId = result.rows[0].id;

    // Auto-generate meeting link for video calls if not provided
    let finalMeetingLink = meetingLink;
    if (interviewType === 'video_call' && !meetingLink) {
      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8080';
      finalMeetingLink = `${baseUrl}/interview/${interviewId}/join`;
      
      // Update the interview with the generated meeting link
      await db.query(
        'UPDATE interview_invitations SET meeting_link = $1 WHERE id = $2',
        [finalMeetingLink, interviewId]
      );
    }

    console.log('✅ Interview invitation created:', {
      interviewId,
      recruiterId: auth.userId,
      candidateId,
      resumeId,
      title,
      meetingLink: finalMeetingLink
    });

    // Send email notification to candidate
    try {
      if (candidateEmail && candidateName) {
        console.log('📧 Sending interview invitation email...');
        
        // Get recruiter details for email
        const recruiterQuery = await db.query(
          'SELECT email, COALESCE(first_name || \' \' || last_name, email) as name FROM users WHERE id = $1',
          [auth.userId]
        );
        
        const recruiterInfo = recruiterQuery.rows[0];
        const recruiterName = recruiterInfo?.name || 'Recruiter';
        
        // Get company name from job posting if available
        let companyName = 'Company';
        if (jobPostingId) {
          const jobQuery = await db.query(
            'SELECT company FROM job_postings WHERE id = $1',
            [jobPostingId]
          );
          companyName = jobQuery.rows[0]?.company || 'Company';
        }

        const emailResult = await emailService.sendInterviewInvitationEmail(
          candidateEmail,
          candidateName,
          recruiterName,
          companyName,
          {
            title,
            description,
            interviewType: interviewType || 'video_call',
            proposedDatetime,
            durationMinutes,
            timezone,
            meetingLink: finalMeetingLink,
            meetingLocation,
            meetingInstructions
          },
          interviewId,
          candidateId || undefined,
          recruiterInfo?.email
        );

        if (emailResult.success) {
          console.log('✅ Interview invitation email sent successfully');
        } else {
          console.error('❌ Failed to send interview invitation email:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending interview invitation email:', emailError);
      // Don't fail the interview creation if email fails
    }

    res.json({
      success: true,
      message: 'Interview invitation sent successfully',
      data: {
        interviewId,
        createdAt: result.rows[0].created_at,
        meetingLink: finalMeetingLink
      }
    });

  } catch (error) {
    console.error('❌ Error creating interview invitation:', error);
    
    // Check if it's a database table error
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return res.status(503).json({
        success: false,
        error: 'Interview system is being set up',
        message: 'The interview scheduling system is currently being set up. Database tables are being created. Please try again in a few minutes.',
        type: 'SETUP_IN_PROGRESS'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create interview invitation',
      message: 'There was an issue creating the interview. Please try again later.'
    });
  }
});

// Generate AI interview preparation content
router.post("/prepare-ai", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth || auth.userType !== 'recruiter') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Recruiter access required'
      });
    }

    const {
      jobPostingId,
      candidateId,
      resumeId,
      interviewType = 'technical',
      interviewMode = 'video_call',
      interviewDateTime,
      durationMinutes
    } = req.body;

    if (!jobPostingId || (!candidateId && !resumeId)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobPostingId and (candidateId or resumeId)'
      });
    }

    const db = await getDatabase();

    // Get job posting details
    const jobQuery = await db.query(
      'SELECT title, description, requirements, company FROM job_postings WHERE id = $1 AND recruiter_id = $2',
      [jobPostingId, auth.userId]
    );

    if (jobQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found or not owned by recruiter'
      });
    }

    const job = jobQuery.rows[0];

    // Get candidate resume details
    let resumeQuery;
    if (candidateId) {
      resumeQuery = await db.query(
        `SELECT r.*, r.personal_info->>'name' as candidate_name, r.summary, r.skills, r.experience
         FROM resumes r 
         WHERE r.user_id = $1 
         ORDER BY r.updated_at DESC 
         LIMIT 1`,
        [candidateId]
      );
    } else {
      resumeQuery = await db.query(
        `SELECT r.*, r.personal_info->>'name' as candidate_name, r.summary, r.skills, r.experience
         FROM resumes r 
         WHERE r.id = $1`,
        [resumeId]
      );
    }

    if (resumeQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const resume = resumeQuery.rows[0];

    // Prepare data for AI with better error handling
    const jobDescription = `${job.description || 'No description provided'}\n\nRequirements:\n${job.requirements || 'Not specified'}`;
    const candidateName = resume.candidate_name || 'Candidate';
    const candidateResume = `Name: ${candidateName}\n\nSummary: ${resume.summary || 'Not provided'}\n\nExperience: ${JSON.stringify(resume.experiences || [])}`;
    
    // Handle skills array safely
    let candidateSkills: string[] = [];
    try {
      if (Array.isArray(resume.skills)) {
        candidateSkills = resume.skills.map((skill: any) => {
          if (typeof skill === 'string') return skill;
          if (skill && skill.name) return skill.name;
          return String(skill);
        }).filter(Boolean);
      }
    } catch (skillError) {
      console.warn('⚠️ Error processing candidate skills:', skillError);
      candidateSkills = [];
    }

    try {
      // Import groqService
      const { groqService } = await import('../services/groqService.js');

      // Generate AI content
      console.log('🤖 Generating AI interview preparation...');
      const aiContent = await groqService.generateInterviewPreparation(
        jobDescription,
        job.title,
        candidateResume,
        candidateSkills,
        interviewType,
        interviewMode,
        interviewDateTime,
        durationMinutes
      );

      console.log('✅ AI interview preparation generated successfully');

      res.json({
        success: true,
        data: {
          description: aiContent.description,
          instructions: aiContent.instructions,
          internalNotes: aiContent.internalNotes,
          jobTitle: job.title,
          candidateName: candidateName
        }
      });

    } catch (aiError) {
      console.error('❌ AI generation error:', aiError);
      
      // Return fallback content instead of error
      res.json({
        success: true,
        data: {
          description: `This interview will assess the candidate's qualifications for the ${job.title} position. We'll discuss their experience, technical skills, and cultural fit through a collaborative conversation.`,
          instructions: `Please prepare by:\n• Reviewing the job description and company information\n• Preparing examples of relevant experience with specific details\n• Having thoughtful questions ready about the role and company culture\n• Ensuring stable internet connection for video calls\n• Being authentic and honest - this is a mutual evaluation process\n• Avoiding any form of misrepresentation or dishonesty\n• Remember: this is a professional conversation, not an interrogation\n• Feel comfortable to ask for clarification if needed`,
          internalNotes: `Focus areas:\n• Technical competency assessment\n• Cultural fit evaluation\n• Communication skills and authenticity\n• Problem-solving approach\n• Create a welcoming, collaborative atmosphere\n• Encourage open dialogue rather than one-sided questioning\n• Assess genuine interest and motivation\n• Questions about role expectations and growth opportunities`,
          jobTitle: job.title,
          candidateName: candidateName
        }
      });
    }

  } catch (error) {
    console.error('❌ Error generating AI interview preparation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate interview preparation content',
      message: error.message
    });
  }
});

// Update interview invitation (recruiter only)
router.put("/:interviewId/update", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth || auth.userType !== 'recruiter') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Recruiter access required'
      });
    }

    const { interviewId } = req.params;
    const updateData = req.body;

    const db = await getDatabase();

    // Verify interview exists and belongs to recruiter
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, status FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];

    if (interview.recruiter_id !== auth.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this interview'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'interview_type', 'interview_round_type',
      'proposed_datetime', 'duration_minutes', 'timezone',
      'meeting_link', 'meeting_location', 'meeting_instructions',
      'recruiter_notes', 'evaluation_metrics'
    ];

    const fieldMapping = {
      'interviewType': 'interview_type',
      'interviewRoundType': 'interview_round_type',
      'proposedDatetime': 'proposed_datetime',
      'durationMinutes': 'duration_minutes',
      'meetingLink': 'meeting_link',
      'meetingLocation': 'meeting_location',
      'meetingInstructions': 'meeting_instructions',
      'recruiterNotes': 'recruiter_notes',
      'evaluationMetrics': 'evaluation_metrics'
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && value !== null) {
        const dbField = fieldMapping[key] || key;
        if (allowedFields.includes(dbField)) {
          updateFields.push(`${dbField} = $${paramIndex}`);
          // JSON stringify evaluation metrics
          if (dbField === 'evaluation_metrics') {
            updateValues.push(JSON.stringify(value));
          } else {
            updateValues.push(value);
          }
          paramIndex++;
        }
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE interview_invitations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, updated_at
    `;
    updateValues.push(interviewId);

    console.log('🔄 Updating interview:', {
      interviewId,
      updateFields,
      updateValues: updateValues.slice(0, -1) // Don't log the ID
    });

    const result = await db.query(updateQuery, updateValues);

    console.log('✅ Interview updated successfully:', result.rows[0]);

    // Send reschedule email notification to candidate
    try {
      // Get updated interview details with candidate info
      const updatedInterviewQuery = await db.query(`
        SELECT 
          i.*,
          COALESCE(
            NULLIF(TRIM(CONCAT(c.first_name, ' ', c.last_name)), ''),
            NULLIF(TRIM(c.first_name), ''),
            SPLIT_PART(c.email, '@', 1),
            i.guest_candidate_name
          ) as candidate_name,
          COALESCE(c.email, i.guest_candidate_email) as candidate_email,
          rec.first_name || ' ' || rec.last_name as recruiter_name,
          rec.email as recruiter_email,
          jp.company as company_name
        FROM interview_invitations i
        LEFT JOIN users c ON i.candidate_id = c.id
        LEFT JOIN users rec ON i.recruiter_id = rec.id
        LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
        WHERE i.id = $1
      `, [interviewId]);

      if (updatedInterviewQuery.rows.length > 0) {
        const interview = updatedInterviewQuery.rows[0];
        
        if (interview.candidate_email && interview.candidate_name) {
          console.log('📧 Sending reschedule notification email...');
          
          const emailResult = await emailService.sendInterviewRescheduleEmail(
            interview.candidate_email,
            interview.candidate_name,
            interview.recruiter_name || 'Recruiter',
            interview.company_name || 'Company',
            {
              title: interview.title,
              description: interview.description,
              interviewType: interview.interview_type,
              proposedDatetime: interview.proposed_datetime,
              durationMinutes: interview.duration_minutes,
              timezone: interview.timezone,
              meetingLink: interview.meeting_link,
              meetingLocation: interview.meeting_location,
              meetingInstructions: interview.meeting_instructions
            },
            interviewId,
            interview.candidate_id,
            interview.recruiter_email
          );

          if (emailResult.success) {
            console.log('✅ Reschedule notification email sent successfully');
          } else {
            console.error('❌ Failed to send reschedule notification email:', emailResult.error);
          }
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending reschedule notification email:', emailError);
      // Don't fail the update if email fails
    }

    res.json({
      success: true,
      message: 'Interview updated successfully',
      data: {
        interviewId,
        updatedAt: result.rows[0].updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update interview'
    });
  }
});

// Respond to interview invitation (candidate only)
router.post("/respond", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      interviewId,
      status,
      candidateResponse
    }: RespondToInterviewRequest = req.body;

    if (!interviewId || !status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request - interviewId and status (accepted/declined) required'
      });
    }

    const db = await getDatabase();

    // Verify interview exists and belongs to the candidate
    const interviewCheck = await db.query(
      'SELECT id, candidate_id, status FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview invitation not found'
      });
    }

    const interview = interviewCheck.rows[0];

    if (interview.candidate_id !== auth.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to respond to this interview'
      });
    }

    if (interview.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Interview invitation has already been responded to'
      });
    }

    // Update interview status
    await db.query(
      `UPDATE interview_invitations 
       SET status = $1, candidate_response = $2, responded_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [status, candidateResponse, interviewId]
    );

    // Get full interview details for email notification
    const interviewDetailsQuery = await db.query(`
      SELECT 
        i.*,
        COALESCE(rec.first_name || ' ' || rec.last_name, rec.email) as recruiter_name,
        rec.email as recruiter_email,
        COALESCE(c.first_name || ' ' || c.last_name, c.email) as candidate_name,
        c.email as candidate_email,
        comp.name as company_name
      FROM interview_invitations i
      LEFT JOIN users rec ON i.recruiter_id = rec.id
      LEFT JOIN users c ON i.candidate_id = c.id
      LEFT JOIN recruiter_profiles rp ON rec.id = rp.user_id
      LEFT JOIN companies comp ON rp.company_id = comp.id
      WHERE i.id = $1
    `, [interviewId]);

    if (interviewDetailsQuery.rows.length > 0) {
      const interviewData = interviewDetailsQuery.rows[0];
      
      // Send email notification to recruiter
      try {
        await emailService.sendInterviewResponseNotification(
          interviewData.recruiter_email,
          interviewData.recruiter_name || 'Recruiter',
          interviewData.candidate_name || 'Candidate',
          {
            title: interviewData.title,
            proposedDatetime: interviewData.proposed_datetime,
            interviewType: interviewData.interview_type,
            status: status as 'accepted' | 'declined',
            candidateResponse: candidateResponse
          },
          interviewId.toString(),
          interviewData.company_name,
          auth.userId
        );

        console.log('✅ Interview response email sent to recruiter:', {
          recruiterEmail: interviewData.recruiter_email,
          candidateName: interviewData.candidate_name,
          status
        });
      } catch (emailError) {
        console.error('❌ Failed to send interview response email:', emailError);
        // Don't fail the response if email fails
      }
    }

    console.log('✅ Interview response recorded:', {
      interviewId,
      candidateId: auth.userId,
      status,
      hasResponse: !!candidateResponse
    });

    res.json({
      success: true,
      message: `Interview invitation ${status} successfully`,
      data: { status }
    });

  } catch (error) {
    console.error('❌ Error responding to interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to interview invitation'
    });
  }
});

// Request interview reschedule
router.post("/reschedule", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      interviewId,
      newProposedDatetime,
      newDurationMinutes,
      reason
    }: RescheduleInterviewRequest = req.body;

    if (!interviewId || !newProposedDatetime) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID and new proposed datetime are required'
      });
    }

    const db = await getDatabase();

    // Verify interview exists and user is involved
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, candidate_id, status FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];
    const isRecruiter = interview.recruiter_id === auth.userId;
    const isCandidate = interview.candidate_id === auth.userId;

    if (!isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reschedule this interview'
      });
    }

    if (!['pending', 'accepted'].includes(interview.status)) {
      return res.status(400).json({
        success: false,
        error: 'Interview cannot be rescheduled in current status'
      });
    }

    // Create reschedule request
    const result = await db.query(
      `INSERT INTO interview_reschedule_requests (
        interview_id, requested_by, new_proposed_datetime, new_duration_minutes, reason
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at`,
      [
        interviewId,
        isRecruiter ? 'recruiter' : 'candidate',
        newProposedDatetime,
        newDurationMinutes,
        reason
      ]
    );

    // Update interview status to rescheduled
    await db.query(
      'UPDATE interview_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rescheduled', interviewId]
    );

    console.log('✅ Reschedule request created:', {
      requestId: result.rows[0].id,
      interviewId,
      requestedBy: isRecruiter ? 'recruiter' : 'candidate',
      userId: auth.userId
    });

    res.json({
      success: true,
      message: 'Reschedule request submitted successfully',
      data: {
        rescheduleRequestId: result.rows[0].id,
        createdAt: result.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('❌ Error creating reschedule request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reschedule request'
    });
  }
});

// Get interviews for current user with advanced filtering
router.get("/my-interviews", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      // Check if the token format is the issue
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token && token.split('.').length !== 3) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format',
          message: 'The authentication token is not in the correct format. Please log out and log back in.',
          type: 'INVALID_TOKEN_FORMAT',
          details: {
            tokenLength: token.length,
            tokenParts: token.split('.').length,
            expectedParts: 3
          }
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access interviews.',
        type: 'NO_AUTH'
      });
    }

    console.log('✅ Interview auth successful:', { userId: auth.userId, userType: auth.userType });

    // Extract query parameters for filtering
    const {
      status,
      interviewType,
      dateFrom,
      dateTo,
      search,
      sortBy = 'proposed_datetime',
      sortOrder = 'DESC',
      limit,
      offset
    } = req.query;

    // Try to connect to database, but fallback to mock data if it fails
    try {
      const db = await getDatabase();
      
      // Check if interview tables exist
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'interview_invitations'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('⚠️ Interview tables do not exist yet - returning empty array');
        return res.json({
          success: true,
          data: [],
          message: `Interview system is being set up. Tables will be created soon.`
        });
      }

      // Build WHERE clause based on filters
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // User-specific filter
      if (auth.userType === 'recruiter') {
        conditions.push(`i.recruiter_id = $${paramIndex++}`);
        params.push(auth.userId);
      } else {
        conditions.push(`i.candidate_id = $${paramIndex++}`);
        params.push(auth.userId);
      }

      // Status filter
      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        conditions.push(`i.status = ANY($${paramIndex++})`);
        params.push(statuses);
      }

      // Interview type filter
      if (interviewType) {
        const types = Array.isArray(interviewType) ? interviewType : [interviewType];
        conditions.push(`i.interview_type = ANY($${paramIndex++})`);
        params.push(types);
      }

      // Date range filters
      if (dateFrom) {
        conditions.push(`i.proposed_datetime >= $${paramIndex++}`);
        params.push(dateFrom);
      }
      if (dateTo) {
        conditions.push(`i.proposed_datetime <= $${paramIndex++}`);
        params.push(dateTo);
      }

      // Search filter
      if (search && typeof search === 'string') {
        const searchPattern = `%${search.toLowerCase()}%`;
        if (auth.userType === 'recruiter') {
          conditions.push(`(
            LOWER(COALESCE(c.first_name || ' ' || c.last_name, c.email)) LIKE $${paramIndex} OR
            LOWER(c.email) LIKE $${paramIndex} OR
            LOWER(i.title) LIKE $${paramIndex}
          )`);
        } else {
          conditions.push(`(
            LOWER(COALESCE(rec.first_name || ' ' || rec.last_name, rec.email)) LIKE $${paramIndex} OR
            LOWER(rec.email) LIKE $${paramIndex} OR
            LOWER(i.title) LIKE $${paramIndex}
          )`);
        }
        params.push(searchPattern);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Validate sort parameters
      const validSortColumns = ['proposed_datetime', 'status', 'interview_type', 'created_at'];
      const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'proposed_datetime';
      const sortDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      // Build pagination
      let paginationClause = '';
      if (limit) {
        paginationClause += ` LIMIT $${paramIndex++}`;
        params.push(parseInt(limit as string));
      }
      if (offset) {
        paginationClause += ` OFFSET $${paramIndex++}`;
        params.push(parseInt(offset as string));
      }

      // Build query
      const query = auth.userType === 'recruiter' 
        ? `SELECT i.*, 
             COALESCE(c.first_name || ' ' || c.last_name, c.email) as candidate_name, 
             c.email as candidate_email,
             r.title as resume_title,
             ja.status as application_status,
             ja.recruiter_feedback
           FROM interview_invitations i
           LEFT JOIN users c ON i.candidate_id = c.id
           LEFT JOIN resumes r ON i.resume_id = r.id
           LEFT JOIN job_applications ja ON ja.user_id = i.candidate_id AND ja.job_id = i.job_posting_id
           ${whereClause}
           ORDER BY i.${sortColumn} ${sortDirection}
           ${paginationClause}`
        : `SELECT i.*, 
             COALESCE(rec.first_name || ' ' || rec.last_name, rec.email) as recruiter_name, 
             rec.email as recruiter_email,
             r.title as resume_title,
             ja.status as application_status,
             ja.recruiter_feedback
           FROM interview_invitations i
           LEFT JOIN users rec ON i.recruiter_id = rec.id
           LEFT JOIN resumes r ON i.resume_id = r.id
           LEFT JOIN job_applications ja ON ja.user_id = i.candidate_id AND ja.job_id = i.job_posting_id
           ${whereClause}
           ORDER BY i.${sortColumn} ${sortDirection}
           ${paginationClause}`;

      console.log('🔍 Executing filtered query:', query);
      console.log('🔍 Query parameters:', params);

      const result = await db.query(query, params);
      
      console.log('🔍 Query result:', {
        rowCount: result.rows.length,
        filters: { status, interviewType, dateFrom, dateTo, search }
      });

      // If no results with JOINs, try a simpler query
      if (result.rows.length === 0) {
        console.log('🔍 No results with JOINs, trying simple query...');
        const simpleQuery = auth.userType === 'recruiter' 
          ? 'SELECT * FROM interview_invitations WHERE recruiter_id = $1 ORDER BY created_at DESC'
          : 'SELECT * FROM interview_invitations WHERE candidate_id = $1 ORDER BY created_at DESC';
        
        const simpleResult = await db.query(simpleQuery, [auth.userId]);
        console.log('🔍 Simple query result:', {
          rowCount: simpleResult.rows.length,
          rows: simpleResult.rows
        });
        
        if (simpleResult.rows.length > 0) {
          // Return simplified interview data without JOINs
          const interviews: InterviewInvitation[] = simpleResult.rows.map(row => ({
            id: row.id,
            recruiterId: row.recruiter_id,
            candidateId: row.candidate_id,
            resumeId: row.resume_id,
            jobPostingId: row.job_posting_id,
            applicationId: row.application_id,
            interviewRound: row.interview_round,
            
            title: row.title,
            description: row.description,
            interviewType: row.interview_type,
            interviewRoundType: row.interview_round_type,
            
            proposedDatetime: row.proposed_datetime,
            durationMinutes: row.duration_minutes,
            timezone: row.timezone,
            
            meetingLink: row.meeting_link,
            meetingLocation: row.meeting_location,
            meetingInstructions: row.meeting_instructions,
            
            status: row.status,
            candidateResponse: row.candidate_response,
            recruiterNotes: row.recruiter_notes,
            evaluationMetrics: row.evaluation_metrics ? 
              (typeof row.evaluation_metrics === 'string' ? JSON.parse(row.evaluation_metrics) : row.evaluation_metrics) : [],
            
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            respondedAt: row.responded_at,
            
            // Simplified data without JOINs
            recruiter: {
              id: row.recruiter_id,
              name: 'Recruiter',
              email: 'recruiter@company.com'
            },
            candidate: {
              id: row.candidate_id,
              name: 'Candidate',
              email: 'candidate@company.com'
            },
            resume: {
              id: row.resume_id,
              title: 'Resume'
            }
          }));

          return res.json({
            success: true,
            data: interviews,
            message: 'Interviews found (simplified data)'
          });
        }
      }
      
      const interviews: InterviewInvitation[] = result.rows.map(row => ({
        id: row.id,
        recruiterId: row.recruiter_id,
        candidateId: row.candidate_id,
        resumeId: row.resume_id,
        jobPostingId: row.job_posting_id,
        applicationId: row.application_id,
        interviewRound: row.interview_round,
        
        title: row.title,
        description: row.description,
        interviewType: row.interview_type,
        interviewRoundType: row.interview_round_type,
        
        proposedDatetime: row.proposed_datetime,
        durationMinutes: row.duration_minutes,
        timezone: row.timezone,
        
        meetingLink: row.meeting_link,
        meetingLocation: row.meeting_location,
        meetingInstructions: row.meeting_instructions,
        
        status: row.status,
        candidateResponse: row.candidate_response,
        recruiterNotes: row.recruiter_notes,
        evaluationMetrics: row.evaluation_metrics ? 
          (typeof row.evaluation_metrics === 'string' ? JSON.parse(row.evaluation_metrics) : row.evaluation_metrics) : [],
        
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        respondedAt: row.responded_at,
        
        // Include feedback data
        applicationStatus: row.application_status,
        recruiterFeedback: row.recruiter_feedback,
        
        ...(auth.userType === 'job_seeker' && {
          recruiter: {
            id: row.recruiter_id,
            name: row.recruiter_name,
            email: row.recruiter_email,
            company: 'Company' // Default since we removed the company JOIN
          }
        }),
        
        ...(auth.userType === 'recruiter' && {
          candidate: {
            id: row.candidate_id,
            name: row.candidate_name,
            email: row.candidate_email
          }
        }),
        
        resume: {
          id: row.resume_id,
          title: row.resume_title
        }
      }));

      res.json({
        success: true,
        data: interviews
      });

    } catch (dbError) {
      console.log('⚠️ Database connection failed:', dbError.message);
      
      // Return empty array instead of mock data - let the UI show "no interviews" state
      res.json({
        success: true,
        data: [],
        message: `Database connection failed. Please check server configuration.`,
        error: 'DATABASE_CONNECTION_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ Error in my-interviews endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews',
      message: error.message
    });
  }
});

// Get specific interview details
router.get("/:interviewId", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { interviewId } = req.params;

    const db = await getDatabase();

    const result = await db.query(`
      SELECT 
        i.*,
        c.name as candidate_name,
        c.email as candidate_email,
        rec.name as recruiter_name,
        rec.email as recruiter_email,
        rp.company_name as recruiter_company,
        r.title as resume_title,
        jp.title as job_title,
        jp.company as job_company
      FROM interview_invitations i
      JOIN users c ON i.candidate_id = c.id
      JOIN users rec ON i.recruiter_id = rec.id
      LEFT JOIN recruiter_profiles rp ON rec.id = rp.user_id
      JOIN resumes r ON i.resume_id = r.id
      LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
      WHERE i.id = $1
    `, [interviewId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const row = result.rows[0];

    // Check if user is authorized to view this interview
    if (row.recruiter_id !== auth.userId && row.candidate_id !== auth.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this interview'
      });
    }

    const interview: InterviewInvitation = {
      id: row.id,
      recruiterId: row.recruiter_id,
      candidateId: row.candidate_id,
      resumeId: row.resume_id,
      jobPostingId: row.job_posting_id,
      applicationId: row.application_id,
      interviewRound: row.interview_round,
      
      title: row.title,
      description: row.description,
      interviewType: row.interview_type,
      interviewRoundType: row.interview_round_type,
      
      proposedDatetime: row.proposed_datetime,
      durationMinutes: row.duration_minutes,
      timezone: row.timezone,
      
      meetingLink: row.meeting_link,
      meetingLocation: row.meeting_location,
      meetingInstructions: row.meeting_instructions,
      
      status: row.status,
      candidateResponse: row.candidate_response,
      recruiterNotes: row.recruiter_notes,
      evaluationMetrics: row.evaluation_metrics ? 
        (typeof row.evaluation_metrics === 'string' ? JSON.parse(row.evaluation_metrics) : row.evaluation_metrics) : [],
      
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      respondedAt: row.responded_at,
      
      candidate: {
        id: row.candidate_id,
        name: row.candidate_name,
        email: row.candidate_email
      },
      
      recruiter: {
        id: row.recruiter_id,
        name: row.recruiter_name,
        email: row.recruiter_email,
        company: row.recruiter_company
      },
      
      resume: {
        id: row.resume_id,
        title: row.resume_title
      },
      
      ...(row.job_posting_id && {
        jobPosting: {
          id: row.job_posting_id,
          title: row.job_title,
          company: row.job_company
        }
      })
    };

    res.json({
      success: true,
      data: interview
    });

  } catch (error) {
    console.error('❌ Error fetching interview details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview details'
    });
  }
});

// Cancel interview
router.post("/:interviewId/cancel", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { interviewId } = req.params;
    const { reason } = req.body;

    const db = await getDatabase();

    // Verify interview exists and user is authorized
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, candidate_id, status FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];
    const isRecruiter = interview.recruiter_id === auth.userId;
    const isCandidate = interview.candidate_id === auth.userId;

    if (!isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this interview'
      });
    }

    if (interview.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Interview is already cancelled'
      });
    }

    // Update interview status
    const updateField = isRecruiter ? 'recruiter_notes' : 'candidate_response';
    await db.query(
      `UPDATE interview_invitations 
       SET status = 'cancelled', ${updateField} = $1, updated_at = NOW()
       WHERE id = $2`,
      [reason || 'Interview cancelled', interviewId]
    );

    console.log('✅ Interview cancelled:', {
      interviewId,
      cancelledBy: isRecruiter ? 'recruiter' : 'candidate',
      userId: auth.userId
    });

    res.json({
      success: true,
      message: 'Interview cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Error cancelling interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel interview'
    });
  }
});

// Mark interview as completed
router.post("/:interviewId/complete", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { interviewId } = req.params;
    const { decision, feedback, evaluationMetrics } = req.body;

    const db = await getDatabase();

    // Verify interview exists and user is authorized
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, candidate_id, resume_id, status, job_posting_id FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];
    const isRecruiter = interview.recruiter_id === auth.userId;
    const isCandidate = interview.candidate_id === auth.userId;

    if (!isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to mark this interview as completed'
      });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Interview is already marked as completed'
      });
    }

    if (interview.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Only accepted interviews can be marked as completed'
      });
    }

    // Update interview status to completed and store evaluation metrics
    await db.query(
      `UPDATE interview_invitations 
       SET status = 'completed', evaluation_metrics = $2, updated_at = NOW()
       WHERE id = $1`,
      [interviewId, evaluationMetrics ? JSON.stringify(evaluationMetrics) : null]
    );

    // If recruiter provided decision and feedback, update the application and send notification
    if (isRecruiter && decision && interview.candidate_id && interview.job_posting_id) {
      console.log('📝 Processing feedback:', {
        decision,
        feedback,
        evaluationMetrics: evaluationMetrics ? evaluationMetrics.length : 0,
        candidateId: interview.candidate_id,
        jobPostingId: interview.job_posting_id,
        resumeId: interview.resume_id
      });

      // Map decision to application status
      const applicationStatus = decision === 'hired' ? 'accepted' : decision === 'rejected' ? 'rejected' : 'under_review';
      
      // Update or create application record
      const applicationCheck = await db.query(
        'SELECT id FROM job_applications WHERE user_id = $1 AND job_id = $2',
        [interview.candidate_id, interview.job_posting_id]
      );

      console.log('📝 Application check result:', {
        found: applicationCheck.rows.length > 0,
        applicationId: applicationCheck.rows[0]?.id
      });

      if (applicationCheck.rows.length > 0) {
        // Update existing application
        const updateResult = await db.query(
          `UPDATE job_applications 
           SET status = $1, recruiter_feedback = $2, updated_at = NOW()
           WHERE id = $3
           RETURNING id, status, recruiter_feedback`,
          [applicationStatus, feedback || null, applicationCheck.rows[0].id]
        );
        console.log('✅ Updated existing application:', updateResult.rows[0]);
      } else {
        // Create new application record - need resume_id
        if (!interview.resume_id) {
          console.warn('⚠️ Cannot create application: resume_id is missing');
        } else {
          const insertResult = await db.query(
            `INSERT INTO job_applications (user_id, job_id, resume_id, status, recruiter_feedback, applied_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             RETURNING id, status, recruiter_feedback`,
            [interview.candidate_id, interview.job_posting_id, interview.resume_id, applicationStatus, feedback || null]
          );
          console.log('✅ Created new application:', insertResult.rows[0]);
        }
      }

      // Store feedback in interview_feedback table
      if (feedback || decision) {
        try {
          // Calculate overall rating from evaluation metrics if available
          let overallRating = null;

          if (evaluationMetrics && Array.isArray(evaluationMetrics)) {
            const scoredMetrics = evaluationMetrics.filter(m => m.checked && m.score);
            
            console.log('📊 Processing evaluation metrics:', {
              totalMetrics: evaluationMetrics.length,
              scoredMetrics: scoredMetrics.length,
              metrics: scoredMetrics.map(m => ({ metric: m.metric, score: m.score }))
            });
            
            if (scoredMetrics.length > 0) {
              // Calculate overall rating - scores are already on 1-10 scale
              const avgScore = scoredMetrics.reduce((sum, metric) => {
                return sum + parseFloat(metric.score || '0');
              }, 0) / scoredMetrics.length;
              
              // Ensure rating is between 1.0 and 10.0, round to one decimal place
              overallRating = Math.max(1.0, Math.min(10.0, Math.round(avgScore * 10) / 10));
              
              console.log('📊 Rating calculation details:', {
                rawScores: scoredMetrics.map(m => parseFloat(m.score || '0')),
                avgScore: avgScore,
                finalRating: overallRating
              });
            }
          }

          console.log('📝 Storing feedback in interview_feedback table:', {
            interviewId,
            providedBy: auth.userId,
            hasFeedback: !!feedback,
            hasDecision: !!decision,
            hasEvaluationMetrics: !!(evaluationMetrics && evaluationMetrics.length > 0),
            calculatedRating: overallRating
          });

          // Map decision to hiring status
          const hiringStatus = decision === 'hired' ? 'hired' : decision === 'rejected' ? 'rejected' : 'hold';

          const feedbackResult = await db.query(
            `INSERT INTO interview_feedback (
              interview_id, 
              provided_by, 
              rating, 
              feedback_text, 
              hiring_status
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [
              interviewId,
              auth.userId,
              overallRating,
              feedback || null,
              hiringStatus
            ]
          );

          console.log('✅ Stored feedback in interview_feedback table:', {
            feedbackId: feedbackResult.rows[0].id,
            interviewId,
            providedBy: auth.userId,
            overallRating,
            hiringStatus,
            hasFeedbackText: !!feedback
          });
        } catch (feedbackError) {
          console.error('❌ Failed to store interview feedback:', feedbackError);
          console.error('❌ Feedback error details:', {
            message: feedbackError.message,
            stack: feedbackError.stack
          });
          // Don't fail the completion if feedback storage fails
        }
      }

      // Send email notification to candidate about the decision
      try {
        // Get candidate and recruiter details for email
        const emailDetailsQuery = await db.query(`
          SELECT 
            c.email as candidate_email,
            COALESCE(c.first_name || ' ' || c.last_name, c.email) as candidate_name,
            COALESCE(rec.first_name || ' ' || rec.last_name, rec.email) as recruiter_name,
            comp.name as company_name,
            jp.title as job_title,
            i.title as interview_title,
            i.proposed_datetime
          FROM interview_invitations i
          LEFT JOIN users c ON i.candidate_id = c.id
          LEFT JOIN users rec ON i.recruiter_id = rec.id
          LEFT JOIN recruiter_profiles rp ON rec.id = rp.user_id
          LEFT JOIN companies comp ON rp.company_id = comp.id
          LEFT JOIN job_postings jp ON i.job_posting_id = jp.id
          WHERE i.id = $1
        `, [interviewId]);

        if (emailDetailsQuery.rows.length > 0) {
          const emailData = emailDetailsQuery.rows[0];
          
          await emailService.sendInterviewDecisionNotification(
            emailData.candidate_email,
            emailData.candidate_name || 'Candidate',
            emailData.recruiter_name || 'Recruiter',
            emailData.company_name || 'Company',
            {
              title: emailData.interview_title,
              proposedDatetime: emailData.proposed_datetime,
              decision: decision as 'hired' | 'rejected' | 'hold',
              feedback: feedback,
              evaluationMetrics: evaluationMetrics
            },
            emailData.job_title,
            interview.candidate_id
          );

          console.log('✅ Interview decision email sent to candidate:', {
            candidateEmail: emailData.candidate_email,
            decision,
            companyName: emailData.company_name
          });
        }
      } catch (emailError) {
        console.error('❌ Failed to send interview decision email:', emailError);
        // Don't fail the completion if email fails
      }

      console.log('✅ Application updated with interview feedback:', {
        candidateId: interview.candidate_id,
        jobPostingId: interview.job_posting_id,
        decision,
        status: applicationStatus
      });
    } else {
      console.log('⚠️ Skipping feedback update:', {
        isRecruiter,
        hasDecision: !!decision,
        hasCandidateId: !!interview.candidate_id,
        hasJobPostingId: !!interview.job_posting_id
      });
    }

    console.log('✅ Interview marked as completed:', {
      interviewId,
      markedBy: isRecruiter ? 'recruiter' : 'candidate',
      userId: auth.userId,
      decision: decision || 'none',
      hasFeedback: !!feedback,
      hasEvaluationMetrics: !!evaluationMetrics
    });

    res.json({
      success: true,
      message: 'Interview marked as completed successfully'
    });

  } catch (error) {
    console.error('❌ Error marking interview as completed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark interview as completed'
    });
  }
});

// Get interview feedback
router.get("/:interviewId/feedback", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { interviewId } = req.params;
    const db = await getDatabase();

    // Verify interview exists and user is authorized
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, candidate_id FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];
    const isRecruiter = interview.recruiter_id === auth.userId;
    const isCandidate = interview.candidate_id === auth.userId;

    if (!isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this interview feedback'
      });
    }

    // Get feedback from interview_feedback table
    const feedbackQuery = await db.query(`
      SELECT 
        if.*,
        COALESCE(u.first_name || ' ' || u.last_name, u.email) as provider_name
      FROM interview_feedback if
      LEFT JOIN users u ON if.provided_by = u.id
      WHERE if.interview_id = $1
      ORDER BY if.created_at DESC
    `, [interviewId]);

    const feedback = feedbackQuery.rows.map(row => ({
      id: row.id,
      interviewId: row.interview_id,
      providedBy: row.provided_by,
      providerName: row.provider_name,
      rating: row.rating,
      feedbackText: row.feedback_text,
      hiringStatus: row.hiring_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log('✅ Retrieved interview feedback:', {
      interviewId,
      feedbackCount: feedback.length,
      requestedBy: auth.userId
    });

    res.json({
      success: true,
      data: feedback
    });

  } catch (error) {
    console.error('❌ Error retrieving interview feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve interview feedback'
    });
  }
});

export default router;