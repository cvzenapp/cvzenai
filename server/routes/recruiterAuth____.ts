import { Router, Request, Response } from "express";
import { z } from "zod";
import { 
  SupabaseAuthService, 
  RecruiterProfileService, 
  CompanyService, 
  SupabaseUtils,
  supabase 
} from "../services/supabaseService.js";
import { requireAuth, requireRecruiter } from "../middleware/supabaseAuth.js";
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

const recruiterPasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const recruiterPasswordResetConfirmSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Helper functions
function createRecruiterFromProfile(authUser: any, recruiterProfile: any): Recruiter {
  return {
    id: authUser.id,
    email: authUser.email || "",
    firstName: recruiterProfile.first_name || "",
    lastName: recruiterProfile.last_name || "",
    jobTitle: recruiterProfile.job_title || "",
    avatar: recruiterProfile.avatar_url || "",
    phone: recruiterProfile.phone || "",
    linkedinUrl: recruiterProfile.linkedin_url || "",
    createdAt: recruiterProfile.created_at || "",
    updatedAt: recruiterProfile.updated_at || "",
    emailVerified: Boolean(authUser.email_confirmed_at),
    isActive: Boolean(recruiterProfile.is_active),
    company: recruiterProfile.company
      ? {
          id: recruiterProfile.company.id,
          name: recruiterProfile.company.name || "",
          slug: recruiterProfile.company.slug || "",
          logoUrl: recruiterProfile.company.logo_url || "",
          website: recruiterProfile.company.website || "",
          industry: recruiterProfile.company.industry || "",
          sizeRange: recruiterProfile.company.size_range || "",
          location: recruiterProfile.company.location || "",
          description: recruiterProfile.company.description || "",
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

// Routes

// Recruiter Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = recruiterLoginSchema.parse(req.body);
    const { email, password, rememberMe } = validatedData;

    console.log("🔍 SEARCH: Attempting login for recruiter:", email.toLowerCase());

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    });

    if (authError || !authData.user) {
      console.log("❌ AUTH ERROR:", authError?.message);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errors: { email: "Invalid credentials" },
      });
    }

    // Get recruiter profile
    const recruiterProfile = await RecruiterProfileService.getProfile(authData.user.id);
    
    if (!recruiterProfile) {
      return res.status(401).json({
        success: false,
        message: "Recruiter profile not found",
        errors: { email: "No recruiter account found with this email" },
      });
    }

    if (!recruiterProfile.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
        errors: { email: "Your account has been deactivated" },
      });
    }

    // Create recruiter object
    const recruiter = createRecruiterFromProfile(authData.user, recruiterProfile);

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

    // Check if email is already taken
    const emailTaken = await SupabaseUtils.isEmailTaken(validatedData.email.toLowerCase());
    if (emailTaken) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
        errors: { email: "An account with this email already exists" },
      });
    }

    // Create or find company
    const companySlug = CompanyService.generateSlug(validatedData.companyName);
    let company = await CompanyService.getCompanyBySlug(companySlug);

    if (!company) {
      // Create new company
      company = await CompanyService.createCompany({
        name: validatedData.companyName,
        slug: companySlug,
        website: validatedData.companyWebsite || undefined,
        industry: validatedData.companyIndustry || undefined,
        size_range: validatedData.companySizeRange,
        location: validatedData.companyLocation,
        description: validatedData.companyDescription || undefined,
        is_verified: false
      });
    }

    // Create user in Supabase Auth
    const authUser = await SupabaseAuthService.createUser(
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
    const recruiterProfile = await RecruiterProfileService.createProfile(
      authUser.user.id,
      company.id,
      {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        job_title: validatedData.jobTitle,
        phone: validatedData.phone || undefined,
        linkedin_url: validatedData.linkedinUrl || undefined,
        is_active: true
      }
    );

    // Generate session token for immediate login
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: validatedData.email.toLowerCase(),
      password: validatedData.password
    });

    if (sessionError || !sessionData.session) {
      console.error('Session creation error:', sessionError);
      // User was created but login failed - they can login manually
      return res.status(201).json({
        success: true,
        message: "Registration successful! Please log in to continue.",
        requiresLogin: true,
        email: validatedData.email.toLowerCase() // Include email for frontend to pre-populate login form
      });
    }

    // Create recruiter object
    const recruiter = createRecruiterFromProfile(authUser.user, recruiterProfile);

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

