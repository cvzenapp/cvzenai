-- Fix resume_shares table schema - add missing columns to match production
-- This migration adds columns that exist in production but are missing in the base schema

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resume_shares' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE resume_shares ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0;
    
    -- Add foreign key constraint
    ALTER TABLE resume_shares 
    ADD CONSTRAINT fk_resume_shares_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    -- Update default to remove it after adding the constraint
    ALTER TABLE resume_shares ALTER COLUMN user_id DROP DEFAULT;
    
    RAISE NOTICE 'Added user_id column with foreign key constraint';
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
    RAISE NOTICE 'Added is_active column';
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
    RAISE NOTICE 'Added view_count column';
  END IF;
END $$;

-- Create index on user_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'resume_shares' AND indexname = 'idx_resume_shares_user_id'
  ) THEN
    CREATE INDEX idx_resume_shares_user_id ON resume_shares(user_id);
    RAISE NOTICE 'Created index on user_id';
  END IF;
END $$;
