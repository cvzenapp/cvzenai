-- Add mobile column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
