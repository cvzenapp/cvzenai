-- Add password_changed_at column to track when password was last changed
-- This helps identify when tokens should be invalidated

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NOW();

-- Set initial value for existing users
UPDATE users SET password_changed_at = updated_at WHERE password_changed_at IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_changed_at ON users(password_changed_at);

COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change - used to invalidate old JWT tokens';
