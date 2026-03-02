/**
 * Guest Resume Parsing Route
 * Handles resume parsing for guest job applications with auto-account creation
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { z } from 'zod';
import { guestResumeService } from '../services/guestResumeService.js';
import { resumeParsingService } from '../services/resumeParsingService.js';

const router = Router();

// Get proper directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads', 'temp', 'guest');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `guest-resume-${uniqueSuffix}${ext}`);
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

// Validation schema
const guestResumeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required')
});

/**
 * POST /api/guest/resume/parse
 * Parse guest resume and create account if needed (no authentication required)
 */
router.post('/parse', upload.single('resume'), async (req, res) => {
  console.log('📤 Guest resume parse request received');
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    // Validate guest data
    const validatedData = guestResumeSchema.parse({
      name: req.body.name,
      email: req.body.email
    });
    
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    
    console.log('📄 Processing guest resume:', {
      name: validatedData.name,
      email: validatedData.email,
      fileName: req.file.originalname,
      mimeType,
      size: req.file.size
    });
    
    // Process guest resume (parse, create account if needed, store)
    const result = await guestResumeService.processGuestResume(
      filePath,
      mimeType,
      validatedData.name,
      validatedData.email
    );
    
    // Cleanup temporary file
    await resumeParsingService.cleanupFile(filePath);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to process resume'
      });
    }
    
    // Send welcome email if new account was created
    if (result.accountCreated && result.password) {
      await guestResumeService.sendWelcomeEmail(
        validatedData.email,
        validatedData.name,
        result.password,
        result.resumeUrl!
      ).catch(err => {
        console.error('⚠️ Failed to send welcome email:', err);
        // Don't fail the request if email fails
      });
    }
    
    // Return success with resume details
    return res.json({
      success: true,
      message: result.accountCreated 
        ? 'Resume parsed and account created successfully. Check your email for login credentials.'
        : 'Resume parsed and linked to existing account.',
      data: {
        userId: result.userId,
        resumeId: result.resumeId,
        shareToken: result.shareToken,
        resumeUrl: result.resumeUrl,
        accountCreated: result.accountCreated,
        accountExisted: result.accountExisted
      }
    });
    
  } catch (error) {
    console.error('❌ Guest resume parsing error:', error);
    
    // Cleanup file on error
    if (req.file?.path) {
      await resumeParsingService.cleanupFile(req.file.path).catch(() => {});
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid guest data',
        details: error.errors
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse resume'
    });
  }
});

export default router;
