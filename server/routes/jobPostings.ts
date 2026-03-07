import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { initializeDatabase, closeDatabase } from "../database/connection";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Generate URL-friendly slug from title
function generateSlug(title: string, id?: number): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50); // Limit length
  
  return id ? `${baseSlug}-${id}` : baseSlug;
}

// Validation schema for job posting
const jobPostingSchema = z.object({
  title: z.string().min(1).max(255),
  department: z.string().min(1).max(100),
  location: z.string().min(1).max(255),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().length(3).default('USD'),
  description: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// GET /api/recruiter/jobs - Get all job postings for recruiter
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

  const userId = decoded.userId;
  let db;

  try {
    db = await initializeDatabase();

    const query = `
      SELECT jp.*, 
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as applications_count,
        (SELECT COUNT(*) FROM job_postings WHERE id = jp.id) as views_count
      FROM job_postings jp
      WHERE jp.recruiter_id = $1
      ORDER BY jp.created_at DESC
    `;

    const result = await db.query(query, [userId]);
    
    const jobs = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      company: row.company,
      department: row.department,
      location: row.location,
      type: row.job_type,
      level: row.experience_level,
      salary: {
        min: row.salary_min,
        max: row.salary_max,
        currency: row.salary_currency || 'USD',
      },
      description: row.description || '',
      requirements: row.requirements ? (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : [],
      benefits: row.benefits ? (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits) : [],
      createdAt: row.created_at,
      isActive: row.is_active,
      applicationsCount: parseInt(row.applications_count) || 0,
      viewsCount: parseInt(row.views_count) || 0,
      slug: row.slug || generateSlug(row.title, row.id),
    }));

    res.json({
      success: true,
      jobs,
    });

  } catch (error) {
    console.error("❌ Get job postings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job postings",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// POST /api/recruiter/jobs - Create new job posting
router.post("/", async (req: Request, res: Response) => {
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
    // Validate request body
    const validatedData = jobPostingSchema.parse(req.body);
    
    db = await initializeDatabase();

    // Get recruiter's company information from companies table
    const recruiterQuery = `
      SELECT rp.company_id, c.name as company_name
      FROM recruiter_profiles rp
      INNER JOIN companies c ON c.id = rp.company_id
      WHERE rp.user_id = $1
    `;
    const recruiterResult = await db.query(recruiterQuery, [userId]);
    
    if (recruiterResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Recruiter profile not found. Please complete your company profile first.",
      });
    }

    const companyId = recruiterResult.rows[0].company_id;
    const companyName = recruiterResult.rows[0].company_name;
    
    if (!companyId || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Company information is required. Please update your company profile first.",
      });
    }

    const query = `
      INSERT INTO job_postings (
        recruiter_id, company_id, company, title, department, location, job_type, experience_level,
        salary_min, salary_max, salary_currency, description, requirements, benefits, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      userId,
      companyId,
      companyName,
      validatedData.title,
      validatedData.department,
      validatedData.location,
      validatedData.jobType,
      validatedData.experienceLevel,
      validatedData.salaryMin || null,
      validatedData.salaryMax || null,
      validatedData.salaryCurrency,
      validatedData.description || null,
      JSON.stringify(validatedData.requirements),
      JSON.stringify(validatedData.benefits),
      validatedData.isActive,
    ];

    const result = await db.query(query, values);
    const createdJob = result.rows[0];

    // Generate and update slug after job creation
    const slug = generateSlug(createdJob.title, createdJob.id);
    await db.query('UPDATE job_postings SET slug = $1 WHERE id = $2', [slug, createdJob.id]);

    const formattedJob = {
      id: createdJob.id,
      title: createdJob.title,
      company: createdJob.company,
      department: createdJob.department,
      location: createdJob.location,
      type: createdJob.job_type,
      level: createdJob.experience_level,
      salary: {
        min: createdJob.salary_min,
        max: createdJob.salary_max,
        currency: createdJob.salary_currency || 'USD',
      },
      description: createdJob.description || '',
      requirements: createdJob.requirements ? (typeof createdJob.requirements === 'string' ? JSON.parse(createdJob.requirements) : createdJob.requirements) : [],
      benefits: createdJob.benefits ? (typeof createdJob.benefits === 'string' ? JSON.parse(createdJob.benefits) : createdJob.benefits) : [],
      createdAt: createdJob.created_at,
      isActive: createdJob.is_active,
      applicationsCount: 0,
      viewsCount: 0,
      slug: slug,
    };

    res.status(201).json({
      success: true,
      message: "Job posting created successfully",
      job: formattedJob,
    });

  } catch (error) {
    console.error("❌ Create job posting error:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create job posting",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// PUT /api/recruiter/jobs/:id - Update job posting
router.put("/:id", async (req: Request, res: Response) => {
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
  const jobId = parseInt(req.params.id);
  let db;

  try {
    // Validate request body
    const validatedData = jobPostingSchema.parse(req.body);
    
    db = await initializeDatabase();

    // Check if job exists and belongs to this recruiter
    const existingJobResult = await db.query('SELECT * FROM job_postings WHERE id = $1 AND recruiter_id = $2', [jobId, userId]);
    
    if (existingJobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    const query = `
      UPDATE job_postings SET
        title = $1, department = $2, location = $3, job_type = $4, experience_level = $5,
        salary_min = $6, salary_max = $7, salary_currency = $8, description = $9,
        requirements = $10, benefits = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND recruiter_id = $14
      RETURNING *
    `;

    const values = [
      validatedData.title,
      validatedData.department,
      validatedData.location,
      validatedData.jobType,
      validatedData.experienceLevel,
      validatedData.salaryMin || null,
      validatedData.salaryMax || null,
      validatedData.salaryCurrency,
      validatedData.description || null,
      JSON.stringify(validatedData.requirements),
      JSON.stringify(validatedData.benefits),
      validatedData.isActive,
      jobId,
      userId,
    ];

    const result = await db.query(query, values);
    const updatedJob = result.rows[0];

    const formattedJob = {
      id: updatedJob.id,
      title: updatedJob.title,
      company: updatedJob.company,
      department: updatedJob.department,
      location: updatedJob.location,
      type: updatedJob.job_type,
      level: updatedJob.experience_level,
      salary: {
        min: updatedJob.salary_min,
        max: updatedJob.salary_max,
        currency: updatedJob.salary_currency || 'USD',
      },
      description: updatedJob.description || '',
      requirements: updatedJob.requirements ? (typeof updatedJob.requirements === 'string' ? JSON.parse(updatedJob.requirements) : updatedJob.requirements) : [],
      benefits: updatedJob.benefits ? (typeof updatedJob.benefits === 'string' ? JSON.parse(updatedJob.benefits) : updatedJob.benefits) : [],
      createdAt: updatedJob.created_at,
      isActive: updatedJob.is_active,
      applicationsCount: 0,
      viewsCount: 0,
    };

    res.json({
      success: true,
      message: "Job posting updated successfully",
      job: formattedJob,
    });

  } catch (error) {
    console.error("❌ Update job posting error:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update job posting",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// DELETE /api/recruiter/jobs/:id - Delete job posting
router.delete("/:id", async (req: Request, res: Response) => {
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
  const jobId = parseInt(req.params.id);
  let db;

  try {
    db = await initializeDatabase();

    // Check if job exists and belongs to this recruiter
    const existingJobResult = await db.query('SELECT * FROM job_postings WHERE id = $1 AND recruiter_id = $2', [jobId, userId]);
    
    if (existingJobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    // Delete the job posting
    await db.query('DELETE FROM job_postings WHERE id = $1 AND recruiter_id = $2', [jobId, userId]);

    res.json({
      success: true,
      message: "Job posting deleted successfully",
    });

  } catch (error) {
    console.error("❌ Delete job posting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job posting",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// PATCH /api/recruiter/jobs/:id/toggle - Toggle job posting active status
router.patch("/:id/toggle", async (req: Request, res: Response) => {
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
  const jobId = parseInt(req.params.id);
  let db;

  try {
    db = await initializeDatabase();

    // Check if job exists and belongs to this recruiter
    const existingJobResult = await db.query('SELECT * FROM job_postings WHERE id = $1 AND recruiter_id = $2', [jobId, userId]);
    
    if (existingJobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    const existingJob = existingJobResult.rows[0];

    // Toggle the active status
    const newStatus = !existingJob.is_active;
    await db.query('UPDATE job_postings SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND recruiter_id = $3', [newStatus, jobId, userId]);

    res.json({
      success: true,
      isActive: newStatus,
      message: `Job posting ${newStatus ? 'activated' : 'deactivated'} successfully`,
    });

  } catch (error) {
    console.error("❌ Toggle job posting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle job posting status",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// GET /api/recruiter/jobs/public/company/:companyId - Get active jobs for a company (public endpoint)
router.get("/public/company/:companyId", async (req: Request, res: Response) => {
  const companyId = parseInt(req.params.companyId);
  let db;

  try {
    db = await initializeDatabase();

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
        jp.created_at,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as applications_count
      FROM job_postings jp
      WHERE jp.company_id = $1 AND jp.is_active = true
      ORDER BY jp.created_at DESC
    `;

    const result = await db.query(query, [companyId]);
    
    const jobs = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      company: row.company,
      department: row.department,
      location: row.location,
      type: row.job_type,
      level: row.experience_level,
      salary: {
        min: row.salary_min,
        max: row.salary_max,
        currency: row.salary_currency || 'USD',
      },
      description: row.description || '',
      requirements: row.requirements ? (typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements) : [],
      benefits: row.benefits ? (typeof row.benefits === 'string' ? JSON.parse(row.benefits) : row.benefits) : [],
      createdAt: row.created_at,
      applicationsCount: parseInt(row.applications_count) || 0,
    }));

    res.json({
      success: true,
      jobs,
    });

  } catch (error) {
    console.error("❌ Get public company jobs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job postings",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

// GET /api/jobs/:slug - Get public job posting by slug (no auth required)
router.get("/public/:slug", async (req: Request, res: Response) => {
  const slug = req.params.slug;
  let db;

  try {
    db = await initializeDatabase();

    // First, let's check what's actually in the companies table
    const debugQuery = `
      SELECT id, name, logo, logo_url 
      FROM companies 
      WHERE id IN (
        SELECT company_id FROM job_postings WHERE slug = $1
      )
    `;
    const debugResult = await db.query(debugQuery, [slug]);
    console.log('🔍 Companies table debug for slug:', slug);
    if (debugResult.rows.length > 0) {
      const company = debugResult.rows[0];
      console.log('🔍 Company data:', {
        id: company.id,
        name: company.name,
        has_logo: !!company.logo,
        logo_length: company.logo?.length || 0,
        logo_preview: company.logo?.substring(0, 50) + '...' || 'null',
        has_logo_url: !!company.logo_url,
        logo_url_length: company.logo_url?.length || 0,
        logo_url_preview: company.logo_url?.substring(0, 50) + '...' || 'null'
      });
    }

    const query = `
      SELECT 
        jp.*,
        c.name as company_name,
        c.description as company_description,
        c.website as company_website,
        c.location as company_location,
        c.logo as company_logo_url,
        (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as applications_count
      FROM job_postings jp
      INNER JOIN companies c ON c.id = jp.company_id
      WHERE jp.slug = $1 AND jp.is_active = true
    `;

    const result = await db.query(query, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    const row = result.rows[0];
    
    // Debug logging for logo and requirements data
    console.log('🔍 Job posting debug:', {
      company_id: row.company_id,
      company_name: row.company_name,
      logo_data_exists: !!row.company_logo_url,
      logo_data_length: row.company_logo_url?.length || 0,
      logo_data_preview: row.company_logo_url?.substring(0, 50) + '...' || 'null',
      requirements_raw: row.requirements,
      requirements_type: typeof row.requirements,
      requirements_length: row.requirements?.length || 0,
      description_exists: !!row.description,
      description_length: row.description?.length || 0
    });
    
    const job = {
      id: row.id,
      title: row.title,
      department: row.department,
      location: row.location,
      jobType: row.job_type,
      experienceLevel: row.experience_level,
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      currency: row.salary_currency || 'USD',
      description: row.description || '',
      requirements: (() => {
        // Handle different requirements data formats
        if (!row.requirements) return '';
        
        if (typeof row.requirements === 'string') {
          // If it's already a string, check if it's JSON
          try {
            const parsed = JSON.parse(row.requirements);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map(req => `• ${req}`).join('\n');
            }
            return row.requirements;
          } catch {
            // Not JSON, return as is
            return row.requirements;
          }
        }
        
        if (Array.isArray(row.requirements) && row.requirements.length > 0) {
          return row.requirements.map(req => `• ${req}`).join('\n');
        }
        
        // Fallback - convert to string
        return String(row.requirements);
      })(),
      isActive: row.is_active,
      slug: row.slug,
      company: {
        id: row.company_id,
        name: row.company_name,
        description: row.company_description,
        website: row.company_website,
        location: row.company_location,
        logoUrl: row.company_logo_url,
      },
      createdAt: row.created_at,
    };

    res.json({
      success: true,
      job,
    });

  } catch (error) {
    console.error("❌ Get job by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job posting",
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

export default router;