import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import { resumeParsingService } from '../services/resumeParsingService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get proper directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 [fileUpload] Debug path info:');
console.log('  import.meta.url:', import.meta.url);
console.log('  __filename:', __filename);
console.log('  __dirname:', __dirname);

// Recruiter auth middleware
function verifyRecruiterToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('🔍 [fileUpload] Creating upload directory, __dirname:', __dirname);
    const uploadDir = path.join(__dirname, '../../uploads', 'resumes');
    console.log('🔍 [fileUpload] uploadDir:', uploadDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp_originalname
    const userId = (req as AuthRequest).user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${userId}_${timestamp}_${basename}${ext}`);
  }
});

// File filter to accept only PDF, DOC, DOCX
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  console.log('📋 File filter check:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    allowed: allowedMimes.includes(file.mimetype)
  });
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type: ${file.mimetype}. Only PDF, DOC, and DOCX files are allowed.`);
    console.log('❌ File rejected:', error.message);
    cb(error);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/upload/resume - Upload resume file (authenticated)
router.post('/resume', unifiedAuth.requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('📤 Resume upload request received:', {
      userId: req.user?.id,
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });

    if (!req.file) {
      console.log('❌ No file in upload request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    const filePath = req.file.path;
    
    console.log('✅ Resume file uploaded successfully:', {
      userId: req.user.id,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
      path: filePath
    });

    // Parse resume with Groq AI
    let parsedData = null;
    let resumeId = null;
    
    try {
      console.log('🤖 Starting resume parsing with Groq...');
      
      // Extract text from file with error handling for test file interference
      let resumeText;
      try {
        resumeText = await resumeParsingService.extractTextFromFile(filePath, req.file.mimetype);
        console.log('📄 Text extraction successful:', {
          textLength: resumeText.length,
          fileType: req.file.mimetype,
          preview: resumeText.substring(0, 150) + '...'
        });
      } catch (extractError: any) {
        console.error('❌ Text extraction failed:', extractError.message);
        throw extractError; // This will be caught by the outer try-catch and handled gracefully
      }
      
      // Parse with AI
      parsedData = await resumeParsingService.parseResumeWithAI(resumeText);
      
      // Validate parsed data
      const validation = resumeParsingService.validateParsedData(parsedData);
      if (!validation.valid) {
        console.warn('⚠️ Parsed data validation warnings:', validation.errors);
      }
      
      // console.log('✅ Resume parsed successfully');
      // console.log('📊 Parsed data structure:', {
      //   personalInfo: parsedData.personalInfo,
      //   skillsCount: parsedData.skills?.length,
      //   firstSkills: parsedData.skills?.slice(0, 3),
      //   experienceCount: parsedData.experience?.length,
      //   firstExperience: parsedData.experience?.[0],
      //   educationCount: parsedData.education?.length,
      //   projectsCount: parsedData.projects?.length
      // });
      
      // Create resume in database
      const { getDatabase } = await import('../database/connection.js');
      const db = await getDatabase();
      
      const resumeTitle = `${parsedData.personalInfo.fullName}'s Resume` || 'Imported Resume';
      
      // Add IDs to array items for ResumeBuilder compatibility - preserve raw AI JSON
      const experienceWithIds = (parsedData.experience || []).map((exp: any, index: number) => ({
        ...exp, // Keep ALL properties from AI response including skills
        id: exp.id || `exp-${Date.now()}-${index}`
      }));
      
      const educationWithIds = (parsedData.education || []).map((edu: any, index: number) => ({
        ...edu,
        id: edu.id || `edu-${Date.now()}-${index}`
      }));
      
      const skillsWithIds = (parsedData.skills || []).map((skill: any, index: number) => {
        // Handle both string skills and object skills
        if (typeof skill === 'string') {
          return {
            id: `skill-${Date.now()}-${index}`,
            name: skill,
            category: 'General',
            yearsOfExperience: 0,
            proficiency: 50,
            isCore: false
          };
        }
        // Skill is already an object with category and proficiency
        return {
          id: skill.id || `skill-${Date.now()}-${index}`,
          name: skill.name || skill,
          category: skill.category || 'General',
          yearsOfExperience: skill.yearsOfExperience || 0,
          proficiency: skill.proficiency || 50,
          isCore: skill.isCore || false
        };
      });
      
      const projectsWithIds = (parsedData.projects || []).map((proj: any, index: number) => ({
        ...proj,
        id: proj.id || `proj-${Date.now()}-${index}`,
        technologies: proj.technologies || [],
        images: proj.images || []
      }));
      
      // First, try to remove the problematic unique constraint if it exists
      try {
        await db.query(`
          DO $$ 
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'resumes_id_unique' 
              AND conrelid = 'resumes'::regclass
            ) THEN
              ALTER TABLE resumes DROP CONSTRAINT resumes_id_unique;
            END IF;
          END $$;
        `);
      } catch (constraintError) {
        console.log('⚠️ Could not drop constraint (may not exist):', constraintError.message);
      }
      
      const insertResult = await db.query(`
        INSERT INTO resumes (
          id,
          user_id,
          title,
          personal_info,
          experience,
          education,
          skills,
          projects,
          summary,
          objective,
          template_id,
          is_active
        ) VALUES (
          (SELECT COALESCE(MAX(id), 1) + 1 FROM resumes),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING id
      `, [
        req.user.id,
        resumeTitle,
        JSON.stringify(parsedData.personalInfo),
        JSON.stringify(experienceWithIds),
        JSON.stringify(educationWithIds),
        JSON.stringify(skillsWithIds),
        JSON.stringify(projectsWithIds),
        parsedData.summary || '',
        parsedData.objective || '',
        'modern-professional', // Default template
        true // Set as active resume
      ]);
      
      resumeId = insertResult.rows[0].id;
      
      console.log('✅ Resume created in database:', {
        resumeId,
        userId: req.user.id,
        title: resumeTitle,
        dataInserted: {
          skills: parsedData.skills?.length,
          experience: parsedData.experience?.length,
          education: parsedData.education?.length,
          projects: parsedData.projects?.length
        },
        experienceWithSkills: experienceWithIds.map(exp => ({
          title: exp.title,
          company: exp.company,
          skillsCount: exp.skills?.length || 0
        }))
      });

      // Generate shareToken automatically using proper slug generator
      const fullName = parsedData.personalInfo.fullName || parsedData.personalInfo.name || 'resume';
      
      // Import and use the proper slug generator
      const { generateUniqueSlug } = await import('../lib/slugGenerator.js');
      const shareToken = await generateUniqueSlug(db, fullName);
      
      // Create resume share entry
      await db.query(`
        INSERT INTO resume_shares (resume_id, user_id, share_token, is_active, expires_at)
        VALUES ($1, $2, $3, true, NULL)
      `, [resumeId, req.user.id, shareToken]);

      console.log('✅ ShareToken created:', shareToken, 'for resume:', resumeId);
      
    } catch (parseError) {
      console.error('❌ Resume parsing or database insertion failed:', parseError);
      
      // Check if it's a text extraction error (PDF/DOCX specific)
      if (parseError.message.includes('PDF appears to be empty') || 
          parseError.message.includes('contains mostly images') ||
          parseError.message.includes('corrupted') ||
          parseError.message.includes('Password-protected')) {
        // Return error for PDF-specific issues
        return res.status(400).json({
          success: false,
          error: parseError.message,
          uploaded: true,
          url: fileUrl,
          filename: req.file.originalname,
          size: req.file.size
        });
      }
      
      // For other parsing errors, still allow the upload but without parsing
      console.log('⚠️ Continuing with upload despite parsing failure');
      parsedData = null;
    }

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      parsed: !!parsedData,
      parsedData: parsedData,
      resumeId: resumeId, // Return the created resume ID
      message: resumeId ? 'Resume uploaded and imported successfully' : 'Resume uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Resume upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload CV'
    });
  }
});

