import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get proper directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
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
  updateResumeSection,
  deleteResume,
  setActiveResume,
} from "./routes/resume";
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
import testCompanyExtractionRouter from "./routes/testCompanyExtraction";
import resumeMetadataRouter from "./routes/resumeMetadata";
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
import coverLetterRouter from "./routes/coverLetter.js";
import jobMatchingRouter from "./routes/jobMatching.js";
import resumeOptimizationRouter from "./routes/resumeOptimization.js";
import aiSummaryRouter from "./routes/aiSummary.js";
import jobPreferencesRouter from "./routes/jobPreferences.js";
import locationSearchRouter from "./routes/locationSearch.js";
import recruiterActionsRouter from "./routes/recruiterActions";
import emailTestRouter from "./routes/emailTest";
import { createMockTestRoutes } from "./routes/mockTests";
import { requireAuth } from "./middleware/unifiedAuth";
import { getDatabase, initializeDatabase, closeDatabase } from "./database/connection";
import jwt from 'jsonwebtoken';
import { seedDatabase } from "./database/seedData";

export function createServer() {
  const app = express();

  // Only initialize database in runtime, not during build
  if (process.env.NODE_ENV !== 'build' && typeof window === 'undefined' && !process.env.VITE_BUILD) {
    // Use setTimeout to defer database initialization until after server setup
    setTimeout(async () => {
      try {
        await initializeDatabase();
        await seedDatabase();
      } catch (error) {
        console.warn('Database initialization skipped:', error.message);
      }
    }, 100);
  }

  // Middleware
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
      'https://cvzen.in',
      'https://www.cvzen.in',
      'https://www.cvzen.ai',
      /https:\/\/.*\.cvzen\.in$/,
      /https:\/\/.*\.cvzen\.ai$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`🔍 Express received: ${req.method} ${req.path}`);
    next();
  });

  // Shared resume HTML pages (for social media crawlers)
  app.get("/share/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;
      const userAgent = req.get('User-Agent') || '';
      
      // Check if this is a social media crawler
      const isCrawler = /bot|crawler|spider|crawling|facebook|twitter|linkedin|whatsapp|telegram/i.test(userAgent);
      
      if (isCrawler) {
        // Serve HTML with meta tags for crawlers
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/resume/share-preview/${shareToken}`);
        if (response.ok) {
          const html = await response.text();
          res.setHeader('Content-Type', 'text/html');
          res.send(html);
        } else {
          res.status(404).send('Resume not found');
        }
      } else {
        // Serve the React app for regular users
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      }
    } catch (error) {
      console.error('Error serving shared resume:', error);
      res.status(500).send('Error loading resume');
    }
  });



  // Health check and debug routes
  app.get("/api/ping", (_req, res) => {
    console.log("✅ Ping endpoint hit!");
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/health", async (_req, res) => {
    try {
      // Test database connection
      const db = await getDatabase();
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
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ 
        status: "unhealthy",
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
  app.patch("/api/resume/:id", requireAuth, updateResumeSection);
  app.delete("/api/resume/:id", requireAuth, deleteResume);
  app.patch("/api/resume/:id/set-active", requireAuth, setActiveResume);
  app.post("/api/resume/interactions", updateResumeInteractions);
  app.get("/api/resume/skills", getSkills);
  app.get("/api/resume/experiences", getExperiences);
  app.get("/api/resume/education", getEducation);
  app.get("/api/resume/projects", getProjects);
  app.get("/api/resume/personal-info", getPersonalInfo);
  
  // Resume optimization routes (AI-powered ATS optimization) - handled by resumeOptimizationRouter

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
  
  // Public job routes (no auth required)
  app.use("/api/jobs", jobPostingsRouter);
  
  // Candidates routes
  app.use("/api/recruiter/candidates", candidatesRouter);
  
  // Recruiter applications routes
  app.use("/api/recruiter", recruiterApplicationsRouter);
  
  // Recruiter actions routes (shortlisting, etc.)
  app.use("/api/recruiter", recruiterActionsRouter);
  
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

  // Job routes are split across two routers for organization:
  // - jobsRouter: handles /search endpoint (job discovery with filters)
  // - jobRecommendationsRouter: handles /recommendations, /analytics, /save, /applications
  // Both mount on /api/jobs but handle different endpoints (no conflicts)
  app.use("/api/jobs", jobsRouter);
  app.use("/api/jobs", jobRecommendationsRouter);
  
  // Job applications routes
  app.use("/api/job-applications", jobApplicationsRouter);
  
  // File upload routes
  app.use("/api/upload", fileUploadRouter);

  // Resume sharing routes
  app.use("/api/resume-sharing", resumeSharingRouter);
  app.use("/api/resume-upvotes", resumeUpvotesRouter);
  app.use("/api/resume", resumeMetadataRouter);
  
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

  // Cover letter generation routes
  app.use("/api/cover-letter", coverLetterRouter);

  // Job matching and ATS scoring routes
  app.use("/api/job-matching", jobMatchingRouter);

  // Resume optimization routes
  app.use("/api/resume-optimization", resumeOptimizationRouter);

  // AI summary generation routes
  app.use("/api/ai", aiSummaryRouter);

  // Job preferences routes
  app.use("/api/job-preferences", jobPreferencesRouter);

  // Mock test routes
  app.use("/api/mock-tests", createMockTestRoutes());

  // Test routes (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use("/api/test", testCompanyExtractionRouter);
  }

  // Location search routes (for interview scheduling)
  app.use("/api/location", locationSearchRouter);

  // Email testing routes (development only)
  app.use("/api/email", emailTestRouter);

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