// Get current recruiter profile
router.get("/profile", requireAuth, requireRecruiter, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get the authenticated user from Supabase
    const authUser = await SupabaseAuthService.getUserById(req.user.id);
    if (!authUser.user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get recruiter profile
    const recruiterProfile = await RecruiterProfileService.getProfile(req.user.id);
    if (!recruiterProfile) {
      return res.status(404).json({
        success: false,
        message: "Recruiter profile not found",
      });
    }

    const recruiter = createRecruiterFromProfile(authUser.user, recruiterProfile);

    res.json({
      success: true,
      recruiter,
    });
  } catch (error) {
    console.error("Get recruiter profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

// Recruiter Logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      // Sign out from Supabase (this invalidates the JWT token)
      await supabase.auth.signOut();
    }

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

// Password Reset Request
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const validatedData = recruiterPasswordResetSchema.parse(req.body);
    const { email } = validatedData;

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/recruiter/reset-password`
    });

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message:
        "If an account with this email exists, you will receive password reset instructions.",
    });

    if (error) {
      console.error("Password reset error:", error);
    } else {
      console.log(`Password reset requested for: ${email}`);
    }
  } catch (error) {
    console.error("Recruiter password reset error:", error);

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
      message: "Password reset failed",
    });
  }
});

// Company search for autocomplete
router.get("/companies/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      return res.json([]);
    }

    const companies = await CompanyService.searchCompanies(q, 10);

    const results = companies.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logo_url,
      website: company.website,
      industry: company.industry,
      location: company.location,
      verified: company.is_verified,
    }));

    res.json(results);
  } catch (error) {
    console.error("Company search error:", error);
    res.status(500).json([]);
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

// Update recruiter profile
router.put("/profile", requireRecruiter, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const updateData: RecruiterUpdateProfileRequest = req.body;

    // Get current recruiter profile
    const currentProfile = await RecruiterProfileService.getProfile(req.user.id);
    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        message: "Recruiter profile not found",
      });
    }

    // Update recruiter profile fields
    const profileUpdates: any = {};
    if (updateData.firstName !== undefined) profileUpdates.first_name = updateData.firstName;
    if (updateData.lastName !== undefined) profileUpdates.last_name = updateData.lastName;
    if (updateData.jobTitle !== undefined) profileUpdates.job_title = updateData.jobTitle;
    if (updateData.phone !== undefined) profileUpdates.phone = updateData.phone;
    if (updateData.linkedinUrl !== undefined) profileUpdates.linkedin_url = updateData.linkedinUrl;
    if (updateData.avatar !== undefined) profileUpdates.avatar_url = updateData.avatar;

    // Update recruiter profile if there are changes
    if (Object.keys(profileUpdates).length > 0) {
      await RecruiterProfileService.updateProfile(req.user.id, profileUpdates);
    }

    // Update company information if provided
    if (updateData.company && Object.keys(updateData.company).length > 0) {
      const companyUpdates: any = {};
      if (updateData.company.name !== undefined) companyUpdates.name = updateData.company.name;
      if (updateData.company.website !== undefined) companyUpdates.website = updateData.company.website;
      if (updateData.company.industry !== undefined) companyUpdates.industry = updateData.company.industry;
      if (updateData.company.sizeRange !== undefined) companyUpdates.size_range = updateData.company.sizeRange;
      if (updateData.company.location !== undefined) companyUpdates.location = updateData.company.location;
      if (updateData.company.description !== undefined) companyUpdates.description = updateData.company.description;

      if (Object.keys(companyUpdates).length > 0) {
        await CompanyService.updateCompany(currentProfile.company_id, companyUpdates);
      }
    }

    // Get updated profile data
    const updatedProfile = await RecruiterProfileService.getProfile(req.user.id);
    const authUser = await SupabaseAuthService.getUserById(req.user.id);
    
    if (!updatedProfile || !authUser.user) {
      throw new Error('Failed to fetch updated profile');
    }

    const recruiter = createRecruiterFromProfile(authUser.user, updatedProfile);

    res.json({
      success: true,
      message: "Profile updated successfully",
      recruiter,
    });
  } catch (error) {
    console.error("Update recruiter profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// Simple test endpoint to verify the route is working
router.get("/test", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Recruiter auth route is working!",
    timestamp: new Date().toISOString()
  });
});

// Note: Profile photo is now saved through the main PUT /profile endpoint
// when the user clicks "Save Changes" in the settings form.
// The avatar field is included in the RecruiterUpdateProfileRequest.

export default router;
