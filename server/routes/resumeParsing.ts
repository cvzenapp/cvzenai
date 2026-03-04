import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import { resumeParsingService } from '../services/resumeParsingService.js';
import { resumeStorageService } from '../services/resumeStorageService.js';
import { initializeDatabase, closeDatabase } from '../database/connection.js';

const router = Router();

// Get proper directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads', 'temp');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

// File filter for resume uploads
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

/**
 * POST /api/resume/parse
 * Parse uploaded resume file and store in database
 */
router.post('/parse', unifiedAuth.requireAuth, upload.single('resume'), async (req: AuthRequest, res) => {
  console.log('📤 Resume parse request received');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const resumeTitle = req.body.title || undefined;
    
    console.log('📄 Processing resume:', {
      userId,
      fileName: req.file.originalname,
      mimeType,
      size: req.file.size
    });
    
    // Step 1: Extract text from file
    const resumeText = await resumeParsingService.extractTextFromFile(filePath, mimeType);
    
    if (!resumeText || resumeText.trim().length < 100) {
      await resumeParsingService.cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        error: 'Could not extract sufficient text from resume. Please ensure the file is not corrupted or empty.'
      });
    }
    
    // Step 2: Parse resume with AI
    const parsedData = await resumeParsingService.parseResumeWithAI(resumeText);
    
    console.log('🔍 [ROUTE] Parsed data received from parsing service:', {
      hasAtsScore: !!parsedData.atsScore,
      atsScoreValue: parsedData.atsScore?.overallScore,
      atsScoreKeys: parsedData.atsScore ? Object.keys(parsedData.atsScore) : []
    });
    
    // Step 3: Validate parsed data
    const validation = resumeParsingService.validateParsedData(parsedData);
    
    if (!validation.valid) {
      await resumeParsingService.cleanupFile(filePath);
      return res.status(400).json({
        success: false,
        error: 'Resume parsing validation failed',
        details: validation.errors
      });
    }
    
    // Step 4: Store in database (without ATS score initially)
    const result = await resumeStorageService.storeResumeData(userId, parsedData, resumeTitle);
    
    // Step 5: Calculate ATS score asynchronously (don't wait)
    const resumeId = result.resumeId;
    setImmediate(async () => {
      try {
        console.log(`🎯 Starting async ATS calculation for resume ${resumeId}`);
        const { atsScorer } = await import('../services/dspy/atsScorer.js');
        const atsScore = await atsScorer.calculateScore(parsedData);
        
        const db = await initializeDatabase();
        await db.query(
          `UPDATE resumes SET
            ats_score = $1,
            ats_score_completeness = $2,
            ats_score_formatting = $3,
            ats_score_keywords = $4,
            ats_score_experience = $5,
            ats_score_education = $6,
            ats_score_skills = $7,
            ats_suggestions = $8,
            ats_strengths = $9,
            ats_scored_at = NOW()
          WHERE id = $10`,
          [
            atsScore.overallScore,
            atsScore.scores.completeness,
            atsScore.scores.formatting,
            atsScore.scores.keywords,
            atsScore.scores.experience,
            atsScore.scores.education,
            atsScore.scores.skills,
            JSON.stringify(atsScore.suggestions),
            JSON.stringify(atsScore.strengths),
            resumeId
          ]
        );
        console.log(`✅ ATS score stored for resume ${resumeId}: ${atsScore.overallScore}/100`);
      } catch (error) {
        console.error(`❌ Async ATS calculation failed for resume ${resumeId}:`, error);
      }
    });
    
    // Step 6: Cleanup temporary file
    await resumeParsingService.cleanupFile(filePath);
    
    // Return success with parsed data and resume ID
    return res.json({
      success: true,
      message: result.message,
      resumeId: result.resumeId,
      parsedData: {
        personalInfo: parsedData.personalInfo,
        summary: parsedData.summary,
        objective: parsedData.objective,
        skillsCount: parsedData.skills.length,
        experienceCount: parsedData.experience.length,
        educationCount: parsedData.education.length,
        projectsCount: parsedData.projects?.length || 0,
        certificationsCount: parsedData.certifications?.length || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Resume parsing error:', error);
    
    // Cleanup file on error
    if (req.file?.path) {
      await resumeParsingService.cleanupFile(req.file.path).catch(() => {});
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse resume'
    });
  }
});

/**
 * GET /api/resume/parse/status
 * Check if user has any resumes
 */
router.get('/status', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const userId = req.user.id;
    const resumeCount = await resumeStorageService.getUserResumeCount(userId);
    const latestResume = await resumeStorageService.getUserLatestResume(userId);
    
    return res.json({
      success: true,
      hasResumes: resumeCount > 0,
      resumeCount,
      latestResume: latestResume ? {
        id: latestResume.id,
        title: latestResume.title,
        createdAt: latestResume.created_at,
        updatedAt: latestResume.updated_at
      } : null
    });
    
  } catch (error) {
    console.error('❌ Resume status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check resume status'
    });
  }
});

export default router;