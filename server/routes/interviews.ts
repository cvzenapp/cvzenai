import express from "express";
import { getDatabase } from "../database/connection.js";
import jwt from 'jsonwebtoken';
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
      title,
      description,
      interviewType,
      proposedDatetime,
      durationMinutes = 60,
      timezone = 'UTC',
      meetingLink,
      meetingLocation,
      meetingInstructions,
      recruiterNotes,
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
        `SELECT u.id, u.email, COALESCE(r.personal_info->>'name', u.email) as name, r.id as resume_id, r.title as resume_title
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

    // Create interview invitation
    console.log('📝 Creating interview invitation with values:', {
      recruiter_id: auth.userId,
      candidate_id: candidateId,
      resume_id: resumeId,
      job_posting_id: jobPostingId,
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
          recruiter_id, guest_candidate_name, guest_candidate_email, job_posting_id,
          title, description, interview_type,
          proposed_datetime, duration_minutes, timezone,
          meeting_link, meeting_location, meeting_instructions,
          recruiter_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, created_at`
      : `
        INSERT INTO interview_invitations (
          recruiter_id, candidate_id, resume_id, job_posting_id,
          title, description, interview_type,
          proposed_datetime, duration_minutes, timezone,
          meeting_link, meeting_location, meeting_instructions,
          recruiter_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, created_at`,
      isGuestCandidate ? [
        auth.userId, guestCandidateName, guestCandidateEmail, jobPostingId,
        title, description, interviewType || 'video_call',
        proposedDatetime, durationMinutes, timezone,
        meetingLink, meetingLocation, meetingInstructions,
        recruiterNotes
      ] : [
        auth.userId, candidateId, resumeId, jobPostingId,
        title, description, interviewType || 'video_call',
        proposedDatetime, durationMinutes, timezone,
        meetingLink, meetingLocation, meetingInstructions,
        recruiterNotes
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
            
            title: row.title,
            description: row.description,
            interviewType: row.interview_type,
            
            proposedDatetime: row.proposed_datetime,
            durationMinutes: row.duration_minutes,
            timezone: row.timezone,
            
            meetingLink: row.meeting_link,
            meetingLocation: row.meeting_location,
            meetingInstructions: row.meeting_instructions,
            
            status: row.status,
            candidateResponse: row.candidate_response,
            recruiterNotes: row.recruiter_notes,
            
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
        
        title: row.title,
        description: row.description,
        interviewType: row.interview_type,
        
        proposedDatetime: row.proposed_datetime,
        durationMinutes: row.duration_minutes,
        timezone: row.timezone,
        
        meetingLink: row.meeting_link,
        meetingLocation: row.meeting_location,
        meetingInstructions: row.meeting_instructions,
        
        status: row.status,
        candidateResponse: row.candidate_response,
        recruiterNotes: row.recruiter_notes,
        
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
      
      title: row.title,
      description: row.description,
      interviewType: row.interview_type,
      
      proposedDatetime: row.proposed_datetime,
      durationMinutes: row.duration_minutes,
      timezone: row.timezone,
      
      meetingLink: row.meeting_link,
      meetingLocation: row.meeting_location,
      meetingInstructions: row.meeting_instructions,
      
      status: row.status,
      candidateResponse: row.candidate_response,
      recruiterNotes: row.recruiter_notes,
      
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
    const { decision, feedback } = req.body;

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

    // Update interview status to completed
    await db.query(
      `UPDATE interview_invitations 
       SET status = 'completed', updated_at = NOW()
       WHERE id = $1`,
      [interviewId]
    );

    // If recruiter provided decision and feedback, update the application
    if (isRecruiter && decision && interview.candidate_id && interview.job_posting_id) {
      console.log('📝 Processing feedback:', {
        decision,
        feedback,
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
      hasFeedback: !!feedback
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

export default router;