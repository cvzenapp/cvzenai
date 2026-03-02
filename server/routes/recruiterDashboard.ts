import { Router, Request, Response } from "express";
import { getDatabase } from "../database/connection.js";
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to authenticate recruiter and get recruiter ID
async function authenticateRecruiter(req: Request): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Check if this is a recruiter token
    if (decoded.type === 'recruiter' && decoded.userId) {
      // Return the user_id directly (not the recruiter_profiles.id)
      return decoded.userId;
    }
    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Get recruiter dashboard statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const db = await getDatabase();

    // Get recruiter response statistics
    let recruiterStats;
    try {
      const result = await db.query(
        `
        SELECT 
          COUNT(*) as "totalCandidatesContacted",
          COUNT(CASE WHEN status != 'rejected' THEN 1 END) as "totalResponsesReceived",
          COUNT(CASE WHEN status = 'interview_scheduled' THEN 1 END) as "totalInterviewsScheduled"
        FROM recruiter_responses 
        WHERE recruiter_id = $1
      `,
        [recruiterId]
      );
      recruiterStats = result.rows[0];
    } catch (error) {
      console.error("Database query error:", error);
      // Use default values if query fails
      recruiterStats = {
        totalCandidatesContacted: 0,
        totalResponsesReceived: 0,
        totalInterviewsScheduled: 0
      };
    }

    // Provide default values and calculate stats
    const totalContacted = recruiterStats?.totalCandidatesContacted || 0;
    const totalResponses = recruiterStats?.totalResponsesReceived || 0;
    const totalInterviews = recruiterStats?.totalInterviewsScheduled || 0;

    const stats = {
      totalCandidatesContacted: totalContacted,
      totalResponsesReceived: totalResponses,
      totalInterviewsScheduled: totalInterviews,
      totalHires: Math.floor(totalInterviews * 0.3), // Estimate 30% hire rate
      responseRate: totalContacted > 0 ? (totalResponses / totalContacted) * 100 : 0,
      avgTimeToResponse: 2.3,
      thisWeekContacts: Math.floor(totalContacted * 0.15), // Estimate 15% this week
      thisWeekResponses: Math.floor(totalResponses * 0.15),
    };

    res.json(stats);
  } catch (error) {
    console.error("Recruiter stats error:", error);
    res.status(500).json({ error: "Failed to fetch recruiter statistics" });
  }
});

