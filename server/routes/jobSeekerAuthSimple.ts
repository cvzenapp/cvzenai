import { Router, Request, Response } from "express";
import { z } from "zod";
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { emailService } from "../services/emailService";

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
  // Generate unique JWT ID for token blacklist support
  const jti = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return jwt.sign(
    { 
      id: userId,  // Changed from userId to id to match unifiedAuth expectations
      email,
      type: 'jobseeker',
      jti // JWT ID for blacklist tracking
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
const jobSeekerRegisterSchema = z
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

const jobSeekerLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

// Helper function to create user object
function createUserFromData(user: any, profile: any = null) {
  return {
    id: user.id.toString(),
    email: user.email || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    phone: profile?.phone || user.phone || "",
    linkedinUrl: profile?.linkedin_url || "",
    githubUrl: profile?.github_url || "",
    portfolioUrl: profile?.portfolio_url || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    avatar: profile?.avatar_url || "",
    createdAt: user.created_at || "",
    updatedAt: user.updated_at || user.created_at || "",
    emailVerified: true, // Simplified for now
    isActive: true,
  };
}

// Job Seeker Registration
router.post("/register", async (req: Request, res: Response) => {
  const client = getDbClient();

  try {
    await client.connect();
    console.log("🔍 JOB SEEKER REGISTER: Connected to database");

    const validatedData = jobSeekerRegisterSchema.parse(req.body);
    console.log("🔍 JOB SEEKER REGISTER: Validation passed for:", validatedData.email.toLowerCase());

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

    console.log("🔍 JOB SEEKER REGISTER: Email is available");

    // Create user
    console.log("🔍 JOB SEEKER REGISTER: Creating user account");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

    const insertUserQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const userResult = await client.query(insertUserQuery, [
      validatedData.email.toLowerCase(),
      hashedPassword,
      validatedData.firstName,
      validatedData.lastName
    ]);

    const user = userResult.rows[0];
    console.log("🔍 JOB SEEKER REGISTER: User created with ID:", user.id);

    // Create user object
    const userObj = createUserFromData(user);

    // Generate JWT token
    const token = generateToken(user.id.toString(), user.email);

    const response = {
      success: true,
      user: userObj,
      token,
      message: "Registration successful! Welcome to CVZen.",
    };

    console.log("✅ JOB SEEKER REGISTRATION SUCCESS:", validatedData.email);
    
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
    console.error("❌ Job seeker registration error:", error);

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
      stack: error instanceof Error ? error.stack : undefined,
      details: "Check server logs for more information"
    });
  } finally {
    await client.end();
  }
});

// Job Seeker Login
router.post("/login", async (req: Request, res: Response) => {
  const client = getDbClient();

  try {
    await client.connect();

    const validatedData = jobSeekerLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    console.log("🔍 JOB SEEKER LOGIN: Attempting login for:", email.toLowerCase());

    // Get user data first
    const loginQuery = `
      SELECT *
      FROM users
      WHERE email = $1
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

    // Create user object
    const user = createUserFromData(userData);

    const token = generateToken(userData.id.toString(), userData.email);

    const response = {
      success: true,
      user,
      token,
      message: "Login successful",
    };

    console.log("✅ JOB SEEKER LOGIN SUCCESS:", email);
    res.json(response);

  } catch (error) {
    console.error("❌ Job seeker login error:", error);

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

// Get current user (for /me endpoint)
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

  const userId = decoded.id;
  const client = getDbClient();

  try {
    await client.connect();

    const userQuery = `SELECT * FROM users WHERE id = $1`;
    const result = await client.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = createUserFromData(result.rows[0]);

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("❌ Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  } finally {
    await client.end();
  }
});

// Get current user profile
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

  const userId = decoded.id;
  const client = getDbClient();

  try {
    await client.connect();

    const userQuery = `SELECT * FROM users WHERE id = $1`;
    const result = await client.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = createUserFromData(result.rows[0]);

    res.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("❌ Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
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

  const userId = decoded.id;

  const client = getDbClient();

  try {
    await client.connect();

    const userQuery = `SELECT * FROM users WHERE id = $1`;
    const result = await client.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = createUserFromData(result.rows[0]);
    const newToken = generateToken(userId, result.rows[0].email);

    res.json({
      success: true,
      token: newToken,
      user,
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

// Job Seeker Logout
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // For now, just return success since we're using simple tokens
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

// Password Reset Request (placeholder)
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Always return success for security (don't reveal if email exists)
    res.json({
      success: true,
      message: "If an account with this email exists, you will receive password reset instructions.",
    });

    console.log(`Password reset requested for job seeker: ${email}`);
  } catch (error) {
    console.error("Job seeker password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
});

export default router;