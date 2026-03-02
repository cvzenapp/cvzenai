-- Add profile fields to users table
-- Migration: 015_add_user_profile_fields.sql

-- Add mobile column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='mobile') THEN
        ALTER TABLE users ADD COLUMN mobile VARCHAR(20);
    END IF;
END $$;

-- Add avatar column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='avatar') THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
    END IF;
END $$;

-- Add index on mobile for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

-- Add comment
COMMENT ON COLUMN users.mobile IS 'User mobile/phone number';
COMMENT ON COLUMN users.avatar IS 'User profile photo (base64 or URL)';
