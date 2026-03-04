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

// GET /api/jobs/recommendations - Get job recommendations for candidates
router.get("/recommendations", async (req: Request, res: Response) => {
  console.log('🔍 Job recommendations endpoint called');
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('❌ Invalid token');
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const userId = decoded.userId;
  const limit = parseInt(req.query.limit as string) || 20;
  console.log('🔍 Fetching recommendations for userId:', userId, 'limit:', limit);

  let db;

  try {
    db = await initializeDatabase();

    // Get active job postings with recruiter/company info
    const query = `
      SELECT 
        jp.id,
        jp.title,
        jp.company,
        jp.department,
        jp.location,
        jp.job_type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.view_count,
        jp.created_at,
        u.email as recruiter_email,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as application_count
      FROM job_postings jp
      JOIN users u ON jp.recruiter_id = u.id
      WHERE jp.is_active = true
      ORDER BY jp.created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    console.log('🔍 Query result rows:', result.rows.length);

    const jobs = result.rows.map((row: any) => {
      // Parse requirements and benefits
      const requirements = row.requirements ? 
        (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : [];
      const benefits = row.benefits ? 
        (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits) : [];

      return {
        id: row.id.toString(),
        title: row.title,
        company: row.company || row.department, // Use company field, fallback to department
        description: row.description || '',
        requirements: Array.isArray(requirements) ? requirements : [],
        salaryRange: {
          min: row.salary_min || 0,
          max: row.salary_max || 0,
          currency: row.salary_currency || 'USD',
        },
        location: row.location,
        remote: row.location?.toLowerCase().includes('remote') || false,
        type: row.job_type || 'full-time',
        experienceLevel: row.experience_level || 'mid',
        industry: 'Technology', // Default for now
        companySize: 'medium', // Default for now
        postedDate: row.created_at,
        status: 'active',
        matchScore: 75, // Default match score, can be calculated based on user skills
        matchReasons: [], // Can be populated based on skill matching
        applicationCount: parseInt(row.application_count) || 0,
        benefits: Array.isArray(benefits) ? benefits : [],
      };
    });

    console.log('✅ Returning', jobs.length, 'jobs');
    res.json({
      success: true,
      data: {
        jobs,
        total: jobs.length,
      },
    });

  } catch (error) {
    console.error("❌ Get job recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job recommendations",
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    // Don't close the database connection - let the connection pool manage it
    // if (db) {
    //   await closeDatabase(db);
    // }
  }
});

// GET /api/jobs/analytics - Get user's job analytics
router.get("/analytics", async (req: Request, res: Response) => {
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

  const userId = decoded.userId;

  let db;

  try {
    db = await initializeDatabase();

    // Get total active jobs from job_postings
    const totalJobsResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM job_postings 
      WHERE is_active = true
    `);
    const totalJobs = parseInt(totalJobsResult.rows[0]?.count || '0');

    // Get user's job applications
    const applicationsResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
        COUNT(CASE WHEN status = 'interview' THEN 1 END) as interview,
        COUNT(CASE WHEN status = 'offer' THEN 1 END) as offer
      FROM job_applications 
      WHERE user_id = $1
    `, [userId]);
    const applications = applicationsResult.rows[0];

    // Get saved jobs count (if table exists)
    let savedJobsCount = 0;
    try {
      const savedJobsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM saved_jobs 
        WHERE user_id = $1
      `, [userId]);
      savedJobsCount = parseInt(savedJobsResult.rows[0]?.count || '0');
    } catch (e) {
      // Table might not exist yet
    }

    // Get user's job searches in last 30 days (if table exists)
    let searchesCount = 0;
    try {
      const searchesResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM user_job_searches 
        WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '30 days'
      `, [userId]);
      searchesCount = parseInt(searchesResult.rows[0]?.count || '0');
    } catch (e) {
      // Table might not exist yet
    }

    // Get active job alerts (if table exists)
    let alertsCount = 0;
    try {
      const alertsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM job_alerts 
        WHERE user_id = $1 AND is_active = true
      `, [userId]);
      alertsCount = parseInt(alertsResult.rows[0]?.count || '0');
    } catch (e) {
      // Table might not exist yet
    }

    // Get match scores for user (if table exists)
    let matchScores = { avgScore: 0, highQuality: 0, perfect: 0 };
    try {
      const matchScoresResult = await db.query(`
        SELECT 
          AVG(match_score) as avgScore,
          COUNT(CASE WHEN match_score >= 80 THEN 1 END) as highQuality,
          COUNT(CASE WHEN match_score >= 95 THEN 1 END) as perfect
        FROM job_match_scores 
        WHERE user_id = $1
      `, [userId]);
      const row = matchScoresResult.rows[0];
      if (row) {
        matchScores = {
          avgScore: parseFloat(row.avgscore) || 0,
          highQuality: parseInt(row.highquality) || 0,
          perfect: parseInt(row.perfect) || 0
        };
      }
    } catch (e) {
      // Table might not exist yet
    }

    const analytics = {
      totalJobs,
      applications: {
        total: parseInt(applications?.total) || 0,
        submitted: parseInt(applications?.submitted) || 0,
        reviewed: parseInt(applications?.reviewed) || 0,
        interview: parseInt(applications?.interview) || 0,
        offer: parseInt(applications?.offer) || 0
      },
      searches: {
        last30Days: searchesCount
      },
      alerts: {
        active: alertsCount
      },
      savedJobs: savedJobsCount,
      matchScores: {
        average: matchScores.avgScore,
        highQuality: matchScores.highQuality,
        perfect: matchScores.perfect
      }
    };

    res.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error("❌ Get job analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job analytics",
    });
  } finally {
    // Don't close the database connection - let the connection pool manage it
  }
});

// POST /api/jobs/save - Save a job for later
router.post("/save", async (req: Request, res: Response) => {
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

  const userId = decoded.userId;
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({
      success: false,
      message: "Job ID is required",
    });
  }

  // For now, return success
  // Can be implemented with a saved_jobs table later
  res.json({
    success: true,
    message: "Job saved successfully",
  });
});

// POST /api/jobs/applications - Apply to a job
router.post("/applications", async (req: Request, res: Response) => {
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

  const userId = decoded.userId;
  const { jobId } = req.body;

  if (!jobId) {
    return res.status(400).json({
      success: false,
      message: "Job ID is required",
    });
  }

  let db;

  try {
    db = await initializeDatabase();

    // Check if already applied
    const checkQuery = `
      SELECT id FROM job_applications
      WHERE job_id = $1 AND user_id = $2
    `;
    const checkResult = await db.query(checkQuery, [jobId, userId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    // Create application
    const insertQuery = `
      INSERT INTO job_applications (job_id, user_id, status, applied_at)
      VALUES ($1, $2, 'applied', NOW())
      RETURNING id
    `;
    const result = await db.query(insertQuery, [jobId, userId]);

    res.json({
      success: true,
      message: "Application submitted successfully",
      data: {
        applicationId: result.rows[0].id.toString(),
      },
    });

  } catch (error) {
    console.error("❌ Submit application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  } finally {
    // Don't close the database connection - let the connection pool manage it
    // if (db) {
    //   await closeDatabase(db);
    // }
  }
});

export default router;
