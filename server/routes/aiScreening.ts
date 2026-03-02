import { Router, Request, Response } from 'express';
import { aiResumeScreeningService } from '../services/aiResumeScreeningService.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * POST /api/ai-screening/screen-candidates-stream
 * Screen candidates using AI with streaming results (Server-Sent Events)
 */
router.post('/screen-candidates-stream', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  try {
    let { candidates, jobRequirements } = req.body;

    // If no candidates provided, fetch all from database
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      console.log('📊 No candidates provided, fetching all from database...');
      
      const { getDatabase } = await import('../database/connection.js');
      const db = await getDatabase();
      
      // Fetch all users with resumes
      const usersResult = await db.query(`
        SELECT DISTINCT 
          u.id as user_id,
          u.email,
          r.id as resume_id,
          r.personal_info,
          r.skills,
          r.updated_at
        FROM users u
        INNER JOIN resumes r ON u.id = r.user_id
        WHERE r.id IS NOT NULL
        ORDER BY r.updated_at DESC
      `);
      
      candidates = usersResult.rows.map((row: any) => {
        const personalInfo = typeof row.personal_info === 'string' 
          ? JSON.parse(row.personal_info) 
          : row.personal_info;
        const skills = typeof row.skills === 'string'
          ? JSON.parse(row.skills)
          : row.skills;
        
        // Extract name with better fallback logic
        let firstName = 'Unknown';
        let lastName = '';
        let fullName = 'Unknown Candidate';
        
        // Try personal_info first
        if (personalInfo) {
          // Check for firstName/lastName (but reject empty strings)
          if (personalInfo.firstName && personalInfo.firstName.trim() !== '') {
            firstName = personalInfo.firstName.trim();
            lastName = (personalInfo.lastName || '').trim();
            fullName = `${firstName} ${lastName}`.trim();
          }
          // Check for name field (but reject empty strings)
          else if (personalInfo.name && personalInfo.name.trim() !== '') {
            fullName = personalInfo.name.trim();
            const nameParts = fullName.split(' ');
            firstName = nameParts[0] || 'Unknown';
            lastName = nameParts.slice(1).join(' ');
          }
          // Check for fullName field (but reject empty strings)
          else if (personalInfo.fullName && personalInfo.fullName.trim() !== '') {
            fullName = personalInfo.fullName.trim();
            const nameParts = fullName.split(' ');
            firstName = nameParts[0] || 'Unknown';
            lastName = nameParts.slice(1).join(' ');
          }
        }
        
        // Fallback to email username if still unknown
        if (fullName === 'Unknown Candidate' || fullName === 'Candidate' || fullName === 'Unknown') {
          if (row.email) {
            const emailUsername = row.email.split('@')[0];
            fullName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).replace(/[._-]/g, ' ');
            firstName = fullName.split(' ')[0];
            lastName = fullName.split(' ').slice(1).join(' ');
          } else {
            fullName = `Candidate ${row.user_id.toString().slice(0, 8)}`;
            firstName = fullName;
          }
        }
          
        return {
          id: row.user_id,
          userId: row.user_id,
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          email: row.email,
          skills: Array.isArray(skills) ? skills : [],
          resumeId: row.resume_id
        };
      });
      
      console.log(`✅ Fetched ${candidates.length} candidates from database`);
    }

    console.log(`📊 AI Screening (streaming) request from recruiter ${decoded.recruiterId || decoded.id}:`, {
      candidatesCount: candidates.length,
      hasJobRequirements: !!jobRequirements
    });

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Fetch full resume data for each candidate
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();
    
    // Log candidate structure for debugging
    console.log('📋 Sample candidate structure:', {
      id: candidates[0]?.id,
      userId: candidates[0]?.userId,
      firstName: candidates[0]?.firstName,
      lastName: candidates[0]?.lastName,
      allKeys: Object.keys(candidates[0] || {})
    });
    
    const candidatesWithResumes = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const resumeResult = await db.query(
            'SELECT id, personal_info, summary, skills, experience, education, projects FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
            [candidate.userId]
          );
          
          if (resumeResult.rows.length === 0) {
            return {
              ...candidate,
              resume: null,
              resumeUrl: null
            };
          }

          const resume = resumeResult.rows[0];
          
          

          // Get or create share token for resume
          const shareTokenResult = await db.query(
            'SELECT share_token FROM resume_shares WHERE resume_id = $1 LIMIT 1',
            [resume.id]
          );

          let shareToken: string;

          if (shareTokenResult.rows.length === 0) {
            // Generate share token: firstname-lastname-random
            const crypto = await import('crypto');
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const personalInfo = typeof resume.personal_info === 'string' 
              ? JSON.parse(resume.personal_info) 
              : resume.personal_info;
            
            const firstName = (personalInfo?.firstName || candidate.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const lastName = (personalInfo?.lastName || candidate.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const slug = lastName ? `${firstName}-${lastName}-${randomSuffix}` : `${firstName}-${randomSuffix}`;

            // Set expiration to 6 months from now
            const expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

            await db.query(
              'INSERT INTO resume_shares (resume_id, user_id, share_token, is_active, expires_at) VALUES ($1, $2, $3, $4, $5)',
              [resume.id, candidate.userId, slug, true, expiresAt]
            );

            shareToken = slug;
            console.log(`✅ Created share token for candidate ${candidate.id}: ${slug}`);
          }
          
          return {
            ...candidate,
            resume: resume,
            resumeUrl: `/shared/resume/${shareToken}`
          };
        } catch (error) {
          console.warn(`⚠️ Failed to fetch resume for candidate ${candidate.id}:`, error);
          return {
            ...candidate,
            resume: null,
            resumeUrl: null
          };
        }
      })
    );

    console.log(`✅ Fetched resumes for ${candidatesWithResumes.filter(c => c.resume).length}/${candidates.length} candidates`);

    // Stream results as they complete (no resume URL mapping - will be fetched on-demand)
    for await (const event of aiResumeScreeningService.screenCandidatesStreaming(
      candidatesWithResumes,
      jobRequirements
    )) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('❌ AI screening stream error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', data: { error: 'Streaming failed' } })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/ai-screening/screen-candidates
 * Screen candidates using AI with dataset-trained criteria (non-streaming)
 */
