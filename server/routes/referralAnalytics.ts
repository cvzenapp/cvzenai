/**
 * Referral Analytics API Routes
 * Provides analytics and reporting endpoints for the referrals system
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { ReferralAnalyticsService } from "../services/referralAnalyticsService.js";
import { ReferralStatus } from "../../shared/referrals.js";

const router = Router();
const analyticsService = new ReferralAnalyticsService();

// Validation schemas
const analyticsFiltersSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  companyName: z.string().optional(),
  status: z.array(z.nativeEnum(ReferralStatus)).optional(),
  userId: z.number().optional()
});

const exportFormatSchema = z.object({
  format: z.enum(['csv', 'json']).default('json')
});

const topReferrersSchema = z.object({
  limit: z.number().min(1).max(100).default(10)
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

// GET /api/analytics/referrals - Get comprehensive referral analytics
router.get("/referrals", requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = analyticsFiltersSchema.parse(req.query);
    const analytics = analyticsService.getReferralAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error("Get referral analytics error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid filter parameters",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to retrieve analytics"
    });
  }
});

// GET /api/analytics/conversion-funnel - Get conversion funnel analysis
router.get("/conversion-funnel", requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = analyticsFiltersSchema.parse(req.query);
    const funnel = analyticsService.getConversionFunnel(filters);

    res.json({
      success: true,
      data: funnel
    });
  } catch (error) {
    console.error("Get conversion funnel error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid filter parameters",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to retrieve conversion funnel"
    });
  }
});

// GET /api/analytics/top-referrers - Get top referrers leaderboard
router.get("/top-referrers", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { limit } = topReferrersSchema.parse(req.query);
    const filters = analyticsFiltersSchema.parse(req.query);
    const topReferrers = analyticsService.getTopReferrers(limit, filters);

    res.json({
      success: true,
      data: topReferrers
    });
  } catch (error) {
    console.error("Get top referrers error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid parameters",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to retrieve top referrers"
    });
  }
});

// GET /api/analytics/real-time - Get real-time analytics summary
router.get("/real-time", requireAdmin, async (req: Request, res: Response) => {
  try {
    const realTimeData = analyticsService.getRealTimeAnalytics();

    res.json({
      success: true,
      data: realTimeData
    });
  } catch (error) {
    console.error("Get real-time analytics error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve real-time analytics"
    });
  }
});

// GET /api/analytics/export - Export referral data
router.get("/export", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { format } = exportFormatSchema.parse(req.query);
    const filters = analyticsFiltersSchema.parse(req.query);
    const exportData = analyticsService.exportReferralData(format, filters);

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData.referrals);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="referrals-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="referrals-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error("Export referral data error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid export parameters",
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to export data"
    });
  }
});

// GET /api/analytics/dashboard-summary - Get summary data for admin dashboard
router.get("/dashboard-summary", requireAdmin, async (req: Request, res: Response) => {
  try {
    const realTimeData = analyticsService.getRealTimeAnalytics();
    const overallAnalytics = analyticsService.getReferralAnalytics();
    const conversionFunnel = analyticsService.getConversionFunnel();
    const topReferrers = analyticsService.getTopReferrers(5);

    res.json({
      success: true,
      data: {
        realTime: realTimeData,
        overall: overallAnalytics,
        conversionFunnel,
        topReferrers
      }
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve dashboard summary"
    });
  }
});

/**
 * Convert referral data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = [
    'ID',
    'Referrer Name',
    'Referrer Email',
    'Referee Name',
    'Referee Email',
    'Position Title',
    'Company Name',
    'Status',
    'Reward Amount',
    'Reward Status',
    'Created At',
    'Updated At',
    'Reward Paid At'
  ];

  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = [
      row.id,
      `"${row.referrer_name || ''}"`,
      `"${row.referrer_email || ''}"`,
      `"${row.referee_name || ''}"`,
      `"${row.referee_email || ''}"`,
      `"${row.position_title || ''}"`,
      `"${row.company_name || ''}"`,
      row.status,
      row.reward_amount || 0,
      row.reward_status || '',
      row.created_at,
      row.updated_at,
      row.reward_paid_at || ''
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export default router;