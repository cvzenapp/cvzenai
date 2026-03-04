import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { resumeParsingService, ParsedResumeData } from './resumeParsingService.js';
import { resumeStorageService } from './resumeStorageService.js';

interface GuestResumeResult {
  success: boolean;
  userId?: string;
  resumeId?: number;
  shareToken?: string;
  resumeUrl?: string;
  password?: string;
  error?: string;
  accountCreated?: boolean;
  accountExisted?: boolean;
}

class GuestResumeService {
  /**
   * Generate a secure random password
   */
  private generatePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Extract name parts from full name
   */
  private extractNameParts(fullName: string): { firstName: string; lastName: string } {
    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    
    return { firstName, lastName };
  }

  /**
   * Check if user exists by email
   */
  private async checkUserExists(db: any, email: string): Promise<{ exists: boolean; userId?: string }> {
    const result = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    return {
      exists: result.rows.length > 0,
      userId: result.rows[0]?.id
    };
  }

  /**
   * Create user account with auto-generated password
   */
  private async createUserAccount(
    db: any,
    email: string,
    fullName: string,
    password: string
  ): Promise<string> {
    const { firstName, lastName } = this.extractNameParts(fullName);
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_active)
       VALUES ($1, $2, $3, $4, false, true)
       RETURNING id`,
      [email.toLowerCase(), passwordHash, firstName, lastName]
    );
    
    return result.rows[0].id;
  }

  /**
   * Generate unique slug for resume sharing
   */
  private async generateUniqueSlug(db: any, baseName: string): Promise<string> {
    const { generateUniqueSlug } = await import('../lib/slugGenerator.js');
    return generateUniqueSlug(db, baseName);
  }

  /**
   * Create resume share entry
   */
  private async createResumeShare(
    db: any,
    resumeId: number,
    userId: string,
    slug: string
  ): Promise<string> {
    const result = await db.query(
      `INSERT INTO resume_shares (resume_id, user_id, share_token, is_active, expires_at)
       VALUES ($1, $2, $3, true, NULL)
       RETURNING share_token`,
      [resumeId, userId, slug]
    );
    
    return result.rows[0].share_token;
  }

  /**
   * Process guest resume: parse, create account if needed, store resume
   */
  async processGuestResume(
    filePath: string,
    mimeType: string,
    guestName: string,
    guestEmail: string
  ): Promise<GuestResumeResult> {
    const { initializeDatabase, closeDatabase } = await import('../database/connection.js');
    let db;
    
    try {
      console.log('🎯 Processing guest resume:', { guestName, guestEmail });
      
      // Step 1: Extract text from file
      const resumeText = await resumeParsingService.extractTextFromFile(filePath, mimeType);
      
      if (!resumeText || resumeText.trim().length < 100) {
        return {
          success: false,
          error: 'Could not extract sufficient text from resume'
        };
      }
      
      // Step 2: Parse resume with AI
      console.log('📝 Resume text length:', resumeText.length, 'characters');
      console.log('📝 Resume text preview (first 500 chars):', resumeText.substring(0, 500));
      
      let parsedData;
      try {
        parsedData = await resumeParsingService.parseResumeWithAI(resumeText);
        
        // Log parsed data structure
        console.log('🔍 Parsed data structure:', {
          hasPersonalInfo: !!parsedData.personalInfo,
          personalInfoKeys: parsedData.personalInfo ? Object.keys(parsedData.personalInfo) : [],
          skillsCount: parsedData.skills?.length || 0,
          experienceCount: parsedData.experience?.length || 0,
          educationCount: parsedData.education?.length || 0,
          projectsCount: parsedData.projects?.length || 0,
          certificationsCount: parsedData.certifications?.length || 0
        });
        
        // Log actual data
        console.log('🔍 Parsed Skills:', JSON.stringify(parsedData.skills));
        console.log('🔍 Parsed Experience:', JSON.stringify(parsedData.experience));
        console.log('🔍 Parsed Education:', JSON.stringify(parsedData.education));
        console.log('🔍 Parsed Projects:', JSON.stringify(parsedData.projects));
        
      } catch (parseError) {
        console.error('❌ Resume parsing error:', parseError);
        return {
          success: false,
          error: 'Failed to parse resume. The file may be corrupted or in an unsupported format. Please try uploading a different resume.'
        };
      }
      
      // Override personal info with guest-provided data if parsed data is incomplete
      if (!parsedData.personalInfo.email || parsedData.personalInfo.email === '') {
        parsedData.personalInfo.email = guestEmail;
      }
      if (!parsedData.personalInfo.fullName || parsedData.personalInfo.fullName === '') {
        parsedData.personalInfo.fullName = guestName;
      }
      
      // Step 3: Validate parsed data
      const validation = resumeParsingService.validateParsedData(parsedData);
      
      if (!validation.valid) {
        console.warn('⚠️ Resume validation warnings:', validation.errors);
        // For guest applications, only fail if critical fields are completely missing
        if (!parsedData.personalInfo?.fullName && !parsedData.personalInfo?.email) {
          return {
            success: false,
            error: 'Could not extract basic information from resume. Please ensure your resume includes your name and contact details clearly.'
          };
        }
        // Otherwise continue with what we have
      }
      
      // Step 3.5: Check if resume data is completely empty
      const hasAnyData = (
        (parsedData.skills && parsedData.skills.length > 0) ||
        (parsedData.experience && parsedData.experience.length > 0) ||
        (parsedData.education && parsedData.education.length > 0) ||
        (parsedData.projects && parsedData.projects.length > 0)
      );
      
      if (!hasAnyData) {
        console.error('❌ Resume parsing returned completely empty data');
        console.log('📝 Resume text length:', resumeText.length);
        console.log('📝 Resume text preview:', resumeText.substring(0, 500));
        
        return {
          success: false,
          error: 'Could not extract any information from your resume. This may be due to:\n' +
                 '• Unsupported file format or corrupted file\n' +
                 '• Resume text is not readable\n' +
                 '• Resume format is not recognized\n\n' +
                 'Please try:\n' +
                 '• Converting your resume to a standard PDF format\n' +
                 '• Ensuring text is selectable (not an image)\n' +
                 '• Using a different resume file'
        };
      }
      
      console.log('✅ Resume has data - proceeding with account creation and storage');
      
      // Step 4: Check if user exists (initialize DB here, after parsing is complete)
      db = await initializeDatabase();
      const userCheck = await this.checkUserExists(db, guestEmail);
      
      let userId: string;
      let password: string | undefined;
      let accountCreated = false;
      let accountExisted = false;
      
      if (userCheck.exists) {
        // User already exists
        userId = userCheck.userId!;
        accountExisted = true;
        console.log('✅ User account already exists:', userId);
      } else {
        // Create new user account
        password = this.generatePassword();
        userId = await this.createUserAccount(db, guestEmail, guestName, password);
        accountCreated = true;
        console.log('✅ Created new user account:', userId);
      }
      
      // Step 5: Store resume data (this manages its own DB connection)
      // Don't close connection - let connection pool manage connections
      if (db) {
        db = null;
      }
      
      const resumeTitle = `Resume - ${parsedData.personalInfo.fullName || guestName}`;
      const storeResult = await resumeStorageService.storeResumeData(userId, parsedData, resumeTitle);
      
      console.log('✅ Resume stored:', storeResult.resumeId);
      
      // Step 6: Create resume share for public access (reinitialize DB)
      db = await initializeDatabase();
      const slug = await this.generateUniqueSlug(db, parsedData.personalInfo.fullName || guestName);
      const shareToken = await this.createResumeShare(db, storeResult.resumeId, userId, slug);
      
      const resumeUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/shared/resume/${shareToken}`;
      
