/**
 * User Profile Routes with Referral Integration
 * Enhanced user profile endpoints that include referral data and permissions
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserIntegrationService } from '../services/userIntegrationService.js';
import { referralAuth, AuthenticatedRequest } from '../middleware/referralAuth.js';
import { requireAuth, AuthRequest } from '../middleware/unifiedAuth.js';

const router = Router();
const userIntegrationService = new UserIntegrationService();

// Validation schemas
const updateReferralProfileSchema = z.object({
  preferredIndustries: z.array(z.string()).optional(),
  referralGoals: z.object({
    monthlyTarget: z.number().min(0).max(100),
    yearlyTarget: z.number().min(0).max(1200)
  }).optional(),
  contactPreferences: z.object({
    allowLinkedInSync: z.boolean(),
    allowGitHubSync: z.boolean(),
    emailNotifications: z.boolean()
  }).optional()
});

// // GET /api/user/profile - Get enhanced user profile with referral data
// router.get('/profile', referralAuth.requireAuth, async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const profile = await userIntegrationService.getUserProfileWithReferrals(userId);

//     res.json({
//       success: true,
//       data: profile
//     });
//   } catch (error) {
//     console.error('Get user profile error:', error);
    
//     if (error instanceof Error && error.message === 'User not found') {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // GET /api/user/permissions - Get user's referral permissions
// router.get('/permissions', referralAuth.requireAuth, async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const permissions = userIntegrationService.getUserPermissions(userId);

//     res.json({
//       success: true,
//       data: permissions
//     });
//   } catch (error) {
//     console.error('Get user permissions error:', error);
    
//     if (error instanceof Error && error.message === 'User not found') {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // GET /api/user/roles - Get user's referral roles
// router.get('/roles', referralAuth.requireAuth, async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const roles = userIntegrationService.getUserReferralRoles(userId);

//     res.json({
//       success: true,
//       data: {
//         roles
//       }
//     });
//   } catch (error) {
//     console.error('Get user roles error:', error);
    
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // GET /api/user/contact-suggestions - Get contact suggestions for referrals
// router.get('/contact-suggestions', 
//   referralAuth.requireAuth, 
//   referralAuth.requirePermission('create_referral'),
//   async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const suggestions = await userIntegrationService.getContactSuggestions(userId);

//     res.json({
//       success: true,
//       data: {
//         suggestions
//       }
//     });
//   } catch (error) {
//     console.error('Get contact suggestions error:', error);
    
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// PUT /api/user/profile - Update basic user profile (name, mobile, avatar)
// Note: This route should be registered with requireAuth middleware in server/index.ts
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User ID not found'
      });
    }

    const { name, mobile, avatar } = req.body;

    console.log('📝 Updating profile for user:', userId, { name, mobile, hasAvatar: !!avatar });

    // Get database connection
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();
    
    // Verify avatar column exists
    try {
      const checkColumn = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar'
      `);
      console.log('🔍 Avatar column check:', checkColumn.rows);
    } catch (e) {
      console.error('❌ Column check failed:', e);
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (mobile !== undefined) {
      updates.push(`mobile = $${paramIndex++}`);
      values.push(mobile);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Add updated_at timestamp
    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());

    // Add userId for WHERE clause
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    
    console.log('🔍 Executing query:', query);
    console.log('🔍 With values:', values.map((v, i) => i === values.length - 1 ? v : (typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v)));
    
    await db.query(query, values);

    // Get updated user
    const result = await db.query('SELECT id, email, first_name, last_name, mobile, avatar FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    // Combine first_name and last_name into name for response
    const updatedUser = {
      ...user,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
    };

    console.log('✅ Profile updated successfully for user:', userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    console.error('❌ Update profile error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      column: error.column,
      position: error.position
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/user/referral-profile - Update user's referral-specific profile
// router.put('/referral-profile', 
//   referralAuth.requireAuth,
//   async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const validatedData = updateReferralProfileSchema.parse(req.body);

//     await userIntegrationService.updateUserReferralProfile(userId, validatedData);

//     res.json({
//       success: true,
//       message: 'Referral profile updated successfully'
//     });
//   } catch (error) {
//     console.error('Update referral profile error:', error);
    
//     if (error instanceof z.ZodError) {
//       const fieldErrors: Record<string, string> = {};
//       error.errors.forEach((err) => {
//         if (err.path.length > 0) {
//           fieldErrors[err.path.join('.')] = err.message;
//         }
//       });
//       return res.status(400).json({
//         success: false,
//         error: 'Validation failed',
//         details: fieldErrors
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // POST /api/user/validate-action - Validate if user can perform a specific action
// router.post('/validate-action', 
//   referralAuth.requireAuth,
//   async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const { action, targetData } = req.body;

//     if (!action || typeof action !== 'string') {
//       return res.status(400).json({
//         success: false,
//         error: 'Action is required'
//       });
//     }

//     const canPerform = await userIntegrationService.validateUserAction(userId, action, targetData);

//     res.json({
//       success: true,
//       data: {
//         action,
//         canPerform,
//         targetData
//       }
//     });
//   } catch (error) {
//     console.error('Validate user action error:', error);
    
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // POST /api/user/link-referee - Link referee account to referral (internal use)
// router.post('/link-referee', 
//   referralAuth.requireAuth,
//   async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const { referralToken, newUserId } = req.body;

//     if (!referralToken || !newUserId) {
//       return res.status(400).json({
//         success: false,
//         error: 'Referral token and user ID are required'
//       });
//     }

//     // Validate that the requesting user has permission to link accounts
//     // This would typically be called during user registration process
//     await userIntegrationService.linkRefereeAccount(referralToken, newUserId);

//     res.json({
//       success: true,
//       message: 'Referee account linked successfully'
//     });
//   } catch (error) {
//     console.error('Link referee account error:', error);
    
//     if (error instanceof Error) {
//       return res.status(400).json({
//         success: false,
//         error: error.message
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // GET /api/user/referral-history - Get detailed referral history
// router.get('/referral-history', 
//   referralAuth.requireAuth,
//   async (req: AuthenticatedRequest, res: Response) => {
//   try {
//     const userId = req.user.id;
//     const { limit = 20, offset = 0 } = req.query;

//     // Get user profile which includes referral history
//     const profile = await userIntegrationService.getUserProfileWithReferrals(userId);

//     // For more detailed history, we could implement pagination here
//     const paginatedHistory = profile.referralHistory.slice(
//       Number(offset), 
//       Number(offset) + Number(limit)
//     );

//     res.json({
//       success: true,
//       data: {
//         history: paginatedHistory,
//         total: profile.referralHistory.length,
//         hasMore: Number(offset) + paginatedHistory.length < profile.referralHistory.length
//       }
//     });
//   } catch (error) {
//     console.error('Get referral history error:', error);
    
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// PUT /api/user/change-password - Change user password
router.put('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    console.log('🔐 Changing password for user:', userId);

    // Get database connection
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Get current user with password hash
    const userResult = await db.query('SELECT id, email, password_hash FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = (await import('bcryptjs')).default;
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, password_changed_at = $2, updated_at = $3 WHERE id = $4',
      [newPasswordHash, new Date().toISOString(), new Date().toISOString(), userId]
    );

    console.log('✅ Password changed successfully for user:', userId);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    console.error('❌ Change password error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;