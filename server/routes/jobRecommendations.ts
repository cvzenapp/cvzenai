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
  const limit = parseInt(req.query.limit as string) || 20;

  let db;

  try {
    const { client } = await initializeDatabase();
    db = client;

    // Get active job postings with recruiter/company info
    const query = `
      SELECT 
        jp.id,
        jp.title,
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

    const jobs = result.rows.map((row: any) => {
      // Parse requirements and benefits
      const requirements = row.requirements ? 
        (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : [];
      const benefits = row.benefits ? 
        (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits) : [];

      return {
        id: row.id.toString(),
        title: row.title,
        company: row.department, // Using department as company for now
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
    if (db) {
      await closeDatabase();
    }
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
    const { client } = await initializeDatabase();
    db = client;

    // Get user's job application statistics
    const applicationsQuery = `
      SELECT COUNT(*) as total
      FROM job_applications
      WHERE user_id = $1
    `;
    const applicationsResult = await db.query(applicationsQuery, [userId]);

    res.json({
      success: true,
      data: {
        applications: {
          total: parseInt(applicationsResult.rows[0]?.total) || 0,
        },
        savedJobs: 0, // Can be implemented with a saved_jobs table
        searches: {
          last30Days: 0, // Can be tracked with a search_history table
        },
        alerts: {
          active: 0, // Can be implemented with a job_alerts table
        },
      },
    });

  } catch (error) {
    console.error("❌ Get job analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job analytics",
    });
  } finally {
    if (db) {
      await closeDatabase();
    }
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
    const { client } = await initializeDatabase();
    db = client;

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
    if (db) {
      await closeDatabase();
    }
  }
});

export default router;
