-- Add company_id column to job_postings table
-- This links job postings to companies

-- Step 1: Add the company_id column (nullable initially for migration)
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;

-- Step 2: Populate company_id from recruiter_profiles
UPDATE job_postings jp
SET company_id = rp.company_id
FROM recruiter_profiles rp
WHERE jp.recruiter_id = rp.user_id
  AND jp.company_id IS NULL
  AND rp.company_id IS NOT NULL;

-- Step 3: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN job_postings.company_id IS 'Foreign key to companies table - links job posting to company';

-- Verification queries (optional - comment out if not needed)
DO $$
DECLARE
  total_jobs INTEGER;
  jobs_with_company INTEGER;
  jobs_without_company INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_jobs FROM job_postings;
  SELECT COUNT(*) INTO jobs_with_company FROM job_postings WHERE company_id IS NOT NULL;
  SELECT COUNT(*) INTO jobs_without_company FROM job_postings WHERE company_id IS NULL;
  
  RAISE NOTICE 'Migration complete: % total jobs, % with company_id, % without company_id', 
    total_jobs, jobs_with_company, jobs_without_company;
END $$;