// POST /api/upload/guest-resume - Upload resume file (no auth required)
router.post('/guest-resume', upload.single('resume'), async (req, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    
    console.log('✅ Guest resume file uploaded:', {
      name: req.body.name,
      email: req.body.email,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    res.json({
      success: true,
      fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Guest resume upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload CV'
    });
  }
});

// POST /api/upload/recruiter-resume - Upload resume file (recruiter auth)
router.post('/recruiter-resume', upload.single('file'), async (req, res: Response) => {
  try {
    // Verify recruiter token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyRecruiterToken(token);
    
    if (!decoded || !decoded.recruiterId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    
    console.log('✅ Recruiter resume file uploaded:', {
      recruiterId: decoded.recruiterId,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Recruiter resume upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload CV'
    });
  }
});

// POST /api/upload/test-parse - Test resume parsing without saving (authenticated)
router.post('/test-parse', unifiedAuth.requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    console.log('🧪 Test parsing request received:', {
      userId: req.user?.id,
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    
    try {
      // Extract text from file
      const resumeText = await resumeParsingService.extractTextFromFile(filePath, req.file.mimetype);
      
      // Clean up the uploaded file
      await resumeParsingService.cleanupFile(filePath);
      
      res.json({
        success: true,
        textExtracted: true,
        textLength: resumeText.length,
        textPreview: resumeText.substring(0, 500) + (resumeText.length > 500 ? '...' : ''),
        fileInfo: {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (extractError) {
      // Clean up the uploaded file even on error
      await resumeParsingService.cleanupFile(filePath);
      
      res.status(400).json({
        success: false,
        error: extractError.message,
        fileInfo: {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    }
  } catch (error) {
    console.error('❌ Test parsing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test parse file'
    });
  }
});

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads', 'images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp_originalname
    const userId = (req as AuthRequest).user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${userId}_${timestamp}_${basename}${ext}`;
    cb(null, filename);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/upload/image - Upload image file (authenticated)
router.post('/image', unifiedAuth.requireAuth, imageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log('✅ Image uploaded:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Generate URL for the uploaded file
    const fileUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      data: {
        url: fileUrl,
        filename: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

export default router;
