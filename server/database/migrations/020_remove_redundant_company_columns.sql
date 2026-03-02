-- Remove redundant company columns from recruiter_profiles
-- These columns are no longer needed since we have company_id linking to companies table

-- Drop company_name column (redundant - data is in companies table)
ALTER TABLE recruiter_profiles 
DROP COLUMN IF EXISTS company_name;

-- Drop company_website column (redundant - data is in companies table)
ALTER TABLE recruiter_profiles 
DROP COLUMN IF EXISTS company_website;

-- Drop position column if it exists (we use job_title instead)
ALTER TABLE recruiter_profiles 
DROP COLUMN IF EXISTS position;

-- Drop the old recruiters table (redundant - we use recruiter_profiles instead)
-- This table was from an older schema and is no longer used
DROP TABLE IF EXISTS recruiters;

-- Add comment to document the change
COMMENT ON TABLE recruiter_profiles IS 'Recruiter profile information. Company details are stored in companies table and linked via company_id.';
