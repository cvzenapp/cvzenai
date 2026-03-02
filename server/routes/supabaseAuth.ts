import { Router, Request, Response } from "express";
import { z } from "zod";
import { 
  SupabaseAuthService, 
  UserProfileService, 
  SupabaseUtils,
  supabase 
} from "../services/supabaseService.js";
import { requireAuth, requireJobSeeker } from "../middleware/supabaseAuth.js";

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
    lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Helper function to create user object from profile
function createUserFromProfile(authUser: any, userProfile: any) {
  return {
    id: authUser.id,
    email: authUser.email || "",
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "",
    phone: userProfile?.phone || "",
    linkedinUrl: userProfile?.linkedin_url || "",
    githubUrl: userProfile?.github_url || "",
    portfolioUrl: userProfile?.portfolio_url || "",
    location: userProfile?.location || "",
    bio: userProfile?.bio || "",
    avatar: userProfile?.avatar_url || "",
    createdAt: userProfile?.created_at || authUser.created_at || "",
    updatedAt: userProfile?.updated_at || authUser.updated_at || "",
    emailVerified: Boolean(authUser.email_confirmed_at),
    isActive: userProfile?.is_active !== false,
  };
}

// Job Seeker Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password, rememberMe } = validatedData;

    console.log("🔍 LOGIN: Attempting login for job seeker:", email.toLowerCase());

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

    // Get user profile
    const userProfile = await UserProfileService.getProfile(authData.user.id);
    
    // Create user object
    const user = createUserFromProfile(authData.user, userProfile);

    const response = {
      success: true,
      user,
      token: authData.session?.access_token || '',
      message: "Login successful",
    };

    console.log("✅ LOGIN SUCCESS for job seeker:", email);
    res.json(response);
  } catch (error) {
    console.error("Job seeker login error:", error);

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

// Job Seeker Registration
router.post("/register", async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

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

    // Create user in Supabase Auth
    const authUser = await SupabaseAuthService.createUser(
      validatedData.email.toLowerCase(),
      validatedData.password,
      {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        user_type: 'job_seeker'
      }
    );

    if (!authUser.user) {
      throw new Error('Failed to create user account');
    }

    // Create user profile
    const userProfile = await UserProfileService.createProfile(
      authUser.user.id,
      {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone || undefined,
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
        requiresLogin: true
      });
    }

    // Create user object
    const user = createUserFromProfile(authUser.user, userProfile);

    const response = {
      success: true,
      user,
      token: sessionData.session.access_token,
      message: "Registration successful! Welcome to CVZen.",
    };

    console.log("✅ REGISTRATION SUCCESS for job seeker:", validatedData.email);
    res.status(201).json(response);
  } catch (error) {
    console.error("Job seeker registration error:", error);

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

// Get current user profile
router.get("/profile", requireAuth, requireJobSeeker, async (req: Request, res: Response) => {
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

    // Get user profile
    const userProfile = await UserProfileService.getProfile(req.user.id);
    
    const user = createUserFromProfile(authUser.user, userProfile);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

// Update user profile
router.put("/profile", requireAuth, requireJobSeeker, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const updates = req.body;
    
    // Update user profile
    const updatedProfile = await UserProfileService.updateProfile(req.user.id, updates);
    
    // Get the authenticated user from Supabase
    const authUser = await SupabaseAuthService.getUserById(req.user.id);
    
    const user = createUserFromProfile(authUser.user, updatedProfile);

    res.json({
      success: true,
      user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// Job Seeker Logout
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
    console.error("Job seeker logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// Password Reset Request
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const validatedData = passwordResetSchema.parse(req.body);
    const { email } = validatedData;

    // Send password reset email via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password`
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
    console.error("Job seeker password reset error:", error);

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

export default router;