// Search candidates with filters
router.get("/candidates/search", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      query = "",
      location = "all",
      experience = "all",
      availability = "all",
      skills = "",
      page = 1,
      limit = 10,
    } = req.query;

    const db = await getDatabase();

    // Build dynamic search query
    let searchQuery = `
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        u.phone,
        u.location,
        u.avatar_url as avatar,
        u.linkedin_url,
        u.github_url,
        u.portfolio_url as website,
        u.bio as summary,
        r.title,
        r.content,
        r.view_count as views,
        r.updated_at as "lastActive",
        COUNT(rr.id) as "totalResponses"
      FROM users u
      LEFT JOIN resumes r ON u.id = r.user_id AND r.status = 'published'
      LEFT JOIN recruiter_responses rr ON u.id = rr.user_id
      WHERE u.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Add search filters
    if (query && query !== "") {
      searchQuery += ` AND (
        u.first_name ILIKE $${paramIndex} OR 
        u.last_name ILIKE $${paramIndex + 1} OR 
        r.title ILIKE $${paramIndex + 2} OR
        u.bio ILIKE $${paramIndex + 3}
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      paramIndex += 4;
    }

    if (location && location !== "all") {
      searchQuery += ` AND u.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex += 1;
    }

    searchQuery += ` GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.location, u.avatar_url, u.linkedin_url, u.github_url, u.portfolio_url, u.bio, r.title, r.content, r.view_count, r.updated_at ORDER BY u.updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const result = await db.query(searchQuery, params);
    const candidates = result.rows;

    // Format candidate data
    const formattedCandidates = candidates.map((candidate: any) => {
      // Parse resume content to extract additional data
      let resumeData = {};
      try {
        if (candidate.content) {
          resumeData = JSON.parse(candidate.content);
        }
      } catch (error) {
        console.warn("Failed to parse resume content for candidate:", candidate.id);
      }

      // Extract skills from resume content
      // const skills = resumeData.skills?.technical || resumeData.skills || [];
      
      // Extract experience from work history
      // const workExperience = resumeData.workExperience || [];
      // // const totalYears = workExperience.length > 0 ? 
      // //   Math.max(...workExperience.map(job => {
      // //     const years = job.duration ? parseInt(job.duration) : 1;
      // //     return isNaN(years) ? 1 : years;
      // //   })) : 0;
      
      // const experienceText = totalYears > 0 ? `${totalYears}+ years` : "Not specified";

      // Extract education
      // const education = resumeData.education?.[0]?.degree || "Not specified";

      return {
        id: candidate.id.toString(),
        name: candidate.name,
        // title: candidate.title || resumeData.personalInfo?.title || "Software Developer",
        // location: candidate.location || resumeData.personalInfo?.location || "Remote",
        avatar: candidate.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
        email: candidate.email,
        phone: candidate.phone,
        linkedin: candidate.linkedin_url,
        github: candidate.github_url,
        website: candidate.website,
        // summary: candidate.summary || resumeData.personalInfo?.summary || "Passionate developer with experience in modern technologies.",
        // experience: experienceText,
        // education: education,
        skills: Array.isArray(skills) ? skills : [],
        resumeUrl: `/shared/resume/${candidate.id}`,
        isShortlisted: false, // TODO: Check actual shortlist status
        isLiked: false, // TODO: Check actual like status  
        upvotes: Math.floor(candidate.avgUpvotes) || 0,
        views: candidate.views || 0,
        lastActive: formatTimeAgo(new Date(candidate.lastActive)),
        // salaryExpectation: resumeData.personalInfo?.salaryExpectation || "Not specified",
        // availability: resumeData.personalInfo?.availability || "Available",
        rating: 4.0 + (Math.random() * 1.0), // TODO: Implement real rating system
      };
    });

    res.json({
      candidates: formattedCandidates,
      totalCount: formattedCandidates.length,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error("Candidate search error:", error);
    res.status(500).json({ error: "Failed to search candidates" });
  }
});

// Get candidate details
router.get("/candidates/:candidateId", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { candidateId } = req.params;
    const db = await getDatabase();

    const candidateResult = await db.query(
      `
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        u.phone,
        u.location,
        u.avatar_url as avatar,
        u.linkedin_url,
        u.github_url,
        u.portfolio_url as website,
        u.bio as summary,
        u.created_at
      FROM users u
      WHERE u.id = $1 AND u.is_active = true
    `,
      [candidateId]
    );
    
    const candidate = candidateResult.rows[0];

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Get candidate's resumes
    const resumesResult = await db.query(
      `
      SELECT id, title, view_count, download_count, updated_at
      FROM resumes 
      WHERE user_id = $1 AND status = 'published'
      ORDER BY updated_at DESC
    `,
      [candidateId]
    );
    
    const resumes = resumesResult.rows;

    const formattedCandidate = {
      id: candidate.id.toString(),
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      location: candidate.location,
      avatar: candidate.avatar,
      linkedin: candidate.linkedin_url,
      github: candidate.github_url,
      website: candidate.website,
      summary: candidate.summary,
      joinedDate: candidate.created_at,
      resumes: resumes.map((resume: any) => ({
        id: resume.id.toString(),
        title: resume.title,
        views: resume.view_count,
        downloads: resume.download_count,
        lastModified: resume.updated_at,
      })),
    };

    res.json(formattedCandidate);
  } catch (error) {
    console.error("Get candidate error:", error);
    res.status(500).json({ error: "Failed to fetch candidate details" });
  }
});

