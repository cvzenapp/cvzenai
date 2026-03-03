import express from "express";
import type * as expressType from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type * as pathType from "path";
dotenv.config();

// Get proper directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  getResume,
  getResumePublic,
  getUserResumes,
  updateResumeInteractions,
  getSkills,
  getExperiences,
  getEducation,
  getProjects,
  getPersonalInfo,
  createResume,
  updateResume,
  deleteResume,
  setActiveResume,
} from "./routes/resume";
import { optimizeResume, applyOptimization } from "./routes/resumeOptimization";
import atsScoringRouter from "./routes/atsScoring";
import authRouter from "./routes/auth";
import recruiterAuthRouter from "./routes/recruiterAuthSimple";
import recruiterDashboardRouter from "./routes/recruiterDashboard";
import recruiterApplicationsRouter from "./routes/recruiterApplications";
import companyProfileRouter from "./routes/companyProfile";
import jobPostingsRouter from "./routes/jobPostings";
import candidatesRouter from "./routes/candidates";
import dashboardRouter from "./routes/dashboard";
import templateCustomizationRouter from "./routes/templateCustomization";
import customizationRouter from "./routes/customization";
import referralsRouter from "./routes/referrals";
import refereeFollowUpRouter from "./routes/refereeFollowUp";
import referralAnalyticsRouter from "./routes/referralAnalytics";
import referralAdminRouter from "./routes/referralAdmin";
import userProfileRouter from "./routes/userProfile";
import jobMatchingIntegrationRouter from "./routes/jobMatchingIntegration";
import jobsRouter from "./routes/jobs";
import jobRecommendationsRouter from "./routes/jobRecommendations";
import jobApplicationsRouter from "./routes/jobApplications";
import fileUploadRouter from "./routes/fileUpload";
import resumeSharingRouter from "./routes/resumeSharing";
import resumeUpvotesRouter from "./routes/resumeUpvotes";
import recruiterShortlistRouter from "./routes/recruiterShortlist";
import adminUsersRouter from "./routes/adminUsers";
import interviewsRouter from "./routes/interviews";
import videoRouter from "./routes/video";
import aiChatRouter from "./routes/aiChat";
import recruiterAiChatRouter from "./routes/recruiterAiChat";
import jobSearchRouter from "./routes/jobSearch";
import waitlistRouter from "./routes/waitlist";
import pledgeRouter from "./routes/pledge";
import applicationScreeningRouter from "./routes/applicationScreening";
import resumeParsingRouter from "./routes/resumeParsing";
import guestResumeParsingRouter from "./routes/guestResumeParsing";
import aiScreeningRouter from "./routes/aiScreening";
import aiAuditRouter from "./routes/aiAudit";
import fakeJobDetectionRouter from "./routes/fakeJobDetection";
import publicFakeJobDetectionRouter from "./routes/publicFakeJobDetection";
import subscriptionsRouter from "./routes/subscriptions";
import paymentRouter from "./routes/payment";
import paymentHistoryRouter from "./routes/paymentHistory";
import { requireAuth } from "./middleware/unifiedAuth";
import { getDatabase, initializeDatabase, closeDatabase, initializeDatabaseBackground, isDatabaseConnected } from "./database/connection";
import { seedDatabase } from "./database/seedData";

