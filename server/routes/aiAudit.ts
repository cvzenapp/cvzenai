/**
 * AI Audit Logs API Routes
 * Provides endpoints to view and analyze AI service audit logs
 */

import { Router, Request, Response } from 'express';
import { aiAuditService } from '../services/aiAuditService.js';
import { requireAuth } from '../middleware/unifiedAuth.js';

const router = Router();

/**
 * Get recent audit logs
 * GET /api/ai-audit/logs?limit=100&operation=resume_parsing
 */
router.get('/logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const operationType = req.query.operation as string | undefined;
    
    const logs = await aiAuditService.getRecentLogs(limit, operationType);
    
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  } catch (error: any) {
    console.error('❌ Failed to get audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit logs',
      message: error.message
    });
  }
});

/**
 * Get user audit statistics
 * GET /api/ai-audit/user-stats
 */
router.get('/user-stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const stats = await aiAuditService.getUserAuditStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('❌ Failed to get user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics',
      message: error.message
    });
  }
});

/**
 * Get operation statistics
 * GET /api/ai-audit/operation-stats?operation=resume_parsing&startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/operation-stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const operationType = req.query.operation as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    if (!operationType) {
      return res.status(400).json({
        success: false,
        error: 'Operation type is required'
      });
    }
    
    const stats = await aiAuditService.getOperationStats(operationType, startDate, endDate);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('❌ Failed to get operation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve operation statistics',
      message: error.message
    });
  }
});

/**
 * Get privacy compliance report
 * GET /api/ai-audit/privacy-report?startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/privacy-report', requireAuth, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const report = await aiAuditService.getPrivacyReport(startDate, endDate);
    
    // Calculate compliance rate
    const complianceRate = report.total_requests > 0
      ? ((report.pii_redacted_count / report.total_requests) * 100).toFixed(2)
      : '0.00';
    
    res.json({
      success: true,
      data: {
        ...report,
        compliance_rate: parseFloat(complianceRate)
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get privacy report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve privacy report',
      message: error.message
    });
  }
});

/**
 * Get audit summary dashboard
 * GET /api/ai-audit/dashboard
 */
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get various statistics for dashboard
    const [
      recentLogs,
      privacyReport
    ] = await Promise.all([
      aiAuditService.getRecentLogs(10),
      aiAuditService.getPrivacyReport()
    ]);
    
    res.json({
      success: true,
      data: {
        recent_logs: recentLogs,
        privacy_report: privacyReport,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard data',
      message: error.message
    });
  }
});

export default router;
