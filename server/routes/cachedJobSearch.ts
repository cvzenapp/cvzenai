import { Router, Request, Response } from 'express';
import { z } from 'zod';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import { cachedJobSearchService } from '../services/cachedJobSearchService.js';

const router = Router();

// Validation schemas
const searchJobsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  experienceLevel: z.string().optional(),
  limit: z.number().min(1).max(50).optional()
});

/**
 * GET /api/cached-jobs/initial - Get initial job results (cached or fresh)
 * This endpoint is called when user first opens AI chat
 * Returns cached results if available, otherwise fetches from Tavily
 */
router.get('/initial', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const forceRefresh = req.query.refresh === 'true';

    console.log(`📋 [CACHED JOBS API] Getting initial jobs for user ${userId}, forceRefresh: ${forceRefresh}`);

    const result = await cachedJobSearchService.getJobResults(userId, forceRefresh);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to get job results'
      });
    }

    res.json({
      success: true,
      data: {
        jobs: result.data,
        totalResults: result.totalResults,
        fromCache: result.fromCache,
        message: result.fromCache 
          ? 'Loaded from cache' 
          : 'Fetched fresh results'
      }
    });

  } catch (error) {
    console.error('❌ [CACHED JOBS API] Error getting initial jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get initial job results'
    });
  }
});

/**
 * POST /api/cached-jobs/search - Search for specific jobs
 * This endpoint is called when user manually searches for jobs
 * Always fetches fresh results from Tavily and updates cache
 */
router.post('/search', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const validatedData = searchJobsSchema.parse(req.body);

    console.log(`🔍 [CACHED JOBS API] Manual search for user ${userId}:`, validatedData);

    const result = await cachedJobSearchService.searchJobs(userId, validatedData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to search jobs'
      });
    }

    res.json({
      success: true,
      data: {
        jobs: result.data,
        totalResults: result.totalResults,
        searchParams: validatedData,
        message: 'Search completed successfully'
      }
    });

  } catch (error) {
    console.error('❌ [CACHED JOBS API] Error searching jobs:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to search jobs'
    });
  }
});

/**
 * DELETE /api/cached-jobs/cache - Clear user's job cache
 * Useful for testing or when user wants fresh results
 */
router.delete('/cache', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    console.log(`🗑️ [CACHED JOBS API] Clearing cache for user ${userId}`);

    await cachedJobSearchService.clearUserCache(userId);

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('❌ [CACHED JOBS API] Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/cached-jobs/stats - Get cache statistics (admin only)
 */
router.get('/stats', unifiedAuth.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Add admin role check here if needed
    
    const stats = await cachedJobSearchService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [CACHED JOBS API] Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

export default router;