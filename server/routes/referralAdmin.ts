/**
 * Referral Admin API Routes
 * Provides administrative endpoints for the referrals system
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { ReferralAdminService } from "../services/referralAdminService.js";
import { ReferralStatus } from "../../shared/referrals.js";

const router = Router();
const adminService = new ReferralAdminService();

// Validation schemas
const configUpdateSchema = z.record(z.string());

const bulkStatusUpdateSchema = z.object({
  referralIds: z.array(z.number()).min(1, "At least one referral ID required"),
  newStatus: z.nativeEnum(ReferralStatus),
  notes: z.string().optional()
});

const rewardApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional()
});

const programStatusSchema = z.object({
  status: z.enum(['active', 'paused']),
  reason: z.string().optional()
});

const flagForReviewSchema = z.object({
  reason: z.string().min(1, "Reason is required")
});

// Middleware to check admin permissions
const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// GET /api/admin/referrals/config - Get program configuration
router.get("/config", requireAdmin, async (req: Request, res: Response) => {
  try {
    const config = adminService.getProgramConfig();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error("Get program config error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve program configuration"
    });
  }
});

// PUT /api/admin/referrals/config - Update program configuration
router.put("/config", requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = configUpdateSchema.parse(req.body);
    const adminUserId = (req as any).user.id;

    adminService.updateProgramConfig(updates, adminUserId);

    res.json({
      success: true,
      message: "Configuration updated successfully"
    });
  } catch (error) {
    console.error("Update program config error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid configuration data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update configuration"
    });
  }
});

// GET /api/admin/referrals/pending-approvals - Get referrals pending approval
router.get("/pending-approvals", requireAdmin, async (req: Request, res: Response) => {
  try {
    const pendingApprovals = adminService.getPendingApprovals();

    res.json({
      success: true,
      data: pendingApprovals
    });
  } catch (error) {
    console.error("Get pending approvals error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve pending approvals"
    });
  }
});

// POST /api/admin/referrals/:id/approve - Approve or reject reward
router.post("/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  try {
    const referralId = parseInt(req.params.id);
    const { approved, notes } = rewardApprovalSchema.parse(req.body);
    const adminUserId = (req as any).user.id;

    if (isNaN(referralId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid referral ID"
      });
    }

    adminService.processRewardApproval(referralId, approved, adminUserId, notes);

    res.json({
      success: true,
      message: `Reward ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error("Process reward approval error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid approval data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to process reward approval"
    });
  }
});

// POST /api/admin/referrals/bulk-update - Bulk update referral statuses
router.post("/bulk-update", requireAdmin, async (req: Request, res: Response) => {
  try {
    const updateData = bulkStatusUpdateSchema.parse(req.body);
    const adminUserId = (req as any).user.id;

    const result = adminService.bulkUpdateStatus({
      referralIds: updateData.referralIds,
      newStatus: updateData.newStatus,
      notes: updateData.notes,
      adminUserId
    });

    res.json({
      success: true,
      data: result,
      message: `Updated ${result.updated} referrals${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid bulk update data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to perform bulk update"
    });
  }
});

// GET /api/admin/referrals/fraud-detection - Get fraud detection results
router.get("/fraud-detection", requireAdmin, async (req: Request, res: Response) => {
  try {
    const fraudResults = adminService.detectFraud();

    res.json({
      success: true,
      data: fraudResults
    });
  } catch (error) {
    console.error("Fraud detection error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to run fraud detection"
    });
  }
});

// POST /api/admin/referrals/program-status - Pause or resume program
router.post("/program-status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, reason } = programStatusSchema.parse(req.body);
    const adminUserId = (req as any).user.id;

    adminService.setProgramStatus(status, adminUserId, reason);

    res.json({
      success: true,
      message: `Program ${status === 'active' ? 'resumed' : 'paused'} successfully`
    });
  } catch (error) {
    console.error("Set program status error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid status data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update program status"
    });
  }
});

// GET /api/admin/referrals/stats - Get admin dashboard statistics
router.get("/stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = adminService.getAdminStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Get admin stats error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve admin statistics"
    });
  }
});

// GET /api/admin/referrals/action-history - Get admin action history
router.get("/action-history", requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = adminService.getAdminActionHistory(limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("Get action history error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve action history"
    });
  }
});

// POST /api/admin/referrals/:id/flag - Flag referral for review
router.post("/:id/flag", requireAdmin, async (req: Request, res: Response) => {
  try {
    const referralId = parseInt(req.params.id);
    const { reason } = flagForReviewSchema.parse(req.body);
    const adminUserId = (req as any).user.id;

    if (isNaN(referralId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid referral ID"
      });
    }

    adminService.flagForReview(referralId, adminUserId, reason);

    res.json({
      success: true,
      message: "Referral flagged for review successfully"
    });
  } catch (error) {
    console.error("Flag for review error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid flag data",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to flag referral for review"
    });
  }
});

// GET /api/admin/referrals/flagged - Get flagged referrals
router.get("/flagged", requireAdmin, async (req: Request, res: Response) => {
  try {
    const flaggedReferrals = adminService.getFlaggedReferrals();

    res.json({
      success: true,
      data: flaggedReferrals
    });
  } catch (error) {
    console.error("Get flagged referrals error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve flagged referrals"
    });
  }
});

export default router;