-- Fix resume_shares table schema
-- Add missing columns: user_id, is_active, view_count

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resume_shares' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE resume_shares ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    
    -- Populate user_id from resumes table for existing records
    UPDATE resume_shares rs
    SET user_id = r.user_id
    FROM resumes r
    WHERE rs.resume_id = r.id AND rs.user_id IS NULL;
    
    -- Make user_id NOT NULL after populating
    ALTER TABLE resume_shares ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resume_shares' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE resume_shares ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add view_count column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resume_shares' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE resume_shares ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_resume_shares_user_id ON resume_shares(user_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_resume_shares_resume_user ON resume_shares(resume_id, user_id);

COMMENT ON COLUMN resume_shares.user_id IS 'Owner of the resume (denormalized from resumes table)';
COMMENT ON COLUMN resume_shares.is_active IS 'Whether the share link is active';
COMMENT ON COLUMN resume_shares.view_count IS 'Number of times the shared resume has been viewed';
