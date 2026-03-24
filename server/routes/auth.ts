import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from 'bcryptjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from "../../shared/auth";
import { getDatabase, closeDatabase } from '../database/connection';
import { emailService } from '../services/emailService.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z
  .object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const passwordResetSchema = z.object({
  email: z.string().email(),
});

const passwordResetConfirmSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatar: z.string().url().optional(),
  profile: z
    .object({
      bio: z.string().max(500).optional(),
      location: z.string().max(100).optional(),
      website: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
    })
    .optional(),
});

// Use shared authentication store
import { authSessions, getUserFromToken, generateToken } from '../lib/authStore.js';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token instead of simple token
const generateJWTToken = (userId: string, email: string): string => {
  return jwt.sign(
    { 
      id: userId,        // For unified auth middleware compatibility
      userId: userId,    // For interview routes compatibility
      email 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// For backward compatibility, export the shared stores
export const users = new Map(); // No longer used, kept for compatibility
export const sessions = authSessions;

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateResetToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// getUserFromToken is imported from authStore

// Use unified auth middleware instead of local requireAuth
const requireAuth = unifiedAuth.requireAuth;

// Routes

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    console.log('🔍 Auth register - Request body:', req.body);
    const validatedData = registerSchema.parse(req.body);
    console.log('✅ Auth register - Validation passed');
    const db = await getDatabase();
    console.log('✅ Auth register - Database connection obtained');
    
    // Check if user already exists using PostgreSQL syntax
    console.log('🔍 Auth register - Checking existing user for:', validatedData.email);
    const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [validatedData.email]);
    if (existingUserResult.rows.length > 0) {
      console.log('❌ Auth register - User already exists');
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
    
    console.log('🔍 Auth register - Hashing password...');
    const hashedPassword = await hashPassword(validatedData.password);
    console.log('✅ Auth register - Password hashed');
    
    const firstName = validatedData.firstName;
    const lastName = validatedData.lastName;
    const fullName = `${firstName} ${lastName}`;
    
    // Insert new user using PostgreSQL syntax
    const insertResult = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, user_type, created_at, updated_at, email_verified, is_active) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true, true) RETURNING id',
      [validatedData.email, hashedPassword, firstName, lastName, 'job_seeker']
    );
    
    const userId = insertResult.rows[0].id.toString();
    
    // Create free subscription for new user
    try {
      const { SubscriptionService } = await import('../services/subscriptionService');
      await SubscriptionService.createFreeUserSubscription(userId);
      console.log('✅ Free subscription created for user:', userId);
    } catch (subError) {
      console.error('⚠️ Failed to create free subscription:', subError);
      // Don't fail registration if subscription creation fails
    }
    
    // Create JWT token
    const token = generateJWTToken(userId, validatedData.email);
    
    const user: User = {
      id: userId,
      email: validatedData.email,
      name: fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
    };
    
    res.json({
      success: true,
      user,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: fieldErrors,
      });
    }
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  let db;
  let shouldCloseConnection = false;
  
  try {
    const validatedData = loginSchema.parse(req.body);
    db = await getDatabase();
    
    // In serverless environments, we need to close the connection
    if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      shouldCloseConnection = true;
    }
    
    // Get user using PostgreSQL syntax
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [validatedData.email]);
    const userRow = userResult.rows[0];
    
    if (!userRow || !(await verifyPassword(validatedData.password, userRow.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    
    // IMPORTANT: Verify user type - job seekers only on this endpoint
    if (userRow.user_type === 'recruiter') {
      return res.status(403).json({
        success: false,
        message: "This is the job seeker login. Please use the recruiter login page to access your recruiter account.",
        redirectTo: "/recruiter/login"
      });
    }
    
    // Create JWT token
    const token = generateJWTToken(userRow.id.toString(), userRow.email);
    
    const user: User = {
      id: userRow.id.toString(),
      email: userRow.email,
      name: `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim() || userRow.email,
      avatar: userRow.avatar || userRow.avatar_url,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
      emailVerified: !!userRow.email_verified,
      profile: {
        bio: userRow.bio,
        location: userRow.location,
        website: userRow.portfolio_url,
        linkedin: userRow.linkedin_url,
        github: userRow.github_url,
      },
    };
    
    res.json({
      success: true,
      user,
      token,
      message: "Login successful",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (shouldCloseConnection && db) {
      await closeDatabase(db);
    }
  }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (token) {
    authSessions.delete(token);
  }

  res.json({
    success: true,
    message: "Logout successful",
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: (req as any).user,
  });
});

// POST /api/auth/refresh
router.post("/refresh", requireAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const oldToken = authHeader?.split(" ")[1];

  if (oldToken) {
    authSessions.delete(oldToken);
  }

  // Create new session
  const newToken = generateToken();
  authSessions.set(newToken, {
    userId: ((req as any).user as User).id,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
  });

  res.json({
    success: true,
    token: newToken,
    user: (req as any).user,
    message: "Token refreshed successfully",
  });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const validatedData = passwordResetSchema.parse(req.body);

    const user = users.get(validatedData.email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message:
          "If an account with that email exists, we have sent a password reset link",
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;

    // In production, send actual email here
    console.log(
      `Password reset token for ${validatedData.email}: ${resetToken}`,
    );

    res.json({
      success: true,
      message:
        "If an account with that email exists, we have sent a password reset link",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const validatedData = passwordResetConfirmSchema.parse(req.body);

    // Find user with matching reset token
    const user = Array.from(users.values()).find(
      (u) =>
        u.resetToken === validatedData.token &&
        u.resetTokenExpiry &&
        u.resetTokenExpiry > new Date(),
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = hashPassword(validatedData.password);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.updatedAt = new Date().toISOString();

    // Invalidate all existing sessions for this user
    for (const [token, session] of authSessions.entries()) {
      if (session.userId === user.id) {
        authSessions.delete(token);
      }
    }

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/auth/change-password
router.post(
  "/change-password",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const validatedData = changePasswordSchema.parse(req.body);
      const currentUser = (req as any).user as User;

      const user = users.get(currentUser.email);
      if (
        !user ||
        !verifyPassword(validatedData.currentPassword, user.password)
      ) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      user.password = hashPassword(validatedData.newPassword);
      user.updatedAt = new Date().toISOString();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
        });
      }

      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// PUT /api/auth/profile
router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const currentUser = (req as any).user as User;

    const user = users.get(currentUser.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user profile
    if (validatedData.name) user.name = validatedData.name;
    if (validatedData.avatar) user.avatar = validatedData.avatar;
    if (validatedData.profile) {
      user.profile = { ...user.profile, ...validatedData.profile };
    }
    user.updatedAt = new Date().toISOString();

    const { password, resetToken, resetTokenExpiry, ...userResponse } = user;

    res.json({
      success: true,
      user: userResponse,
      message: "Profile updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// POST /api/auth/resend-verification
router.post(
  "/resend-verification",
  requireAuth,
  (req: Request, res: Response) => {
    const currentUser = (req as any).user as User;

    if (currentUser.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // In production, send actual verification email here
    console.log(`Verification email sent to ${currentUser.email}`);

    res.json({
      success: true,
      message: "Verification email sent",
    });
  },
);

// POST /api/auth/verify-email
router.post("/verify-email", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required",
    });
  }

  // In production, verify the actual token
  // For demo purposes, we'll just return success
  res.json({
    success: true,
    message: "Email verified successfully",
  });
});

// POST /api/auth/quick-signup - Quick signup with resume upload
router.post("/quick-signup", async (req: Request, res: Response) => {
  let db;
  let shouldCloseConnection = false;
  
  try {
    const multer = await import('multer');
    const upload = multer.default({ 
      storage: multer.default.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
    });
    
    // Handle file upload
    await new Promise((resolve, reject) => {
      upload.single('resume')(req, res, (err: any) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    const { fullName, email } = req.body;
    const resumeFile = (req as any).file;

    console.log('📝 Quick signup request:', { fullName, email, hasFile: !!resumeFile });

    if (!fullName || !email || !resumeFile) {
      return res.status(400).json({
        success: false,
        error: "Full name, email, and resume are required",
      });
    }

    db = await getDatabase();
    
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Service temporarily unavailable. Please try again in a few moments.",
      });
    }
    
    // In serverless environments, we need to close the connection
    if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      shouldCloseConnection = true;
    }
    
    // Check if user already exists
    const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists. Please login instead.",
      });
    }
    
    // Generate random password (16 characters, alphanumeric) - temporary for auto-login
    const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = await hashPassword(generatedPassword);
    
    // Generate secure password setup token (expires in 24 hours)
    const setupToken = generateResetToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Split name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    console.log('👤 Creating user:', { firstName, lastName, email });
    
    // Insert new user with setup token
    const insertResult = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, user_type, created_at, updated_at, email_verified, is_active, reset_token, reset_token_expires) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true, true, $6, $7) RETURNING id',
      [email.toLowerCase(), hashedPassword, firstName, lastName, 'job_seeker', setupToken, tokenExpiry]
    );
    
    const userId = insertResult.rows[0].id.toString();
    console.log('✅ User created with ID:', userId);
    
    // Parse and store resume
    let resumeId = null;
    let parsedData = null;
    try {
      console.log('📄 Parsing resume...');
      const { resumeParsingService } = await import('../services/resumeParsingService.js');
      
      // Extract text from resume buffer
      const resumeText = await resumeParsingService.extractTextFromBuffer(
        resumeFile.buffer,
        resumeFile.mimetype
      );
      
      // Parse resume with AI
      parsedData = await resumeParsingService.parseResumeWithAI(resumeText, {
        fullName: fullName,
        email: email.toLowerCase(),
        phone: req.body.phone,
        location: req.body.location,
        linkedin: req.body.linkedin,
        github: req.body.github,
        website: req.body.website
      });
      
      console.log('✅ Resume parsed with user-provided personal info:', {
        fullName: parsedData?.personalInfo?.fullName,
        email: parsedData?.personalInfo?.email,
        phone: parsedData?.personalInfo?.phone,
        location: parsedData?.personalInfo?.location
      });
      
      // Store resume in database
      const { resumeStorageService } = await import('../services/resumeStorageService.js');
      const storeResult = await resumeStorageService.storeResumeData(userId, parsedData);
      
      if (storeResult.success && storeResult.resumeId) {
        resumeId = storeResult.resumeId.toString();
        console.log('✅ Resume parsed and stored with ID:', resumeId);
        
        // Generate shareToken automatically using slug
        const { getDatabase } = await import('../database/connection.js');
        const db = await getDatabase();
        const fullName = parsedData.personalInfo.fullName || parsedData.personalInfo.name || 'resume';
        
        // Generate unique slug for shareToken using proper slug generator
        const { generateUniqueSlug } = await import('../lib/slugGenerator.js');
        const shareToken = await generateUniqueSlug(db, fullName);
        
        // Create resume share entry
        await db.query(`
          INSERT INTO resume_shares (resume_id, user_id, share_token, is_active, expires_at)
          VALUES ($1, $2, $3, true, NULL)
        `, [storeResult.resumeId, userId, shareToken]);

        console.log('✅ ShareToken created:', shareToken, 'for resume:', resumeId);
      }
    } catch (parseError) {
      console.error('❌ Resume parsing error during quick signup:', parseError);
      // Continue even if parsing fails - user can upload later
    }
    
    // Create JWT token
    const token = generateJWTToken(userId, email.toLowerCase());
    
    const user: User = {
      id: userId,
      email: email.toLowerCase(),
      name: fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
    };
    
    // Send welcome email with password setup link
    try {
      console.log('📧 Sending welcome email with setup link...');
      const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/setup-password?token=${setupToken}`;
      const resumeUrl = resumeId 
        ? `${process.env.FRONTEND_URL || 'http://localhost:8080'}/resume/${resumeId}`
        : `${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard`;
      
      await emailService.sendPasswordSetupEmail(email.toLowerCase(), fullName, setupUrl, resumeUrl);
      console.log('✅ Welcome email with setup link sent');
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Continue even if email fails - user can still login with temp password
    }
    
    console.log('🎉 Quick signup completed successfully');
    
    res.json({
      success: true,
      user,
      token,
      userId,
      resumeId,
      parsedData,
      message: "Account created successfully. Check your email to set up your password.",
    });
  } catch (error: any) {
    console.error("❌ Quick signup error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create account. Please try again.",
    });
  } finally {
    if (shouldCloseConnection && db) {
      await closeDatabase(db);
    }
  }
});

