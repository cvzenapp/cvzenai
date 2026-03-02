import { Router, Request, Response } from "express";
import { z } from "zod";
import { TempAuthService, createTempTables, getPostgresClient } from "../services/postgresService.js";
import {
  RecruiterAuthResponse,
  RecruiterLoginRequest,
  RecruiterRegisterRequest,
  RecruiterPasswordResetRequest,
  RecruiterPasswordResetConfirm,
  RecruiterUpdateProfileRequest,
  Recruiter,
  COMPANY_SIZE_RANGES,
  INDUSTRIES,
  JOB_TITLES,
} from "../../shared/recruiterAuth";

const router = Router();

// Note: Tables should be created by running setup-temp-tables.js first

// Validation schemas
const recruiterLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

const recruiterRegisterSchema = z
  .object({
    // Personal Information
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z.string(),
    jobTitle: z.string().min(2, "Job title is required"),
    phone: z.string().optional(),
    linkedinUrl: z.string().url().optional().or(z.literal("")),

    // Company Information
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(255, "Company name must be less than 255 characters"),
    companyWebsite: z.string().url().optional().or(z.literal("")),
    companyIndustry: z.enum(INDUSTRIES).optional(),
    companySizeRange: z.enum(COMPANY_SIZE_RANGES),
    companyLocation: z
      .string()
      .min(2, "Company location is required")
      .max(255, "Company location must be less than 255 characters"),
    companyDescription: z.string().max(1000).optional(),

    // Agreement
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
    acceptPrivacyPolicy: z.boolean().refine((val) => val === true, {
      message: "You must accept the privacy policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Helper function to create recruiter object
function createRecruiterFromData(user: any, profile: any, company: any): Recruiter {
  return {
    id: user.id.toString(),
    email: user.email || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    jobTitle: profile?.job_title || "",
    avatar: "",
    phone: profile?.phone || "",
    linkedinUrl: profile?.linkedin_url || "",
    createdAt: user.created_at || "",
    updatedAt: user.created_at || "",
    emailVerified: true, // Simplified for now
    isActive: true,
    company: company
      ? {
          id: company.id.toString(),
          name: company.name || "",
          slug: company.slug || "",
          logoUrl: "",
          website: company.website || "",
          industry: company.industry || "",
          sizeRange: company.size_range || "",
          location: company.location || "",
          description: company.description || "",
        }
      : {
          id: "",
          name: "Unknown Company",
          slug: "",
          logoUrl: "",
          website: "",
          industry: "",
          sizeRange: "",
          location: "",
          description: "",
        },
  };
}

// Recruiter Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = recruiterLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    console.log("🔍 LOGIN: Attempting login for recruiter:", email.toLowerCase());

    // Authenticate using temporary auth service
    const { data: authData, error: authError } = await TempAuthService.signInWithPassword(
      email.toLowerCase(),
      password
    );

    if (authError || !authData?.user) {
      console.log("❌ AUTH ERROR:", authError?.message);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errors: { email: "Invalid credentials" },
      });
    }

    // Get recruiter profile and company data
    const client = getPostgresClient();
    
    const profileQuery = `
      SELECT rp.*, c.* 
      FROM recruiter_profiles rp
      LEFT JOIN companies c ON rp.company_id = c.id
      WHERE rp.user_id = $1
    `;
    
    const profileResult = await client.query(profileQuery, [authData.user.id]);
    const profileData = profileResult.rows[0];

    if (!profileData) {
      return res.status(401).json({
        success: false,
        message: "Recruiter profile not found",
        errors: { email: "No recruiter account found with this email" },
      });
    }

    // Create recruiter object
    const recruiter = createRecruiterFromData(authData.user, profileData, profileData);

    const response: RecruiterAuthResponse = {
      success: true,
      recruiter,
      token: authData.session?.access_token || '',
      message: "Login successful",
    };

    console.log("✅ LOGIN SUCCESS for recruiter:", email);
    res.json(response);
  } catch (error) {
    console.error("Recruiter login error:", error);

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
  }
});

// Recruiter Registration
router.post("/register", async (req: Request, res: Response) => {
  try {
    const validatedData = recruiterRegisterSchema.parse(req.body);

    console.log("🔍 REGISTER: Attempting registration for:", validatedData.email.toLowerCase());

    const client = getPostgresClient();

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

    // Create or find company
    const companySlug = validatedData.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let company;
    const existingCompanyQuery = `SELECT * FROM companies WHERE slug = $1`;
    const existingCompanyResult = await client.query(existingCompanyQuery, [companySlug]);

    if (existingCompanyResult.rows.length > 0) {
      company = existingCompanyResult.rows[0];
    } else {
      // Create new company
      const insertCompanyQuery = `
        INSERT INTO companies (name, slug, website, industry, size_range, location, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const companyResult = await client.query(insertCompanyQuery, [
        validatedData.companyName,
        companySlug,
        validatedData.companyWebsite || null,
        validatedData.companyIndustry || null,
        validatedData.companySizeRange,
        validatedData.companyLocation,
        validatedData.companyDescription || null,
      ]);

      company = companyResult.rows[0];
    }

    // Create user
    const authUser = await TempAuthService.createUser(
      validatedData.email.toLowerCase(),
      validatedData.password,
      {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        user_type: 'recruiter'
      }
    );

    if (!authUser.user) {
      throw new Error('Failed to create user account');
    }

    // Create recruiter profile
    const insertProfileQuery = `
      INSERT INTO recruiter_profiles (user_id, company_id, job_title, phone, linkedin_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const profileResult = await client.query(insertProfileQuery, [
      authUser.user.id,
      company.id,
      validatedData.jobTitle,
      validatedData.phone || null,
      validatedData.linkedinUrl || null,
    ]);

    const profile = profileResult.rows[0];

    // Generate session token for immediate login
    const { data: sessionData, error: sessionError } = await TempAuthService.signInWithPassword(
      validatedData.email.toLowerCase(),
      validatedData.password
    );

    if (sessionError || !sessionData?.session) {
      console.error('Session creation error:', sessionError);
      return res.status(201).json({
        success: true,
        message: "Registration successful! Please log in to continue.",
        requiresLogin: true
      });
    }

    // Create recruiter object
    const recruiter = createRecruiterFromData(authUser.user, profile, company);

    const response: RecruiterAuthResponse = {
      success: true,
      recruiter,
      token: sessionData.session.access_token,
      message: "Registration successful! Welcome to the platform.",
    };

    console.log("✅ REGISTRATION SUCCESS for recruiter:", validatedData.email);
    res.status(201).json(response);
  } catch (error) {
    console.error("Recruiter registration error:", error);

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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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