      console.log('✅ Resume share created:', resumeUrl);
      
      return {
        success: true,
        userId,
        resumeId: storeResult.resumeId,
        shareToken,
        resumeUrl,
        password: accountCreated ? password : undefined,
        accountCreated,
        accountExisted
      };
      
    } catch (error) {
      console.error('❌ Guest resume processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process resume'
      };
    } finally {
      if (db) {
        // Don't close database - let connection pool manage connections
      }
    }
  }

  /**
   * Send welcome email with credentials to new user
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    password: string,
    resumeUrl: string
  ): Promise<void> {
    console.log('📧 Sending welcome email to:', email);
    
    const { emailService } = await import('./emailService.js');
    
    try {
      const success = await emailService.sendWelcomeEmail(email, name, password, resumeUrl);
      
      if (success) {
        console.log('✅ Welcome email sent successfully to:', email);
      } else {
        console.error('❌ Failed to send welcome email to:', email);
        // Log credentials as fallback
        console.log('📧 Fallback - Account credentials:');
        console.log('  Email:', email);
        console.log('  Password:', password);
        console.log('  Resume URL:', resumeUrl);
        console.log('  Login URL:', `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`);
      }
    } catch (error) {
      console.error('❌ Email service error:', error);
      // Log credentials as fallback
      console.log('📧 Fallback - Account credentials:');
      console.log('  Email:', email);
      console.log('  Password:', password);
      console.log('  Resume URL:', resumeUrl);
      console.log('  Login URL:', `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login`);
    }
  }
}

export const guestResumeService = new GuestResumeService();
