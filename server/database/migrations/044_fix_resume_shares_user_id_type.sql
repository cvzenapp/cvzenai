-- Fix resume_shares.user_id column type from INTEGER to UUID
-- This matches the users.id column type

-- Drop the existing user_id column and recreate it as UUID
ALTER TABLE resume_shares DROP COLUMN IF EXISTS user_id;

-- Add user_id as UUID with foreign key to users table
ALTER TABLE resume_shares ADD COLUMN user_id UUID NOT NULL;

-- Add foreign key constraint
ALTER TABLE resume_shares 
ADD CONSTRAINT fk_resume_shares_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Recreate the index
DROP INDEX IF EXISTS idx_resume_shares_user_id;
CREATE INDEX idx_resume_shares_user_id ON resume_shares(user_id);
