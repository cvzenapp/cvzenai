import { Router, Request, Response } from "express";
import { z } from "zod";
import { ReferralService } from "../services/referralService.js";
import { RewardEngine } from "../services/rewardEngine.js";
import {
  CreateReferralRequest,
  UpdateReferralRequest,
  ReferralFilters,
  ReferralStatus,
  ReferralApiResponse,
  ReferralsListApiResponse,
  ReferralStatsApiResponse,
} from "../../shared/referrals.js";
import { getDatabase } from '../database/connection.js';
import { getUserFromToken } from '../lib/authStore.js';

// Simple direct auth - no complex middleware
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    mainAuthId: string;
    userType: 'job_seeker' | 'recruiter' | 'unknown';
  };
}

const requireAuth = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  console.log('🔐 Direct Auth - Token:', token ? `${token.substring(0, 10)}...` : 'none');

  if (!token) {
    console.log('🔐 Direct Auth - No token provided');
    return res.status(401).json({ 
      success: false, 
      error: "Authentication required" 
    });
  }

  const user = getUserFromToken(token);
  console.log('🔐 Direct Auth - User found:', !!user);

  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: "Invalid token" 
    });
  }

  const db = getDatabase();
  const referralUserResult = await db.query(
    `SELECT id, email, first_name, last_name FROM users WHERE email = $1`,
    [user.email]
  );
  const referralUser = referralUserResult.rows[0];

  if (!referralUser) {
    return res.status(404).json({ 
      success: false, 
      error: "User not found in database" 
    });
  }

  console.log('🔐 Direct Auth - User found:', referralUser.id);

  (req as unknown as AuthenticatedRequest).user = {
    id: referralUser.id.toString(),
    email: referralUser.email,
    name: `${referralUser.first_name} ${referralUser.last_name}`.trim(),
    mainAuthId: user.id,
    userType: 'job_seeker' // Default to job_seeker for referral system
  };

  next();
};

const router = Router();
const referralService = new ReferralService();
const rewardEngine = new RewardEngine();

// Validation schemas
const createReferralSchema = z.object({
  refereeEmail: z.string().email("Invalid email format"),
  refereeName: z.string().min(2, "Name must be at least 2 characters").max(255, "Name too long"),
  positionTitle: z.string().min(2, "Position title must be at least 2 characters").max(255, "Position title too long"),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(255, "Company name too long"),
  personalMessage: z.string().max(1000, "Personal message too long").optional(),
  rewardAmount: z.number().min(0, "Reward amount must be positive").max(1000, "Reward amount too high").optional(),
});

const updateReferralStatusSchema = z.object({
  status: z.nativeEnum(ReferralStatus, { errorMap: () => ({ message: "Invalid status" }) }),
  notes: z.string().max(500, "Notes too long").optional(),
});

const referralFiltersSchema = z.object({
  status: z.array(z.nativeEnum(ReferralStatus)).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(255).optional(),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)).optional(),
});