// GET /api/auth/verify-setup-token - Verify password setup token
router.get("/verify-setup-token", async (req: Request, res: Response) => {
  let db;
  let shouldCloseConnection = false;
  
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Setup token is required",
      });
    }

    db = await getDatabase();
    
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Service temporarily unavailable. Please try again in a few moments.",
      });
    }
    
    // In serverless environments, we need to close the connection
    if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      shouldCloseConnection = true;
    }
    
    // Check if token exists and is not expired
    const result = await db.query(
      'SELECT id, email, first_name, last_name FROM users WHERE reset_token = $1 AND reset_token_expires > NOW() AND is_active = true',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired setup token",
      });
    }
    
    res.json({
      success: true,
      message: "Setup token is valid",
    });
  } catch (error: any) {
    console.error("❌ Verify setup token error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify setup token",
    });
  } finally {
    if (shouldCloseConnection && db) {
      await closeDatabase(db);
    }
  }
});

// POST /api/auth/setup-password - Set up password with token
router.post("/setup-password", async (req: Request, res: Response) => {
  let db;
  let shouldCloseConnection = false;
  
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: "Setup token and password are required",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    db = await getDatabase();
    
    if (!db) {
      return res.status(503).json({
        success: false,
        error: "Service temporarily unavailable. Please try again in a few moments.",
      });
    }
    
    // In serverless environments, we need to close the connection
    if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      shouldCloseConnection = true;
    }
    
    // Find user with valid token
    const userResult = await db.query(
      'SELECT id, email, first_name, last_name FROM users WHERE reset_token = $1 AND reset_token_expires > NOW() AND is_active = true',
      [token]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired setup token",
      });
    }
    
    const user = userResult.rows[0];
    const hashedPassword = await hashPassword(password);
    
    // Update user password and clear setup token
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    // Generate JWT token for auto-login
    const jwtToken = generateJWTToken(user.id.toString(), user.email);
    
    const userResponse: User = {
      id: user.id.toString(),
      email: user.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
    };
    
    console.log('✅ Password setup completed for user:', user.email);
    
    res.json({
      success: true,
      message: "Password set up successfully",
      user: userResponse,
      token: jwtToken,
      userId: user.id.toString(),
    });
  } catch (error: any) {
    console.error("❌ Setup password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to set up password",
    });
  } finally {
    if (shouldCloseConnection && db) {
      await closeDatabase(db);
    }
  }
});

export default router;
