import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/connection.js';

/**
 * Check if a JWT token is blacklisted
 * @param jti - JWT ID from the token
 * @returns true if blacklisted, false otherwise
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.query(
      'SELECT 1 FROM token_blacklist WHERE token_jti = $1 AND expires_at > NOW() LIMIT 1',
      [jti]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // Fail open - if we can't check, allow the request
    return false;
  }
}

/**
 * Blacklist a specific token
 * @param userId - User ID
 * @param jti - JWT ID
 * @param reason - Reason for blacklisting
 * @param expiresAt - When the token expires
 */
export async function blacklistToken(
  userId: number,
  jti: string,
  reason: string,
  expiresAt: Date
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.query(
      'INSERT INTO token_blacklist (user_id, token_jti, reason, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, jti, reason, expiresAt]
    );
    console.log(`✅ Token blacklisted: ${jti} (reason: ${reason})`);
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw error;
  }
}

/**
 * Blacklist all tokens for a user (e.g., on password reset)
 * @param userId - User ID
 * @param reason - Reason for blacklisting
 */
export async function blacklistAllUserTokens(
  userId: number,
  reason: string = 'password_reset'
): Promise<void> {
  try {
    const db = await getDatabase();
    // We can't blacklist tokens we don't know about, but we can record the event
    // Future tokens will be validated against password_changed_at
    console.log(`⚠️  All tokens for user ${userId} should be considered invalid (reason: ${reason})`);
    
    // For now, we'll rely on password_changed_at validation in the auth middleware
    // A full implementation would track all issued tokens
  } catch (error) {
    console.error('Error blacklisting user tokens:', error);
    throw error;
  }
}

/**
 * Cleanup expired blacklisted tokens (run periodically)
 */
export async function cleanupExpiredBlacklistTokens(): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.query(
      'DELETE FROM token_blacklist WHERE expires_at < NOW()'
    );
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired blacklisted tokens`);
    }
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up blacklist:', error);
    return 0;
  }
}
