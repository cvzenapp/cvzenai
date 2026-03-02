-- Fix resumes table schema - add missing JSONB columns
-- This migration adds columns that exist in the base schema but are missing in production

-- Add personal_info column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'personal_info'
  ) THEN
    ALTER TABLE resumes ADD COLUMN personal_info JSONB;
  END IF;
END $$;

-- Add skills column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'skills'
  ) THEN
    ALTER TABLE resumes ADD COLUMN skills JSONB;
  END IF;
END $$;

-- Add experience column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'experience'
  ) THEN
    ALTER TABLE resumes ADD COLUMN experience JSONB;
  END IF;
END $$;

-- Add education column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'education'
  ) THEN
    ALTER TABLE resumes ADD COLUMN education JSONB;
  END IF;
END $$;

-- Add projects column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'projects'
  ) THEN
    ALTER TABLE resumes ADD COLUMN projects JSONB;
  END IF;
END $$;

-- Add view_count column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE resumes ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add download_count column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE resumes ADD COLUMN download_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add upvotes_count column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'upvotes_count'
  ) THEN
    ALTER TABLE resumes ADD COLUMN upvotes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Change template_id from integer to varchar if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' 
    AND column_name = 'template_id' 
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE resumes ALTER COLUMN template_id TYPE VARCHAR(100) USING template_id::VARCHAR;
  END IF;
END $$;

-- Add id column as primary key if resume_id exists but id doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' AND column_name = 'resume_id'
  ) THEN
    -- Rename resume_id to id
    ALTER TABLE resumes RENAME COLUMN resume_id TO id;
  END IF;
END $$;

-- Ensure user_id is UUID type
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resumes' 
    AND column_name = 'user_id' 
    AND data_type != 'uuid'
  ) THEN
    -- This is a complex migration, may need manual intervention
    RAISE NOTICE 'user_id column type needs to be changed to UUID - manual intervention may be required';
  END IF;
END $$;
