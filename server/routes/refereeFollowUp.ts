/**
 * Referee Follow-up API Routes
 * Handles referee onboarding, job matching, and follow-up sequences
 */

import express from 'express';
import { refereeFollowUpService } from '../services/refereeFollowUpService.js';
import { jobMatchingService } from '../services/jobMatchingService.js';

const router = express.Router();

/**
 * Initialize follow-up sequence for a referral
 * POST /api/referee/follow-up/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const { referralId, sequenceType } = req.body;

    if (!referralId || !sequenceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: referralId, sequenceType'
      });
    }

    if (!['non_responder', 'onboarding', 'job_matching'].includes(sequenceType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sequence type'
      });
    }

    const sequence = await refereeFollowUpService.initializeFollowUpSequence(referralId, sequenceType);

    res.json({
      success: true,
      data: sequence
    });
  } catch (error) {
    console.error('Error initializing follow-up sequence:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Process due follow-up sequences (for cron job)
 * POST /api/referee/follow-up/process
 */
router.post('/process', async (req, res) => {
  try {
    const processedCount = await refereeFollowUpService.processDueFollowUps();

    res.json({
      success: true,
      data: {
        processedCount,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing follow-ups:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Create referee profile
 * POST /api/referee/profile
 */
router.post('/profile', async (req, res) => {
  try {
    const { userId, referralId, skills, experience, preferences } = req.body;

    if (!userId || !referralId || !skills || !experience || !preferences) {
      return res.status(400).json({
        success: false,
        error: 'Missing required profile data'
      });
    }

    // Validate preferences structure
    if (!preferences.jobTypes || !preferences.locations || typeof preferences.remoteWork !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences structure'
      });
    }

    const profile = await refereeFollowUpService.createRefereeProfile(userId, referralId, {
      skills,
      experience,
      preferences
    });

    // Initialize onboarding sequence
    await refereeFollowUpService.initializeFollowUpSequence(referralId, 'onboarding');

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error creating referee profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get job matches for referee
 * GET /api/referee/:userId/job-matches
 */
router.get('/:userId/job-matches', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const matches = await jobMatchingService.findJobMatches(userId, limit);

    // Store matches for tracking
    for (const match of matches) {
      await jobMatchingService.storeJobMatch(userId, match);
    }

    res.json({
      success: true,
      data: {
        matches,
        total: matches.length
      }
    });
  } catch (error) {
    console.error('Error finding job matches:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Track job match engagement
 * POST /api/referee/:userId/job-matches/:jobMatchId/engagement
 */
router.post('/:userId/job-matches/:jobMatchId/engagement', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const jobMatchId = parseInt(req.params.jobMatchId);
    const { engagementType } = req.body;

    if (isNaN(userId) || isNaN(jobMatchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID or job match ID'
      });
    }

    if (!['viewed', 'applied'].includes(engagementType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid engagement type'
      });
    }

    await jobMatchingService.trackJobMatchEngagement(userId, jobMatchId, engagementType);

    res.json({
      success: true,
      data: {
        userId,
        jobMatchId,
        engagementType,
        trackedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error tracking job match engagement:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get job match analytics for referee
 * GET /api/referee/:userId/analytics
 */
router.get('/:userId/analytics', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    const analytics = jobMatchingService.getJobMatchAnalytics(userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting job match analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Collect feedback from referee
 * POST /api/referee/feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    const { referralId, feedbackType, feedback, rating, suggestions } = req.body;

    if (!referralId || !feedbackType || !feedback) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: referralId, feedbackType, feedback'
      });
    }

    if (!['declined_referral', 'interview_feedback', 'general'].includes(feedbackType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feedback type'
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const feedbackRecord = await refereeFollowUpService.collectFeedback(referralId, {
      feedbackType,
      feedback,
      rating,
      suggestions
    });

    res.json({
      success: true,
      data: feedbackRecord
    });
  } catch (error) {
    console.error('Error collecting feedback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get referee conversion metrics
 * GET /api/referee/metrics/conversion
 */
router.get('/metrics/conversion', async (req, res) => {
  try {
    const metrics = refereeFollowUpService.getRefereeConversionMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting conversion metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Update referee profile
 * PUT /api/referee/:userId/profile
 */
router.put('/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { skills, experience, preferences, onboardingCompleted } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // This would update the existing profile - simplified implementation
    res.json({
      success: true,
      data: {
        message: 'Profile update functionality would be implemented here',
        userId,
        updatedFields: { skills, experience, preferences, onboardingCompleted }
      }
    });
  } catch (error) {
    console.error('Error updating referee profile:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get referee onboarding status
 * GET /api/referee/:userId/onboarding
 */
router.get('/:userId/onboarding', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID'
      });
    }

    // Mock onboarding status - in production would query database
    const onboardingStatus = {
      userId,
      profileCreated: true,
      skillsAdded: true,
      preferencesSet: true,
      onboardingCompleted: false,
      completionPercentage: 75,
      nextStep: 'Complete job preferences',
      estimatedTimeToComplete: '5 minutes'
    };

    res.json({
      success: true,
      data: onboardingStatus
    });
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;