import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../database/connection.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// GET /api/jobs/:id - Get job details by ID
router.get("/:id", async (req: Request, res: Response) => {
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

  const jobId = req.params.id;
  let db;

  try {
    db = await initializeDatabase();

    // Get job details from database
    const jobQuery = `
      SELECT 
        id,
        title,
        description,
        requirements,
        company,
        location,
        salary_range,
        job_type,
        experience_level,
        created_at,
        status,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = job_postings.id) as application_count
      FROM job_postings 
      WHERE id = $1 AND status = 'active'
    `;
    
    const jobResult = await db.query(jobQuery, [jobId]);
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found or inactive",
      });
    }

    const jobData = jobResult.rows[0];

    // Parse requirements if it's a JSON string
    let requirements = [];
    if (jobData.requirements) {
      try {
        requirements = typeof jobData.requirements === 'string' ? 
          JSON.parse(jobData.requirements) : jobData.requirements;
      } catch (e) {
        // If not JSON, treat as plain text and split by lines or commas
        requirements = jobData.requirements.split(/[,\n]/).map((req: string) => req.trim()).filter(Boolean);
      }
    }

    // Parse salary range if it's a JSON string
    let salaryRange = null;
    if (jobData.salary_range) {
      try {
        salaryRange = typeof jobData.salary_range === 'string' ? 
          JSON.parse(jobData.salary_range) : jobData.salary_range;
      } catch (e) {
        // If not JSON, treat as plain text
        salaryRange = { text: jobData.salary_range };
      }
    }

    const formattedJob = {
      id: jobData.id,
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      requirements: requirements,
      location: jobData.location,
      salaryRange: salaryRange,
      type: jobData.job_type,
      experienceLevel: jobData.experience_level,
      applicationCount: parseInt(jobData.application_count) || 0,
      postedDate: jobData.created_at,
      status: jobData.status
    };

    return res.json({
      success: true,
      data: formattedJob,
    });

  } catch (error) {
    console.error("❌ Get job details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
    });
  }
});

export default router;