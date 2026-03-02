import { Router, Response } from "express";
import { AuthRequest } from '../middleware/unifiedAuth.js';
import bcrypt from 'bcryptjs';
import { blacklistAllUserTokens } from '../middleware/tokenBlacklist.js';

const router = Router();

// Admin endpoint to reset user password
router.post("/reset-password", async (req: AuthRequest, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Email and new password are required"
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long"
      });
    }

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Check if user exists
    const userResult = await db.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and set password_changed_at timestamp
    // This will invalidate all existing JWT tokens
    await db.query(
      "UPDATE users SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW() WHERE email = $2",
      [hashedPassword, email]
    );

    // Blacklist all existing tokens for this user
    const userId = userResult.rows[0].id;
    await blacklistAllUserTokens(userId, 'password_reset');

    console.log(`✅ Password reset successful for user: ${email}`);
    console.log(`🚫 All existing sessions for ${email} have been invalidated`);

    res.json({
      success: true,
      message: "Password reset successfully. User must log in again with the new password.",
      data: {
        email: email,
        note: "All existing sessions have been invalidated"
      }
    });

  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

// Admin endpoint to list all users
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    const usersResult = await db.query(
      "SELECT id, email, user_type, created_at, updated_at FROM users ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: usersResult.rows,
      total: usersResult.rows.length
    });

  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

export default router;
