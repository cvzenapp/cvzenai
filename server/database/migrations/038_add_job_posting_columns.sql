-- Add missing columns to job_postings table for enhanced job posting functionality

-- Add department column
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add experience level column
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive'));

-- Add salary columns
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS salary_min INTEGER;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS salary_max INTEGER;
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'USD';

-- Add benefits column (JSON array)
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]';

-- Add is_active column for job status
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add company_id column if it doesn't exist (for linking to companies table)
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS company_id UUID;

-- Add view_count column for tracking job views
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update existing records to have default values
UPDATE job_postings SET 
  department = COALESCE(department, 'General'),
  experience_level = COALESCE(experience_level, 'mid'),
  salary_currency = COALESCE(salary_currency, 'USD'),
  benefits = COALESCE(benefits, '[]'::jsonb),
  is_active = COALESCE(is_active, true),
  view_count = COALESCE(view_count, 0)
WHERE department IS NULL OR experience_level IS NULL OR salary_currency IS NULL OR benefits IS NULL OR is_active IS NULL OR view_count IS NULL;

-- Create index on active jobs for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active) WHERE is_active = true;

-- Create index on recruiter_id and is_active for recruiter dashboard queries
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter_active ON job_postings(recruiter_id, is_active);