router.post('/screen-candidates', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  try {
    const { candidates, jobRequirements } = req.body;

    if (!candidates || !Array.isArray(candidates)) {
      return res.status(400).json({
        success: false,
        error: 'Candidates array is required'
      });
    }

    console.log(`📊 AI Screening request from recruiter ${decoded.recruiterId || decoded.id}:`, {
      candidatesCount: candidates.length,
      hasJobRequirements: !!jobRequirements
    });

    // Fetch full resume data for each candidate
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();
    
    const candidatesWithResumes = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const resumeResult = await db.query(
            'SELECT id, personal_info, summary, skills, experience, education, projects FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
            [candidate.userId]
          );
          
          if (resumeResult.rows.length === 0) {
            return {
              ...candidate,
              resume: null,
              resumeUrl: null
            };
          }

          const resume = resumeResult.rows[0];
          
          

          // Get or create share token for resume
          const shareTokenResult = await db.query(
            'SELECT share_token FROM resume_shares WHERE resume_id = $1 LIMIT 1',
            [resume.id]
          );

          let shareToken: string;

          if (shareTokenResult.rows.length === 0) {
            // Generate share token: firstname-lastname-random
            const crypto = await import('crypto');
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const personalInfo = typeof resume.personal_info === 'string' 
              ? JSON.parse(resume.personal_info) 
              : resume.personal_info;
            
            const firstName = (personalInfo?.firstName || candidate.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const lastName = (personalInfo?.lastName || candidate.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const slug = lastName ? `${firstName}-${lastName}-${randomSuffix}` : `${firstName}-${randomSuffix}`;

            // Set expiration to 6 months from now
            const expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

            await db.query(
              'INSERT INTO resume_shares (resume_id, user_id, share_token, is_active, expires_at) VALUES ($1, $2, $3, $4, $5)',
              [resume.id, candidate.userId, slug, true, expiresAt]
            );

            shareToken = slug;
            console.log(`✅ Created share token for candidate ${candidate.id}: ${slug}`);
          }
          
          return {
            ...candidate,
            resume: resume,
            resumeUrl: `/shared/resume/${shareToken}`
          };
        } catch (error) {
          console.warn(`⚠️ Failed to fetch resume for candidate ${candidate.id}:`, error);
          return {
            ...candidate,
            resume: null,
            resumeUrl: null
          };
        }
      })
    );

    console.log(`✅ Fetched resumes for ${candidatesWithResumes.filter(c => c.resume).length}/${candidates.length} candidates`);

    const result = await aiResumeScreeningService.screenCandidates(
      candidatesWithResumes,
      jobRequirements
    );

    // Map resume URLs to results
    if (result.success && result.screenedCandidates) {
      result.screenedCandidates = result.screenedCandidates.map((screened: any) => {
        const candidate = candidatesWithResumes.find(c => 
          c.id === screened.id || 
          c.userId === screened.id ||
          c.id === screened.candidateId || 
          c.userId === screened.candidateId
        );
        console.log(`📋 Mapping resume URL for result ID ${screened.id}:`, candidate?.resumeUrl || 'NOT FOUND');
        return {
          ...screened,
          resumeUrl: candidate?.resumeUrl || null
        };
      });
    }

    console.log(`✅ Returning ${result.screenedCandidates?.length || 0} results with resume URLs`);
    res.json(result);

  } catch (error) {
    console.error('❌ AI screening error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to screen candidates'
    });
  }
});

/**
 * GET /api/ai-screening/stats
 * Get screening statistics from dataset
 */
router.get('/stats', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  try {
    await aiResumeScreeningService.initialize();
    const stats = aiResumeScreeningService.getScreeningStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Failed to get screening stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get screening statistics'
    });
  }
});

/**
 * GET /api/ai-screening/resume-url/:userId
 * Get or create resume share URL for a candidate (on-demand)
 */
router.get('/resume-url/:userId', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }

  try {
    const { userId } = req.params;

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Get user's resume (PostgreSQL syntax)
    const resumeResult = await db.query(
      'SELECT id, personal_info FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const resume = resumeResult.rows[0];

    // Get or create share token (PostgreSQL syntax)
    const shareTokenResult = await db.query(
      'SELECT share_token FROM resume_shares WHERE resume_id = $1 LIMIT 1',
      [resume.id]
    );

    let shareToken: string;

    if (shareTokenResult.rows.length === 0) {
      // Generate share token
      const crypto = await import('crypto');
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      const personalInfo = typeof resume.personal_info === 'string' 
        ? JSON.parse(resume.personal_info) 
        : resume.personal_info;
      
      const firstName = (personalInfo?.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const lastName = (personalInfo?.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const slug = lastName ? `${firstName}-${lastName}-${randomSuffix}` : `${firstName}-${randomSuffix}`;

      await db.query(
        'INSERT INTO resume_shares (resume_id, user_id, share_token, is_active) VALUES ($1, $2, $3, $4)',
        [resume.id, userId, slug, true]
      );

      shareToken = slug;
    } else {
      shareToken = shareTokenResult.rows[0].share_token;
    }

    res.json({
      success: true,
      data: {
        resumeUrl: `/shared/resume/${shareToken}`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching resume URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resume URL'
    });
  }
});

export default router;