// Shortlist candidate
router.post(
  "/candidates/:candidateId/shortlist",
  async (req: Request, res: Response) => {
    try {
      const recruiterId = await authenticateRecruiter(req);
      if (!recruiterId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { candidateId } = req.params;
      const { resumeId, position, message } = req.body;

      const db = await getDatabase();

      // Check if already exists
      const existingResult = await db.query(
        `
        SELECT id FROM recruiter_responses 
        WHERE recruiter_id = $1 AND user_id = $2 AND resume_id = $3
      `,
        [recruiterId, candidateId, resumeId]
      );
      
      const existing = existingResult.rows[0];
      let responseId;

      if (existing) {
        // Update existing response
        await db.query(
          `
          UPDATE recruiter_responses 
          SET status = 'shortlisted', message = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
          [message, existing.id]
        );
        responseId = existing.id;
      } else {
        // Create new response
        const insertResult = await db.query(
          `
          INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message)
          VALUES ($1, $2, $3, 'shortlisted', $4)
          RETURNING id
        `,
          [recruiterId, candidateId, resumeId, message]
        );
        responseId = insertResult.rows[0].id;
      }

      // Add activity
      await db.query(
        `
        INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description)
        VALUES ($1, 'shortlist', 'response', $2, $3)
      `,
        [candidateId, responseId, `You were shortlisted by a recruiter`]
      );

      res.json({
        success: true,
        message: "Candidate shortlisted successfully",
      });
    } catch (error) {
      console.error("Shortlist candidate error:", error);
      res.status(500).json({ error: "Failed to shortlist candidate" });
    }
  },
);

// Like candidate
router.post("/candidates/:candidateId/like", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { candidateId } = req.params;
    const { resumeId } = req.body;

    const db = await getDatabase();

    // Check if response exists
    const responseResult = await db.query(
      `
      SELECT id FROM recruiter_responses 
      WHERE recruiter_id = $1 AND user_id = $2 AND resume_id = $3
    `,
      [recruiterId, candidateId, resumeId]
    );
    
    let responseId = responseResult.rows[0]?.id;

    if (!responseId) {
      // Create new response
      const insertResult = await db.query(
        `
        INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message)
        VALUES ($1, $2, $3, 'interested', 'Recruiter showed interest in your profile')
        RETURNING id
      `,
        [recruiterId, candidateId, resumeId]
      );
      responseId = insertResult.rows[0].id;
    }

    // Check if already liked
    const existingLikeResult = await db.query(
      `
      SELECT id FROM response_interactions 
      WHERE user_id = $1 AND response_id = $2 AND interaction_type = 'like'
    `,
      [candidateId, responseId]
    );
    
    const existingLike = existingLikeResult.rows[0];

    if (existingLike) {
      // Remove like
      await db.query(`DELETE FROM response_interactions WHERE id = $1`, [existingLike.id]);
      res.json({ success: true, liked: false });
    } else {
      // Add like
      await db.query(
        `
        INSERT INTO response_interactions (user_id, response_id, interaction_type)
        VALUES ($1, $2, 'like')
      `,
        [candidateId, responseId]
      );
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error("Like candidate error:", error);
    res.status(500).json({ error: "Failed to like candidate" });
  }
});

// Schedule interview
router.post(
  "/candidates/:candidateId/schedule",
  async (req: Request, res: Response) => {
    try {
      const recruiterId = await authenticateRecruiter(req);
      if (!recruiterId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { candidateId } = req.params;
      const {
        resumeId,
        position,
        date,
        time,
        type,
        meetingLink,
        location,
        notes,
      } = req.body;

      const db = await getDatabase();

      // Update or create recruiter response
      const existingResult = await db.query(
        `
        SELECT id FROM recruiter_responses 
        WHERE recruiter_id = $1 AND user_id = $2 AND resume_id = $3
      `,
        [recruiterId, candidateId, resumeId]
      );
      
      const existing = existingResult.rows[0];
      let responseId;

      if (existing) {
        await db.query(
          `
          UPDATE recruiter_responses 
          SET status = 'interview_scheduled', 
              interview_date = $1, 
              interview_time = $2, 
              interview_type = $3,
              meeting_link = $4,
              location = $5,
              notes = $6,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
        `,
          [date, time, type, meetingLink, location, notes, existing.id]
        );
        responseId = existing.id;
      } else {
        const insertResult = await db.query(
          `
          INSERT INTO recruiter_responses (
            recruiter_id, user_id, resume_id, status, message, 
            interview_date, interview_time, interview_type, 
            meeting_link, location, notes
          )
          VALUES ($1, $2, $3, 'interview_scheduled', $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `,
          [
            recruiterId,
            candidateId,
            resumeId,
            `Interview scheduled for ${position}`,
            date,
            time,
            type,
            meetingLink,
            location,
            notes,
          ]
        );
        responseId = insertResult.rows[0].id;
      }

      // Add activity
      await db.query(
        `
        INSERT INTO activities (user_id, activity_type, entity_type, entity_id, description)
        VALUES ($1, 'interview', 'response', $2, $3)
      `,
        [candidateId, responseId, `Interview scheduled for ${date} at ${time}`]
      );

      res.json({ success: true, message: "Interview scheduled successfully" });
    } catch (error) {
      console.error("Schedule interview error:", error);
      res.status(500).json({ error: "Failed to schedule interview" });
    }
  },
);

// Get recruiter's scheduled interviews
router.get("/interviews", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const db = await getDatabase();

    const interviewsResult = await db.query(
      `
      SELECT 
        rr.id,
        rr.user_id as "candidateId",
        u.first_name || ' ' || u.last_name as "candidateName",
        u.avatar_url as "candidateAvatar",
        jp.title as position,
        rr.interview_date as date,
        rr.interview_time as time,
        rr.interview_type as type,
        rr.status,
        rr.meeting_link as "meetingLink",
        rr.location,
        rr.notes
      FROM recruiter_responses rr
      JOIN users u ON rr.user_id = u.id
      LEFT JOIN job_positions jp ON rr.job_position_id = jp.id
      WHERE rr.recruiter_id = $1 AND rr.interview_date IS NOT NULL
      ORDER BY rr.interview_date ASC, rr.interview_time ASC
    `,
      [recruiterId]
    );
    
    const interviews = interviewsResult.rows;

    const formattedInterviews = interviews.map((interview: any) => ({
      id: interview.id.toString(),
      candidateId: interview.candidateId.toString(),
      candidateName: interview.candidateName,
      candidateAvatar:
        interview.candidateAvatar ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      position: interview.position || "Software Developer",
      date: interview.date,
      time: interview.time,
      type: interview.type,
      status:
        interview.status === "interview_scheduled"
          ? "scheduled"
          : interview.status,
      meetingLink: interview.meetingLink,
      location: interview.location,
      notes: interview.notes,
    }));

    res.json(formattedInterviews);
  } catch (error) {
    console.error("Get interviews error:", error);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// Get recruiter's shortlisted candidates
router.get("/shortlisted", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const db = await getDatabase();

    const shortlistedResult = await db.query(
      `
      SELECT 
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.avatar_url as avatar,
        r.title,
        rr.created_at as "shortlistedAt"
      FROM recruiter_responses rr
      JOIN users u ON rr.user_id = u.id
      LEFT JOIN resumes r ON rr.resume_id = r.id
      WHERE rr.recruiter_id = $1 AND rr.status = 'shortlisted'
      ORDER BY rr.created_at DESC
    `,
      [recruiterId]
    );
    
    const shortlisted = shortlistedResult.rows;

    const formattedShortlisted = shortlisted.map((candidate: any) => ({
      id: candidate.id.toString(),
      name: candidate.name,
      title: candidate.title || "Software Developer",
      avatar:
        candidate.avatar ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      shortlistedAt: formatTimeAgo(new Date(candidate.shortlistedAt)),
    }));

    res.json(formattedShortlisted);
  } catch (error) {
    console.error("Get shortlisted error:", error);
    res.status(500).json({ error: "Failed to fetch shortlisted candidates" });
  }
});

// Helper function to format timestamps
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? "1 minute ago" : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Get recruiter's job postings
router.get("/jobs", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const db = await getDatabase();

    const jobsResult = await db.query(
      `
      SELECT 
        jp.id,
        jp.title,
        jp.department,
        jp.location,
        jp.job_type as type,
        jp.experience_level as level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.is_active as "isActive",
        jp.created_at as "createdAt",
        COUNT(ja.id) as "applicationsCount",
        jp.view_count as "viewsCount"
      FROM job_postings jp
      LEFT JOIN job_applications ja ON jp.id = ja.job_id
      WHERE jp.recruiter_id = $1
      GROUP BY jp.id, jp.title, jp.department, jp.location, jp.job_type, jp.experience_level, 
               jp.salary_min, jp.salary_max, jp.salary_currency, jp.description, jp.requirements, 
               jp.benefits, jp.is_active, jp.created_at, jp.view_count
      ORDER BY jp.created_at DESC
    `,
      [recruiterId]
    );

    const jobs = jobsResult.rows.map((job: any) => ({
      id: job.id.toString(),
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      level: job.level,
      salary: {
        min: job.salary_min,
        max: job.salary_max,
        currency: job.salary_currency || 'USD'
      },
      description: job.description,
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      benefits: job.benefits ? JSON.parse(job.benefits) : [],
      isActive: job.isActive,
      applicationsCount: parseInt(job.applicationsCount) || 0,
      viewsCount: job.viewsCount || 0,
      createdAt: job.createdAt,
    }));

    res.json(jobs);
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ error: "Failed to fetch job postings" });
  }
});

// Create new job posting
router.post("/jobs", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      title,
      department,
      location,
      type,
      level,
      salaryMin,
      salaryMax,
      salaryCurrency = 'USD',
      description,
      requirements = [],
      benefits = []
    } = req.body;

    // Validate required fields
    if (!title || !department || !location || !type || !level) {
      return res.status(400).json({ 
        error: "Missing required fields: title, department, location, type, level" 
      });
    }

    const db = await getDatabase();

    const insertResult = await db.query(
      `
      INSERT INTO job_postings (
        recruiter_id, title, department, location, job_type, experience_level,
        salary_min, salary_max, salary_currency, description, requirements, benefits,
        is_active, view_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, 0)
      RETURNING id, created_at
    `,
      [
        recruiterId,
        title,
        department,
        location,
        type,
        level,
        salaryMin || null,
        salaryMax || null,
        salaryCurrency,
        description || '',
        JSON.stringify(requirements),
        JSON.stringify(benefits)
      ]
    );

    const newJob = insertResult.rows[0];

    res.status(201).json({
      success: true,
      job: {
        id: newJob.id.toString(),
        title,
        department,
        location,
        type,
        level,
        salary: {
          min: salaryMin,
          max: salaryMax,
          currency: salaryCurrency
        },
        description: description || '',
        requirements,
        benefits,
        isActive: true,
        applicationsCount: 0,
        viewsCount: 0,
        createdAt: newJob.created_at,
      }
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: "Failed to create job posting" });
  }
});

// Update job posting
router.put("/jobs/:jobId", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { jobId } = req.params;
    const {
      title,
      department,
      location,
      type,
      level,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description,
      requirements,
      benefits,
      isActive
    } = req.body;

    const db = await getDatabase();

    // Verify job belongs to recruiter
    const jobCheck = await db.query(
      "SELECT id FROM job_postings WHERE id = $1 AND recruiter_id = $2",
      [jobId, recruiterId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    await db.query(
      `
      UPDATE job_postings 
      SET title = $1, department = $2, location = $3, job_type = $4, 
          experience_level = $5, salary_min = $6, salary_max = $7, 
          salary_currency = $8, description = $9, requirements = $10, 
          benefits = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND recruiter_id = $14
    `,
      [
        title, department, location, type, level,
        salaryMin, salaryMax, salaryCurrency, description,
        JSON.stringify(requirements), JSON.stringify(benefits),
        isActive, jobId, recruiterId
      ]
    );

    res.json({ success: true, message: "Job posting updated successfully" });
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ error: "Failed to update job posting" });
  }
});

// Delete job posting
router.delete("/jobs/:jobId", async (req: Request, res: Response) => {
  try {
    const recruiterId = await authenticateRecruiter(req);
    if (!recruiterId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { jobId } = req.params;
    const db = await getDatabase();

    // Verify job belongs to recruiter
    const jobCheck = await db.query(
      "SELECT id FROM job_postings WHERE id = $1 AND recruiter_id = $2",
      [jobId, recruiterId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    await db.query(
      "DELETE FROM job_postings WHERE id = $1 AND recruiter_id = $2",
      [jobId, recruiterId]
    );

    res.json({ success: true, message: "Job posting deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json({ error: "Failed to delete job posting" });
  }
});

export default router;
