import { Router, Request, Response } from "express";
import { z } from "zod";
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { emailService } from "../services/emailService";
import { companyDataExtractionService } from "../services/companyDataExtractionService";
import {
  RecruiterAuthResponse,
  Recruiter,
  COMPANY_SIZE_RANGES,
  INDUSTRIES,
  JOB_TITLES,
} from "../../shared/recruiterAuth";

dotenv.config();

const router = Router();

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function getDbClient() {
  return new Client({ connectionString });
}

// JWT helper functions
function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { 
      id: userId,        // Changed from userId to id for unified auth compatibility
      userId,            // Keep userId for backward compatibility
      email,
      type: 'recruiter'
    },
    JWT_SECRET,
    { 
      expiresIn: '7d' // Token expires in 7 days
    }
  );
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Validation schemas
const recruiterRegisterSchema = z
  .object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    jobTitle: z.string().min(2),
    phone: z.string().optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    companyWebsite: z.string().min(1, "Company website is required"),
    acceptTerms: z.boolean().refine((val) => val === true),
    acceptPrivacyPolicy: z.boolean().refine((val) => val === true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    // Validate website format
    const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return websiteRegex.test(data.companyWebsite);
  }, {
    message: "Please enter a valid website URL",
    path: ["companyWebsite"],
  })
  .refine((data) => {
    // Validate email domain matches website domain
    const getEmailDomain = (email: string) => email.split('@')[1]?.toLowerCase();
    const getWebsiteDomain = (website: string) => {
      try {
        const url = website.startsWith('http') ? website : `https://${website}`;
        return new URL(url).hostname.replace('www.', '').toLowerCase();
      } catch {
        return website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
      }
    };

    const emailDomain = getEmailDomain(data.email);
    const websiteDomain = getWebsiteDomain(data.companyWebsite);
    
    return emailDomain === websiteDomain;
  }, {
    message: "Email domain must match company website domain",
    path: ["email"],
  });

const recruiterLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

// Helper function to fetch recruiter (for fast auth)
async function fetchRecruiterMinimal(client: Client, userId: string): Promise<any> {
  const query = `
    SELECT 
      u.*,
      r.job_title, r.phone, r.linkedin_url,
      r.email_notifications, r.candidate_updates, r.interview_reminders
    FROM users u
    LEFT JOIN recruiter_profiles r ON u.id = r.user_id
    WHERE u.id = $1
  `;
  const result = await client.query(query, [userId]);
  return result.rows[0];
}

// Helper function to create recruiter object from minimal data
function createRecruiterMinimal(userData: any): Recruiter {
  return createRecruiterFromData(userData, userData);
}

// Helper function to create recruiter object
function createRecruiterFromData(user: any, profile: any): Recruiter {
  const recruiterObj = {
    id: user?.id?.toString() || "",
    email: user?.email || "",
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    jobTitle: profile?.job_title || "",
    avatar: user?.avatar || "",
    phone: profile?.phone || "",
    linkedinUrl: profile?.linkedin_url || "",
    emailNotifications: profile?.email_notifications ?? true,
    candidateUpdates: profile?.candidate_updates ?? true,
    interviewReminders: profile?.interview_reminders ?? true,
    createdAt: user?.created_at || "",
    updatedAt: user?.created_at || "",
    emailVerified: true,
    isActive: true,
  };
  
  return recruiterObj;
}