export function createServer() {
  const app = express();

  // Only initialize database in runtime, not during build
  if (process.env.NODE_ENV !== 'build' && typeof window === 'undefined' && !process.env.VITE_BUILD) {
    // Initialize database in background without blocking server startup
    initializeDatabaseBackground().catch(error => {
      console.warn('⚠️ Database initialization failed - server will continue without database:', error.message);
    });
  }

  // Middleware
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'https://cvzen.in',
      'https://www.cvzen.in',
      'https://cvzen.netlify.app',
      'https://main--cvzen.netlify.app',
      /https:\/\/.*--cvzen\.netlify\.app$/,
      /https:\/\/.*\.cvzen\.in$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`🔍 Express received: ${req.method} ${req.path}`);
    next();
  });

  // Health check and debug routes
  app.get("/api/ping", (_req, res) => {
    console.log("✅ Ping endpoint hit!");
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/health", async (_req, res) => {
    try {
      if (!isDatabaseConnected()) {
        return res.json({ 
          status: "partial",
          database: "unavailable",
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
          message: "Server running but database unavailable"
        });
      }
      
      // Test database connection
      const db = await getDatabaseSafe();
      
      if (db) {
        const result = await db.query('SELECT 1 as test');
        
        // Close connection in serverless
        if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
          await closeDatabase(db);
        }
        
        res.json({ 
          status: "healthy",
          database: "connected",
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
          test_query: result.rows[0]
        });
      } else {
        res.json({ 
          status: "partial",
          database: "unavailable",
          environment: process.env.NODE_ENV || "development",
          timestamp: new Date().toISOString(),
          message: "Server running but database unavailable"
        });
      }
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(200).json({ // Still return 200 to keep server alive
        status: "partial",
        database: "error",
        error: error.message,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Resume API endpoints
  app.get("/api/resumes", requireAuth, getUserResumes);
  app.get("/api/resume/:id", requireAuth, getResume);
  app.get("/api/resume/public/:id", getResumePublic); // Public endpoint for recruiters
  app.post("/api/resume", requireAuth, createResume);
  app.put("/api/resume/:id", requireAuth, updateResume);
  app.delete("/api/resume/:id", requireAuth, deleteResume);
  app.patch("/api/resume/:id/set-active", requireAuth, setActiveResume);
  app.post("/api/resume/interactions", updateResumeInteractions);
  app.get("/api/resume/skills", getSkills);
  app.get("/api/resume/experiences", getExperiences);
  app.get("/api/resume/education", getEducation);
  app.get("/api/resume/projects", getProjects);
  app.get("/api/resume/personal-info", getPersonalInfo);
  
  // Resume optimization routes (AI-powered ATS optimization)
  app.post("/api/resume/optimize/:id", requireAuth, optimizeResume);
  app.post("/api/resume/apply-optimization/:id", requireAuth, applyOptimization);

  // Authentication routes
  app.use("/api/auth", authRouter);

  // Recruiter authentication routes
  app.use("/api/recruiter/auth", recruiterAuthRouter);

  // Recruiter dashboard routes
  app.use("/api/recruiter/dashboard", recruiterDashboardRouter);

  // Company profile routes
  app.use("/api/recruiter/company", companyProfileRouter);
  
  // Job postings routes
  app.use("/api/recruiter/jobs", jobPostingsRouter);
  
  // Candidates routes
  app.use("/api/recruiter/candidates", candidatesRouter);
  
  // Recruiter applications routes
  app.use("/api/recruiter", recruiterApplicationsRouter);
  
  // Application AI Screening routes (recruiter only)
  app.use("/api/recruiter/applications", applicationScreeningRouter);

  // AI Screening routes (recruiter only)
  app.use("/api/ai-screening", aiScreeningRouter);

  // Dashboard routes
  app.use("/api/dashboard", dashboardRouter);

  // Template customization routes
  app.use("/api/template-customizations", templateCustomizationRouter);

  // Customization routes
  app.use("/api/customization", customizationRouter);

  // Referrals routes
  app.use("/api/referrals", referralsRouter);

  // Referee follow-up routes
  app.use("/api/referee", refereeFollowUpRouter);

  // Referral analytics routes
  app.use("/api/analytics", referralAnalyticsRouter);

  // Referral admin routes
  app.use("/api/admin/referrals", referralAdminRouter);

  // Admin user management routes
  app.use("/api/admin", adminUsersRouter);

  // User profile routes (with auth middleware)
  app.use("/api/user", requireAuth, userProfileRouter);

  // Resume parsing routes (AI-powered resume upload and parsing)
  app.use("/api/resume", resumeParsingRouter);
  
  // ATS scoring routes
  app.use("/api/ats", atsScoringRouter);

  // AI Audit routes (for monitoring AI service interactions)
  app.use("/api/ai-audit", aiAuditRouter);

  // Fake Job Detection routes (DSPy-trained detector)
  app.use("/api/fake-job-detection", fakeJobDetectionRouter);

  // Public Fake Job Detection routes (rate-limited, no auth)
  app.use("/api/public/fake-job-detection", publicFakeJobDetectionRouter);

  // Guest resume parsing routes (no auth required)
  app.use("/api/guest/resume", guestResumeParsingRouter);

  // Job matching integration routes
  app.use("/api/job-matching", jobMatchingIntegrationRouter);

  // Database row interface for job recommendations query
  interface JobRecommendationRow {
    id: string;
    title: string;
    company: string;
    description: string;
    requirements: string;
    salary_min: number;
    salary_max: number;
    currency: string;
    location: string;
    remote: number;
    type: string;
    experience_level: string;
    industry: string;
    company_size: string;
    posted_date: string;
    status: string;
    match_score: number | null;
    skills_matched: string | null;
    skills_missing: string | null;
    match_reasons: string | null;
  }

  // Simple job recommendations endpoint
  app.get("/api/jobs/recommendations", requireAuth, async (req, res) => {
    let db;
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      const { initializeDatabase } = await import('./database/connection.js');
      db = await initializeDatabase();
      
      // Get job recommendations from job_opportunities (real job data) - PostgreSQL
      const query = `
        SELECT 
          jp.id,
          jp.title,
          jp.company,
          jp.description,
          jp.requirements,
          jp.location,
          jp.job_type,
          jp.experience_level,
          jp.salary_min,
          jp.salary_max,
          jp.created_at,
          jp.application_count
        FROM job_postings jp
        WHERE jp.status = 'active'
        ORDER BY jp.created_at DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limit]);
      const recommendations = result.rows;

      const formattedJobs = recommendations.map((job: any) => {
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
          jobs: formattedJobs,
          total: formattedJobs.length
        }
      });
    } catch (error) {
      console.error("Error fetching job recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    } finally {
      if (db) {
        const { closeDatabase } = await import('./database/connection.js');
        await closeDatabase();
      }
    }
  });

  // Job analytics endpoint with real data
  app.get("/api/jobs/analytics", requireAuth, async (req, res) => {
    let db;
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      const { initializeDatabase } = await import('./database/connection.js');
      db = await initializeDatabase();

      // Get total active jobs from job_opportunities - PostgreSQL
      const totalJobsResult = await db.query(`
        SELECT COUNT(*) as count 
        FROM job_postings 
        WHERE status = 'active'
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
        data: analytics
      });
    } catch (error) {
      console.error("Error fetching job analytics:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    } finally {
      if (db) {
        const { closeDatabase } = await import('./database/connection.js');
        await closeDatabase();
      }
    }
  });

  // Job discovery and application routes
  app.use("/api/jobs", jobsRouter);
  
  // Job recommendations routes (overlays on /api/jobs for recommendations, analytics, etc.)
  app.use("/api/jobs", jobRecommendationsRouter);
  
  // Job applications routes
  app.use("/api/job-applications", jobApplicationsRouter);
  
  // File upload routes
  app.use("/api/upload", fileUploadRouter);

  // Resume sharing routes
  app.use("/api/resume-sharing", resumeSharingRouter);
  app.use("/api/resume-upvotes", resumeUpvotesRouter);
  
  // Recruiter shortlist routes (handles authentication internally)
  app.use("/api/recruiter/shortlist", recruiterShortlistRouter);
  
  // Interview scheduling routes
  app.use("/api/interviews", interviewsRouter);
  
  // Video call routes
  app.use("/api/video", videoRouter);
  
  // AI Chat routes
  app.use("/api/ai-chat", aiChatRouter);
  
  // Recruiter AI Chat routes
  app.use("/api/recruiter-ai-chat", recruiterAiChatRouter);
  
  // Job Search routes
  app.use("/api/job-search", jobSearchRouter);
  
  // Waitlist routes (public)
  app.use("/api/waitlist", waitlistRouter);
  
  // Sustainability Pledge routes (public)
  app.use("/api/pledge", pledgeRouter);
  
  // Subscription routes
  app.use("/api/subscriptions", subscriptionsRouter);
  
  // Payment routes
  app.use("/api/payment", paymentRouter);
  
  // Payment history and invoices routes
  app.use("/api/payment-history", paymentHistoryRouter);

  // Remove catch-all route for static file serving (handled by Netlify)
  // In development, Vite handles client-side routing
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res, next) => {
      // Skip API routes, health checks, and static assets
      if (req.path.startsWith('/api/') || 
          req.path === '/health' ||
          req.path.startsWith('/@') || // Vite internal routes
          req.path.startsWith('/node_modules/') ||
          req.path.includes('.') && (req.path.endsWith('.js') || req.path.endsWith('.ts') || req.path.endsWith('.jsx') || req.path.endsWith('.tsx') || req.path.endsWith('.css') || req.path.endsWith('.scss') || req.path.endsWith('.json') || req.path.endsWith('.svg') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.ico'))) {
        return next();
      }
      // Serve index.html for client-side routing
      res.sendFile(path.join(__dirname, '../spa/index.html'));
    });
  }

  // Add 404 handler for unmatched API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'API route not found' });
  });

  // Add generic error handler for API routes
  app.use((err, req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.error('API error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    } else {
      next(err);
    }
  });
  return app;
}
