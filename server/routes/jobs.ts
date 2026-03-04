/**
 * Job Discovery and Application Routes
 * User-facing API endpoints for job search, discovery, and application management
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';

const router = Router();

// Validation schema for job search
const jobSearchSchema = z.object({
  keywords: z.string().optional(),
  location: z.string().optional(),
  remote: z.string().transform(val => val === 'true').optional(),
  salaryMin: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  salaryMax: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  jobType: z.union([
    z.array(z.enum(['full-time', 'part-time', 'contract', 'internship'])),
    z.enum(['full-time', 'part-time', 'contract', 'internship']).transform(val => [val])
  ]).optional(),
  experienceLevel: z.union([
    z.array(z.enum(['entry', 'mid', 'senior', 'executive'])),
    z.enum(['entry', 'mid', 'senior', 'executive']).transform(val => [val])
  ]).optional(),
  industry: z.union([z.array(z.string()), z.string().transform(val => [val])]).optional(),
  companySize: z.union([
    z.array(z.enum(['startup', 'small', 'medium', 'large', 'enterprise'])),
    z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).transform(val => [val])
  ]).optional(),
  postedWithin: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  page: z.string().transform(val => val ? parseInt(val) : 1).default('1'),
  limit: z.string().transform(val => val ? Math.min(parseInt(val), 50) : 20).default('20')
});

// GET /api/jobs/search - Search and filter jobs
router.get('/search', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  const { initializeDatabase, closeDatabase } = await import('../database/connection.js');
  let db;
  
  try {
    const validatedQuery = jobSearchSchema.parse(req.query);

    db = await initializeDatabase();

    // Build search query for job_postings (PostgreSQL)
    let query = `
      SELECT 
        jp.id,
        jp.title,
        jp.company,
        jp.department,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.location,
        jp.job_type as type,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency as currency,
        jp.created_at as posted_date,
        jp.view_count,
        0 as application_count
      FROM job_postings jp
      WHERE jp.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (validatedQuery.keywords) {
      query += ` AND (jp.title ILIKE $${paramIndex} OR jp.description ILIKE $${paramIndex + 1} OR jp.company ILIKE $${paramIndex + 2})`;
      const keyword = `%${validatedQuery.keywords}%`;
      params.push(keyword, keyword, keyword);
      paramIndex += 3;
    }

    if (validatedQuery.location && !validatedQuery.remote) {
      query += ` AND jp.location ILIKE $${paramIndex}`;
      params.push(`%${validatedQuery.location}%`);
      paramIndex++;
    }

    if (validatedQuery.remote) {
      query += ` AND jp.location ILIKE '%remote%'`;
    }

    if (validatedQuery.salaryMin) {
      query += ` AND jp.salary_max >= $${paramIndex}`;
      params.push(validatedQuery.salaryMin);
      paramIndex++;
    }

    if (validatedQuery.salaryMax) {
      query += ` AND jp.salary_min <= $${paramIndex}`;
      params.push(validatedQuery.salaryMax);
      paramIndex++;
    }

    if (validatedQuery.jobType && Array.isArray(validatedQuery.jobType) && validatedQuery.jobType.length > 0) {
      const placeholders = validatedQuery.jobType.map((_, i) => `$${paramIndex + i}`).join(',');
      query += ` AND jp.job_type IN (${placeholders})`;
      params.push(...validatedQuery.jobType);
      paramIndex += validatedQuery.jobType.length;
    }

    if (validatedQuery.experienceLevel && Array.isArray(validatedQuery.experienceLevel) && validatedQuery.experienceLevel.length > 0) {
      const placeholders = validatedQuery.experienceLevel.map((_, i) => `$${paramIndex + i}`).join(',');
      query += ` AND jp.experience_level IN (${placeholders})`;
      params.push(...validatedQuery.experienceLevel);
      paramIndex += validatedQuery.experienceLevel.length;
    }

    if (validatedQuery.postedWithin) {
      query += ` AND jp.created_at >= NOW() - INTERVAL '${validatedQuery.postedWithin} days'`;
    }

    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
    console.log('=== COUNT QUERY DEBUG ===');
    console.log('Query:', countQuery);
    console.log('Params:', JSON.stringify(params));
    console.log('========================');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Add pagination
    query += ` ORDER BY jp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(validatedQuery.limit, (validatedQuery.page - 1) * validatedQuery.limit);

    // Execute search
    console.log('=== MAIN QUERY DEBUG ===');
    console.log('Query:', query);
    console.log('Params:', JSON.stringify(params));
    console.log('========================');
    const result = await db.query(query, params);
    const jobs = result.rows;

    // Transform results
    const transformedJobs = jobs.map((job: any) => {
      const requirements = job.requirements ? 
        (typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements) : [];
      
      return {
        id: job.id.toString(),
        title: job.title,
        company: job.company || 'Company',
        description: job.description || '',
        requirements: Array.isArray(requirements) ? requirements : [],
        salaryRange: {
          min: job.salary_min || 0,
          max: job.salary_max || 0,
          currency: job.currency || 'USD'
        },
        location: job.location || 'Remote',
        remote: job.location?.toLowerCase().includes('remote') || false,
        type: job.type || 'full-time',
        experienceLevel: job.experience_level || 'mid',
        industry: 'Technology',
        companySize: 'medium',
        postedDate: job.posted_date,
        status: 'active',
        matchScore: 75,
        matchReasons: ['New opportunity'],
        applicationCount: parseInt(job.application_count) || 0
      };
    });

    res.json({
      success: true,
      data: {
        jobs: transformedJobs,
        total,
        hasMore: total > validatedQuery.page * validatedQuery.limit,
        filters: validatedQuery
      }
    });
  } catch (error) {
    console.error('Job search error:', error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: fieldErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } finally {
    if (db) {
      // Don't close database - let connection pool manage connections
    }
  }
});

// Note: Other job routes (recommendations, analytics, applications, alerts) are handled in:
// - server/index.ts (recommendations, analytics)
// - server/routes/jobRecommendations.ts (additional job features)
// This file only contains the search route which queries job_postings directly.

export default router;