// Recruiter Registration
router.post("/register", async (req: Request, res: Response) => {
  const client = getDbClient();
  
  try {
    await client.connect();
    console.log("🔍 REGISTER: Connected to database");
    
    const validatedData = recruiterRegisterSchema.parse(req.body);
    console.log("🔍 REGISTER: Validation passed for:", validatedData.email.toLowerCase());

    // Check if email is already taken
    const existingUserQuery = `SELECT id FROM users WHERE email = $1`;
    const existingUserResult = await client.query(existingUserQuery, [validatedData.email.toLowerCase()]);
    
    if (existingUserResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
        errors: { email: "An account with this email already exists" },
      });
    }

    console.log("🔍 REGISTER: Email is available");

    // Start transaction
    await client.query('BEGIN');

    // Create user
    console.log("🔍 REGISTER: Creating user account");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
    
    const insertUserQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, user_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const userResult = await client.query(insertUserQuery, [
      validatedData.email.toLowerCase(),
      hashedPassword,
      validatedData.firstName,
      validatedData.lastName,
      'recruiter'
    ]);

    const user = userResult.rows[0];
    console.log("🔍 REGISTER: User created with ID:", user.id);

    // Extract company data from website (async, don't block registration)
    let companyId = null;
    try {
      console.log("🔍 REGISTER: Starting company data extraction for:", validatedData.companyWebsite);
      
      const companyData = await companyDataExtractionService.extractCompanyDataFromWebsite(validatedData.companyWebsite);
      
      // Check if company already exists
      const existingCompanyQuery = `SELECT id FROM companies WHERE website = $1`;
      const existingCompanyResult = await client.query(existingCompanyQuery, [validatedData.companyWebsite]);
      
      if (existingCompanyResult.rows.length > 0) {
        companyId = existingCompanyResult.rows[0].id;
        console.log("🔍 REGISTER: Using existing company with ID:", companyId);
      } else {
        // Create new company
        const insertCompanyQuery = `
          INSERT INTO companies (
            name, website, description, industry, size_range, location,
            founded_year, employee_count, company_type, work_environment,
            company_values, specialties, benefits, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id
        `;

        const companyResult = await client.query(insertCompanyQuery, [
          companyData.name,
          companyData.website,
          companyData.description,
          companyData.industry,
          companyData.size_range,
          companyData.location,
          companyData.founded_year,
          companyData.employee_count,
          companyData.company_type,
          companyData.work_environment,
          companyData.company_values,
          JSON.stringify(companyData.specialties || []),
          JSON.stringify(companyData.benefits || []),
          user.id
        ]);

        companyId = companyResult.rows[0].id;
        console.log("🔍 REGISTER: Created new company with ID:", companyId);
      }
    } catch (companyError) {
      console.error("⚠️ REGISTER: Company data extraction failed, continuing without company:", companyError);
      // Don't fail registration if company extraction fails
    }

    // Create recruiter profile
    console.log("🔍 REGISTER: Creating recruiter profile");
    const insertProfileQuery = `
      INSERT INTO recruiter_profiles (user_id, job_title, phone, linkedin_url, company_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const profileResult = await client.query(insertProfileQuery, [
      user.id,
      validatedData.jobTitle,
      validatedData.phone || null,
      validatedData.linkedinUrl || null,
      companyId
    ]);

    const profile = profileResult.rows[0];
    console.log("🔍 REGISTER: Profile created with ID:", profile.id);

    // Commit transaction
    await client.query('COMMIT');

    // Create recruiter object
    const recruiter = createRecruiterFromData(user, profile);

    // Generate JWT token
    const token = generateToken(user.id.toString(), user.email);

    const response: RecruiterAuthResponse = {
      success: true,
      recruiter,
      token,
      message: "Registration successful! Welcome to the platform. Your company information has been automatically populated from your website.",
    };

    console.log("✅ REGISTRATION SUCCESS for recruiter:", validatedData.email);
    
    // Send welcome email asynchronously
    setImmediate(async () => {
      try {
        await emailService.sendAccountCreationEmail(
          validatedData.email.toLowerCase(),
          `${validatedData.firstName} ${validatedData.lastName}`,
          user.id.toString()
        );
        console.log("✅ Welcome email sent to:", validatedData.email);
      } catch (emailError) {
        console.error("❌ Failed to send welcome email:", emailError);
      }
    });
    
    res.status(201).json(response);
    
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error("❌ Recruiter registration error:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message;
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
      message: "Registration failed. Please try again.",
      error: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorCode: error.code || 'No code',
      details: "Check server logs for more information"
    });
  } finally {
    await client.end();
  }
});

// Recruiter Login
router.post("/login", async (req: Request, res: Response) => {
  const client = getDbClient();
  
  try {
    await client.connect();
    
    const validatedData = recruiterLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    console.log("🔍 LOGIN: Attempting login for recruiter:", email.toLowerCase());

    // Get user for login
    const loginQuery = `
      SELECT 
        u.*,
        r.job_title, r.phone, r.linkedin_url,
        r.email_notifications, r.candidate_updates, r.interview_reminders
      FROM users u
      LEFT JOIN recruiter_profiles r ON u.id = r.user_id
      WHERE u.email = $1
    `;
    
    const result = await client.query(loginQuery, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errors: { email: "Invalid credentials" },
      });
    }

    const userData = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errors: { email: "Invalid credentials" },
      });
    }
    
    // IMPORTANT: Verify user type - recruiters only on this endpoint
    if (userData.user_type !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: "This is the recruiter login. Please use the job seeker login page to access your account.",
        redirectTo: "/login"
      });
    }
    
    // Create recruiter object with minimal company data for fast login
    const recruiter = createRecruiterMinimal(userData);

    const token = generateToken(userData.id.toString(), userData.email);

    const response: RecruiterAuthResponse = {
      success: true,
      recruiter,
      token,
      message: "Login successful",
    };

    console.log("✅ LOGIN SUCCESS for recruiter:", email);
    res.json(response);
    
  } catch (error) {
    console.error("❌ Recruiter login error:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: { server: "An unexpected error occurred" },
    });
  } finally {
    await client.end();
  }
});

// Get current recruiter (for /me endpoint)
router.get("/me", async (req: Request, res: Response) => {
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
  const client = getDbClient();

  try {
    await client.connect();

    const userData = await fetchRecruiterMinimal(client, userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    const recruiter = createRecruiterMinimal(userData);

    res.json({
      success: true,
      recruiter,
    });

  } catch (error) {
    console.error("❌ Get current recruiter error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recruiter",
    });
  } finally {
    await client.end();
  }
});

// Refresh token endpoint
router.post("/refresh", async (req: Request, res: Response) => {
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
  const client = getDbClient();

  try {
    await client.connect();

    const userData = await fetchRecruiterMinimal(client, userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    const recruiter = createRecruiterMinimal(userData);
    const newToken = generateToken(userId, userData.email);

    res.json({
      success: true,
      token: newToken,
      recruiter,
      message: "Token refreshed successfully",
    });

  } catch (error) {
    console.error("❌ Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  } finally {
    await client.end();
  }
});

// Recruiter Logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Recruiter logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// Get recruiter profile
router.get("/profile", async (req: Request, res: Response) => {
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
  const client = getDbClient();

  try {
    await client.connect();

    const userData = await fetchRecruiterMinimal(client, userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    const recruiter = createRecruiterMinimal(userData);

    res.json({
      success: true,
      recruiter,
    });

  } catch (error) {
    console.error("❌ Get recruiter profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  } finally {
    await client.end();
  }
});

// Validation schema for profile update - accepts company fields at root or nested
const recruiterUpdateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  jobTitle: z.string().min(2).max(100).optional(),
  avatar: z.string().optional(),
  phone: z.string()
    .min(1, "Phone number is required")
    .regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{0,4}[-\s\.]?[0-9]{0,4}$/, "Invalid phone number format")
    .refine((val) => {
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }, "Phone number must have 7-15 digits")
    .optional(),
  linkedinUrl: z.string()
    .min(1, "LinkedIn URL is required")
    .regex(/^(https?:\/\/(www\.)?linkedin\.com\/.+|(www\.)?linkedin\.com\/.+)$/i, "Must be a valid LinkedIn URL")
    .optional(),
  // Accept company as nested object
  company: z.object({
    name: z.string().min(2).max(255).optional(),
    website: z.string()
      .min(1, "Company website is required")
      .regex(/^(https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+|[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+)$/i, "Invalid URL format")
      .optional(),
    industry: z.enum(INDUSTRIES).optional(),
    sizeRange: z.enum(COMPANY_SIZE_RANGES).optional(),
    location: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).optional(),
  }).optional(),
  // Also accept company fields at root level for backwards compatibility
  companyName: z.string().min(2).max(255).optional(),
  companyWebsite: z.string().optional(),
  companyIndustry: z.enum(INDUSTRIES).optional(),
  companySizeRange: z.enum(COMPANY_SIZE_RANGES).optional(),
  companyLocation: z.string().min(2).max(255).optional(),
  companyDescription: z.string().max(1000).optional(),
  // Notification settings
  emailNotifications: z.boolean().optional(),
  candidateUpdates: z.boolean().optional(),
  interviewReminders: z.boolean().optional(),
});

// Update recruiter profile
router.put("/profile", async (req: Request, res: Response) => {
  // console.log('🔵 PUT /profile endpoint called');
  // console.log('   Headers:', req.headers.authorization ? 'Token present' : 'No token');
  // console.log('   Body:', JSON.stringify(req.body, null, 2));
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
  const client = getDbClient();

  try {
    // Validate request body
    // // console.log("🔍 UPDATE PROFILE: Raw body before validation:", JSON.stringify(req.body, null, 2));
    const validatedData = recruiterUpdateProfileSchema.parse(req.body);
    // console.log("🔍 UPDATE PROFILE: Validation passed");
    // console.log("🔍 UPDATE PROFILE: Validated data:", JSON.stringify(validatedData, null, 2));

    await client.connect();
    await client.query('BEGIN');

    // Get current recruiter data
    const currentQuery = `
      SELECT 
        u.*,
        r.job_title, r.phone, r.linkedin_url, r.bio,
        r.email_notifications, r.candidate_updates, r.interview_reminders
      FROM users u
      LEFT JOIN recruiter_profiles r ON u.id = r.user_id
      WHERE u.id = $1
    `;
    const currentResult = await client.query(currentQuery, [userId]);

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "Recruiter not found",
      });
    }

    const currentData = currentResult.rows[0];

    // Update user table if name fields or avatar are provided
    if (validatedData.firstName || validatedData.lastName || validatedData.avatar) {
      console.log('🔍 Updating user with avatar:', validatedData.avatar ? 'Avatar data present' : 'No avatar');
      const updateUserQuery = `
        UPDATE users 
        SET first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            avatar = COALESCE($3, avatar),
            updated_at = NOW()
        WHERE id = $4
      `;
      const updateResult = await client.query(updateUserQuery, [
        validatedData.firstName,
        validatedData.lastName,
        validatedData.avatar,
        userId
      ]);
      console.log('✅ User update result - rows affected:', updateResult.rowCount);
    }

    // Update recruiter_profiles table if recruiter or company fields are provided
    const recruiterUpdates = [];
    const recruiterValues = [];
    let paramIndex = 1;
    
    if (validatedData.jobTitle) {
      recruiterUpdates.push(`job_title = $${paramIndex++}`);
      recruiterValues.push(validatedData.jobTitle);
    }
    
    if (validatedData.phone) {
      recruiterUpdates.push(`phone = $${paramIndex++}`);
      recruiterValues.push(validatedData.phone);
    }
    
    if (validatedData.linkedinUrl) {
      recruiterUpdates.push(`linkedin_url = $${paramIndex++}`);
      recruiterValues.push(validatedData.linkedinUrl);
    }
    
    if (validatedData.emailNotifications !== undefined) {
      recruiterUpdates.push(`email_notifications = $${paramIndex++}`);
      recruiterValues.push(validatedData.emailNotifications);
    }
    
    if (validatedData.candidateUpdates !== undefined) {
      recruiterUpdates.push(`candidate_updates = $${paramIndex++}`);
      recruiterValues.push(validatedData.candidateUpdates);
    }
    
    if (validatedData.interviewReminders !== undefined) {
      recruiterUpdates.push(`interview_reminders = $${paramIndex++}`);
      recruiterValues.push(validatedData.interviewReminders);
    }
    
    if (recruiterUpdates.length > 0) {
      recruiterUpdates.push(`updated_at = NOW()`);
      recruiterValues.push(userId);
      
      const updateRecruiterQuery = `
        UPDATE recruiter_profiles 
        SET ${recruiterUpdates.join(', ')}
        WHERE user_id = $${paramIndex}
      `;

      const updateResult = await client.query(updateRecruiterQuery, recruiterValues);
      console.log('✅ Rows affected:', updateResult.rowCount);
      
      // if (updateResult.rowCount === 0) {
      //   console.log('⚠️ No rows updated! Creating recruiter_profiles record...');
      //   await client.query(
      //     'INSERT INTO recruiter_profiles (user_id, job_title, phone, linkedin_url) VALUES ($1, $2, $3, $4)',
      //     [userId, validatedData.jobTitle || null, validatedData.phone || null, validatedData.linkedinUrl || null]
      //   );
      //   console.log('✅ Created recruiter_profiles record');
      // }
    }

    await client.query('COMMIT');

    // Get updated recruiter data
    const updatedResult = await client.query(currentQuery, [userId]);
    const updatedData = updatedResult.rows[0];
    console.log('🔍 Updated data from DB - avatar:', updatedData.avatar ? 'Present' : 'Not present');
    
    // Create simplified recruiter object from available data
    const recruiter = {
      id: updatedData.id,
      email: updatedData.email,
      firstName: updatedData.first_name,
      lastName: updatedData.last_name,
      avatar: updatedData.avatar,
      jobTitle: updatedData.job_title,
      phone: updatedData.phone,
      linkedinUrl: updatedData.linkedin_url,
      emailNotifications: updatedData.email_notifications,
      candidateUpdates: updatedData.candidate_updates,
      interviewReminders: updatedData.interview_reminders
    };
    res.json({
      success: true,
      message: "Profile updated successfully",
      recruiter,
    });

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error("❌ Update profile error:", error);

    // Handle Zod validation errors
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
      message: "Failed to update profile",
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

// Get constants for form dropdowns
router.get("/constants", (req: Request, res: Response) => {
  res.json({
    companySizeRanges: COMPANY_SIZE_RANGES,
    industries: INDUSTRIES,
    jobTitles: JOB_TITLES,
  });
});

export default router;