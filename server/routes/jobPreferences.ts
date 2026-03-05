import { Router } from 'express';
import unifiedAuth, { AuthRequest } from '../middleware/unifiedAuth.js';
import { jobPreferencesService, JobPreferencesCreateRequest } from '../services/jobPreferencesService.js';

const router = Router();

/**
 * GET /api/job-preferences
 * Get job preferences for the authenticated user
 */
router.get('/', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const preferences = await jobPreferencesService.getJobPreferences(req.user.id);
    
    if (!preferences) {
      // Return default preferences if none exist
      const defaultPreferences = jobPreferencesService.getDefaultPreferences();
      return res.json({
        success: true,
        data: {
          ...defaultPreferences,
          userId: req.user.id,
          exists: false
        },
        message: 'No preferences found, returning defaults'
      });
    }

    return res.json({
      success: true,
      data: {
        ...preferences,
        exists: true
      }
    });
  } catch (error) {
    console.error('❌ [JOB PREFERENCES API] Error getting preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get job preferences'
    });
  }
});

/**
 * POST /api/job-preferences
 * Create or update job preferences for the authenticated user
 */
router.post('/', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const preferencesData: JobPreferencesCreateRequest = req.body;
    
    // Validate the preferences data
    const validation = jobPreferencesService.validatePreferences(preferencesData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences data',
        details: validation.errors
      });
    }

    const preferences = await jobPreferencesService.upsertJobPreferences(req.user.id, preferencesData);

    return res.json({
      success: true,
      data: preferences,
      message: 'Job preferences saved successfully'
    });
  } catch (error) {
    console.error('❌ [JOB PREFERENCES API] Error saving preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save job preferences'
    });
  }
});

/**
 * PUT /api/job-preferences
 * Update job preferences for the authenticated user
 */
router.put('/', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const preferencesData: JobPreferencesCreateRequest = req.body;
    
    // Validate the preferences data
    const validation = jobPreferencesService.validatePreferences(preferencesData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences data',
        details: validation.errors
      });
    }

    const preferences = await jobPreferencesService.upsertJobPreferences(req.user.id, preferencesData);

    return res.json({
      success: true,
      data: preferences,
      message: 'Job preferences updated successfully'
    });
  } catch (error) {
    console.error('❌ [JOB PREFERENCES API] Error updating preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update job preferences'
    });
  }
});

/**
 * DELETE /api/job-preferences
 * Delete job preferences for the authenticated user
 */
router.delete('/', unifiedAuth.requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const deleted = await jobPreferencesService.deleteJobPreferences(req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'No job preferences found to delete'
      });
    }

    return res.json({
      success: true,
      message: 'Job preferences deleted successfully'
    });
  } catch (error) {
    console.error('❌ [JOB PREFERENCES API] Error deleting preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete job preferences'
    });
  }
});

/**
 * GET /api/job-preferences/options
 * Get available options for job preferences dropdowns
 */
router.get('/options', async (req, res) => {
  try {
    const options = {
      workTypes: [
        { value: 'remote', label: 'Remote' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'onsite', label: 'On-site' }
      ],
      employmentTypes: [
        { value: 'full-time', label: 'Full-time' },
        { value: 'part-time', label: 'Part-time' },
        { value: 'contract', label: 'Contract' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'internship', label: 'Internship' }
      ],
      interviewModes: [
        { value: 'video', label: 'Video Call' },
        { value: 'phone', label: 'Phone Call' },
        { value: 'in-person', label: 'In-person' }
      ],
      companySizes: [
        { value: 'startup', label: 'Startup (1-10 employees)' },
        { value: 'small', label: 'Small (11-50 employees)' },
        { value: 'medium', label: 'Medium (51-200 employees)' },
        { value: 'large', label: 'Large (201-1000 employees)' },
        { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
      ],
      roleLevels: [
        { value: 'entry', label: 'Entry Level' },
        { value: 'mid', label: 'Mid Level' },
        { value: 'senior', label: 'Senior Level' },
        { value: 'lead', label: 'Lead' },
        { value: 'manager', label: 'Manager' },
        { value: 'director', label: 'Director' },
        { value: 'executive', label: 'Executive' }
      ],
      currencies: [
        { value: 'USD', label: 'USD ($)' },
        { value: 'EUR', label: 'EUR (€)' },
        { value: 'GBP', label: 'GBP (£)' },
        { value: 'INR', label: 'INR (₹)' },
        { value: 'CAD', label: 'CAD (C$)' },
        { value: 'AUD', label: 'AUD (A$)' }
      ],
      daysOfWeek: [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
      ],
      timeSlots: [
        { value: '09:00-12:00', label: '9:00 AM - 12:00 PM' },
        { value: '12:00-15:00', label: '12:00 PM - 3:00 PM' },
        { value: '15:00-18:00', label: '3:00 PM - 6:00 PM' },
        { value: '18:00-21:00', label: '6:00 PM - 9:00 PM' }
      ],
      industries: [
        { value: 'technology', label: 'Technology' },
        { value: 'finance', label: 'Finance' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
        { value: 'retail', label: 'Retail' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'consulting', label: 'Consulting' },
        { value: 'media', label: 'Media & Entertainment' },
        { value: 'government', label: 'Government' },
        { value: 'nonprofit', label: 'Non-profit' }
      ]
    };

    return res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('❌ [JOB PREFERENCES API] Error getting options:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get job preference options'
    });
  }
});

export default router;