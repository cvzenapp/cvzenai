import { Router, Request, Response } from "express";
import { initializeDatabase, closeDatabase } from "../database/connection.js";
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

// GET /api/recruiter/candidates - Get all registered candidates
router.get("/", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  let db;

  try {
    db = await initializeDatabase();

    // Query to get only job seekers with their active resume and share token
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.user_type,
        u.created_at as registered_at,
        r.id as resume_id,
        r.title,
        r.personal_info,
        r.skills,
        r.experience,
        r.education,
        rs.share_token
      FROM users u
      LEFT JOIN resumes r ON u.id = r.user_id AND (r.is_active = true OR r.is_active IS NULL)
      LEFT JOIN resume_shares rs ON r.id = rs.resume_id
      WHERE u.user_type = $1
        AND u.id NOT IN (SELECT user_id FROM recruiter_profiles WHERE user_id IS NOT NULL)
      ORDER BY u.created_at DESC
      LIMIT 100
    `;

    const result = await db.query(query, ['job_seeker']);
    
    console.log(`📊 Found ${result.rows.length} unique candidates (job seekers only)`);

    const candidates = result.rows.map((row: any) => {
      // Parse JSON fields safely
      const personalInfo = row.personal_info ? 
        (typeof row.personal_info === 'string' ? JSON.parse(row.personal_info) : row.personal_info) : {};
      
      const skillsData = row.skills ? 
        (typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills) : [];
      
      // Extract skill names (handle both string and object formats)
      const skills = Array.isArray(skillsData) 
        ? skillsData.map((s: any) => typeof s === 'string' ? s : s?.name || '').filter(Boolean)
        : [];
      
      const experienceData = row.experience ? 
        (typeof row.experience === 'string' ? JSON.parse(row.experience) : row.experience) : [];
      
      return {
        id: row.id.toString(),
        userId: row.id.toString(),
        // Use users table columns as primary source, fallback to resume personal_info
        firstName: row.first_name || personalInfo.firstName || personalInfo.name?.split(' ')[0] || 'User',
        lastName: row.last_name || personalInfo.lastName || personalInfo.name?.split(' ').slice(1).join(' ') || '',
        email: row.email,
        phone: personalInfo.phone || personalInfo.phoneNumber || '',
        location: personalInfo.location || personalInfo.address || 'Not specified',
        title: row.title || 'Job Seeker',
        experience: experienceData.length > 0 ? `${experienceData.length}+ years` : 'Entry Level',
        skills: skills.slice(0, 5),
        education: row.education,
        availability: 'flexible',
        resumeId: row.resume_id?.toString(),
        resumeShareUrl: row.share_token ? `/shared/resume/${row.share_token}` : undefined,
        profilePicture: personalInfo.profilePicture || personalInfo.avatar,
        linkedinUrl: personalInfo.linkedin || personalInfo.linkedinUrl,
        githubUrl: personalInfo.github || personalInfo.githubUrl,
        portfolioUrl: personalInfo.portfolio || personalInfo.portfolioUrl || personalInfo.website,
        registeredAt: row.registered_at,
        lastActive: row.registered_at,
      };
    });

    res.json({
      success: true,
      candidates,
    });

  } catch (error) {
    console.error("❌ Get candidates error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/recruiter/candidates/:id - Get candidate by ID
router.get("/:id", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const candidateId = req.params.id;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  let db;

  try {
    db = await initializeDatabase();

    const query = `
      SELECT 
        u.id,
        u.email,
        u.user_type,
        u.created_at as registered_at,
        r.id as resume_id,
        r.title,
        r.personal_info,
        r.skills,
        r.experience,
        r.education,
        rs.share_token
      FROM users u
      LEFT JOIN resumes r ON u.id = r.user_id AND (r.is_active = true OR r.is_active IS NULL)
      LEFT JOIN resume_shares rs ON r.id = rs.resume_id
      WHERE u.id = $1 AND u.user_type = $2
    `;

    const result = await db.query(query, [candidateId, 'job_seeker']);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const row = result.rows[0];
    
    const personalInfo = row.personal_info ? 
      (typeof row.personal_info === 'string' ? JSON.parse(row.personal_info) : row.personal_info) : {};
    
    const skillsData = row.skills ? 
      (typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills) : [];
    
    // Extract skill names (handle both string and object formats)
    const skills = Array.isArray(skillsData) 
      ? skillsData.map((s: any) => typeof s === 'string' ? s : s?.name || '').filter(Boolean)
      : [];
    
    const experienceData = row.experience ? 
      (typeof row.experience === 'string' ? JSON.parse(row.experience) : row.experience) : [];
    
    const candidate = {
      id: row.id.toString(),
      userId: row.id.toString(),
      firstName: personalInfo.firstName || personalInfo.name?.split(' ')[0] || 'User',
      lastName: personalInfo.lastName || personalInfo.name?.split(' ').slice(1).join(' ') || '',
      email: row.email,
      phone: personalInfo.phone || personalInfo.phoneNumber || '',
      location: personalInfo.location || personalInfo.address || 'Not specified',
      title: row.title || 'Job Seeker',
      experience: experienceData.length > 0 ? `${experienceData.length}+ years` : 'Entry Level',
      skills: skills,
      education: row.education,
      availability: 'flexible',
      resumeId: row.resume_id?.toString(),
      resumeShareUrl: row.share_token ? `/shared/resume/${row.share_token}` : undefined,
      profilePicture: personalInfo.profilePicture || personalInfo.avatar,
      linkedinUrl: personalInfo.linkedin || personalInfo.linkedinUrl,
      githubUrl: personalInfo.github || personalInfo.githubUrl,
      portfolioUrl: personalInfo.portfolio || personalInfo.portfolioUrl || personalInfo.website,
      registeredAt: row.registered_at,
      lastActive: row.registered_at,
    };

    res.json({
      success: true,
      candidate,
    });

  } catch (error) {
    console.error("❌ Get candidate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidate",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
