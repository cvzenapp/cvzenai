-- Migration 026: Update job_postings table to match new schema
-- This migration updates the existing job_postings table from base schema to the new structure

-- Step 1: Add new columns if they don't exist
ALTER TABLE job_postings 
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS salary_min INTEGER,
  ADD COLUMN IF NOT EXISTS salary_max INTEGER,
  ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS benefits TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Step 2: Migrate data from old columns to new columns
-- Copy company to department if department is null
UPDATE job_postings 
SET department = company 
WHERE department IS NULL AND company IS NOT NULL;

-- Parse salary_range into salary_min and salary_max if they are null
-- Example: "$80,000 - $120,000" -> min: 80000, max: 120000
UPDATE job_postings
SET 
  salary_min = CASE 
    WHEN salary_range ~ '^\$?[0-9,]+' THEN 
      CAST(REGEXP_REPLACE(SPLIT_PART(salary_range, '-', 1), '[^0-9]', '', 'g') AS INTEGER)
    ELSE NULL
  END,
  salary_max = CASE 
    WHEN salary_range ~ '-.*\$?[0-9,]+' THEN 
      CAST(REGEXP_REPLACE(SPLIT_PART(salary_range, '-', 2), '[^0-9]', '', 'g') AS INTEGER)
    ELSE NULL
  END
WHERE salary_min IS NULL AND salary_max IS NULL AND salary_range IS NOT NULL;

-- Set default experience_level based on title keywords
UPDATE job_postings
SET experience_level = CASE
  WHEN LOWER(title) LIKE '%senior%' OR LOWER(title) LIKE '%lead%' THEN 'senior'
  WHEN LOWER(title) LIKE '%junior%' OR LOWER(title) LIKE '%entry%' THEN 'entry'
  WHEN LOWER(title) LIKE '%executive%' OR LOWER(title) LIKE '%director%' OR LOWER(title) LIKE '%vp%' THEN 'executive'
  ELSE 'mid'
END
WHERE experience_level IS NULL;

-- Migrate status to is_active
UPDATE job_postings
SET is_active = CASE
  WHEN status = 'active' THEN true
  ELSE false
END
WHERE is_active IS NULL;

-- Convert requirements from JSONB to TEXT (JSON string) if needed
-- This handles the case where requirements is JSONB in base schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_postings' 
    AND column_name = 'requirements' 
    AND data_type = 'jsonb'
  ) THEN
    -- Create a temporary column
    ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS requirements_text TEXT;
    
    -- Copy JSONB to TEXT
    UPDATE job_postings SET requirements_text = requirements::text WHERE requirements IS NOT NULL;
    
    -- Drop old column and rename new one
    ALTER TABLE job_postings DROP COLUMN requirements;
    ALTER TABLE job_postings RENAME COLUMN requirements_text TO requirements;
  END IF;
END $$;

-- Step 3: Make required columns NOT NULL (after data migration)
-- Set defaults for any remaining NULL values
UPDATE job_postings SET department = 'General' WHERE department IS NULL;
UPDATE job_postings SET experience_level = 'mid' WHERE experience_level IS NULL;
UPDATE job_postings SET job_type = 'full-time' WHERE job_type IS NULL;

-- Now make them NOT NULL
ALTER TABLE job_postings 
  ALTER COLUMN department SET NOT NULL,
  ALTER COLUMN experience_level SET NOT NULL,
  ALTER COLUMN job_type SET NOT NULL;

-- Step 4: Drop old columns that are no longer needed
ALTER TABLE job_postings 
  DROP COLUMN IF EXISTS company,
  DROP COLUMN IF EXISTS salary_range,
  DROP COLUMN IF EXISTS status;

-- Step 5: Create job_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    resume_id INTEGER,
    status VARCHAR(50) DEFAULT 'applied',
    cover_letter TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
    
    UNIQUE(job_id, user_id)
);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_id, is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id, applied_at);

-- Step 7: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_postings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_postings_timestamp ON job_postings;
CREATE TRIGGER update_job_postings_timestamp
    BEFORE UPDATE ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_job_postings_timestamp();

-- Step 8: Verify the schema
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (
    SELECT unnest(ARRAY['department', 'experience_level', 'salary_min', 'salary_max', 
                        'salary_currency', 'benefits', 'is_active', 'view_count']) AS column_name
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_postings' 
    AND column_name = expected.column_name
  );
  
  IF missing_columns IS NOT NULL THEN
    RAISE NOTICE 'Missing columns: %', missing_columns;
  ELSE
    RAISE NOTICE 'All required columns exist in job_postings table';
  END IF;
END $$;