// POST /api/referrals - Create a new referral
router.post("/", 
  requireAuth, 
  async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const validatedData = createReferralSchema.parse(req.body) as CreateReferralRequest;
    const userId = parseInt(authReq.user.id);

    const referral = await referralService.createReferral(userId, validatedData);

    const response: ReferralApiResponse = {
      success: true,
      data: referral
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create referral error:", error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: fieldErrors,
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/referrals - Get user's referrals with filtering and pagination
router.get("/", 
  requireAuth, 
  async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const filters = referralFiltersSchema.parse(req.query);
    const userId = parseInt(authReq.user.id);

    console.log('🔍 DEBUG: Fetching referrals for user:', userId);
    console.log('🔍 DEBUG: Filters:', filters);

    const result = referralService.getReferralsByUser(userId, filters);
    
    console.log('🔍 DEBUG: Referrals found:', result.referrals.length);
    console.log('🔍 DEBUG: Total count:', result.total);

    const response: ReferralsListApiResponse = {
      success: true,
      data: {
        referrals: result.referrals,
        total: result.total,
        hasMore: filters.limit ? (filters.offset || 0) + result.referrals.length < result.total : false
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Get referrals error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid query parameters"
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// PUT /api/referrals/:id/status - Update referral status
router.put("/:id/status", 
  requireAuth, 
  async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const referralId = parseInt(req.params.id);
    const validatedData = updateReferralStatusSchema.parse(req.body);
    const userId = parseInt(authReq.user.id);

    if (isNaN(referralId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid referral ID"
      });
    }

    // Check if referral exists and belongs to user
    const referral = referralService.getReferralById(referralId);
    if (referral.referrerId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    await referralService.updateReferralStatus(
      referralId, 
      validatedData.status, 
      userId, 
      validatedData.notes
    );

    // Get updated referral
    const updatedReferral = referralService.getReferralById(referralId);

    const response: ReferralApiResponse = {
      success: true,
      data: updatedReferral
    };

    res.json(response);
  } catch (error) {
    console.error("Update referral status error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data"
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/referrals/stats - Get user referral statistics
router.get("/stats", 
  requireAuth, 
  async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const userId = parseInt(authReq.user.id);
    const stats = referralService.getReferralStats(userId);

    const response: ReferralStatsApiResponse = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error("Get referral stats error:", error);
    
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/referrals/:id - Get specific referral details
router.get("/:id", 
  requireAuth, 
  async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const referralId = parseInt(req.params.id);
    const userId = parseInt(authReq.user.id);

    if (isNaN(referralId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid referral ID"
      });
    }

    const referral = referralService.getReferralById(referralId);
    
    // Check if referral belongs to user
    if (referral.referrerId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    const response: ReferralApiResponse = {
      success: true,
      data: referral
    };

    res.json(response);
  } catch (error) {
    console.error("Get referral error:", error);
    
    if (error instanceof Error && error.message === "Referral not found") {
      return res.status(404).json({
        success: false,
        error: "Referral not found"
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// GET /api/referrals/:id/history - Get referral status history
router.get("/:id/history", 
  requireAuth, 
  async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;
  try {
    const referralId = parseInt(req.params.id);
    const userId = parseInt(authReq.user.id);

    if (isNaN(referralId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid referral ID"
      });
    }

    // Check if referral belongs to user
    const referral = referralService.getReferralById(referralId);
    if (referral.referrerId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied"
      });
    }

    const history = referralService.getReferralStatusHistory(referralId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("Get referral history error:", error);
    
    if (error instanceof Error && error.message === "Referral not found") {
      return res.status(404).json({
        success: false,
        error: "Referral not found"
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Referee endpoints (no auth required - uses token validation)

// GET /api/referrals/referee/:token - Get referral details by token
router.get("/referee/:token", 
  async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const tokenData = (req as any).tokenData;

    const referralDetails = await referralService.getReferralByToken(token);

    res.json({
      success: true,
      data: referralDetails
    });
  } catch (error) {
    console.error("Get referral by token error:", error);
    
    if (error instanceof Error) {
      if (error.message === "Referral not found" || error.message === "Invalid token") {
        return res.status(404).json({
          success: false,
          error: "Referral not found or invalid token"
        });
      }
      
      if (error.message === "Referral expired") {
        return res.status(410).json({
          success: false,
          error: "This referral has expired"
        });
      }
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// POST /api/referrals/referee/:token/respond - Submit referee response
router.post("/referee/:token/respond", 
  async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const responseData = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required"
      });
    }

    // Validate response data
    const refereeResponseSchema = z.object({
      action: z.enum(['interested', 'declined'], { errorMap: () => ({ message: "Action must be 'interested' or 'declined'" }) }),
      feedback: z.string().max(1000, "Feedback too long").optional(),
      createAccount: z.boolean().optional(),
      accountData: z.object({
        firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
        lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
        phone: z.string().max(20, "Phone number too long").optional(),
        linkedinUrl: z.string().url("Invalid LinkedIn URL").optional()
      }).optional()
    });

    const validatedData = refereeResponseSchema.parse(responseData);

    // Validate account data if createAccount is true
    if (validatedData.createAccount && !validatedData.accountData) {
      return res.status(400).json({
        success: false,
        error: "Account data is required when creating an account"
      });
    }

    const result = await referralService.processRefereeResponse(token, validatedData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Process referee response error:", error);
    
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: fieldErrors,
      });
    }

    if (error instanceof Error) {
      if (error.message === "Referral not found" || error.message === "Invalid token") {
        return res.status(404).json({
          success: false,
          error: "Referral not found or invalid token"
        });
      }
      
      if (error.message === "Referral expired") {
        return res.status(410).json({
          success: false,
          error: "This referral has expired"
        });
      }

      if (error.message === "Response already submitted") {
        return res.status(409).json({
          success: false,
          error: "Response has already been submitted for this referral"
        });
      }

      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

export default router;