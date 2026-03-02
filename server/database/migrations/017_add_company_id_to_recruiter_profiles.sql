-- Add company_id to recruiter_profiles table to link recruiters to companies
-- This migration adds the foreign key relationship and migrates existing data

-- Step 0: Ensure companies table has all necessary columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS size_range VARCHAR(50);

-- Create slug index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Step 1: Add the company_id column (nullable initially for migration)
ALTER TABLE recruiter_profiles 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;

-- Step 2: Create or update companies based on existing recruiter_profiles data
-- For each unique company_name in recruiter_profiles, create a company if it doesn't exist
INSERT INTO companies (name, slug, website, logo, description, industry, size, location, created_at, updated_at)
SELECT DISTINCT 
  rp.company_name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(rp.company_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) as slug,
  rp.company_website,
  rp.company_logo,
  NULL as description,
  NULL as industry,
  NULL as size,
  NULL as location,
  NOW(),
  NOW()
FROM recruiter_profiles rp
WHERE rp.company_name IS NOT NULL 
  AND rp.company_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(rp.company_name))
  )
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Update recruiter_profiles to link to companies
UPDATE recruiter_profiles rp
SET company_id = c.id
FROM companies c
WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(rp.company_name))
  AND rp.company_name IS NOT NULL 
  AND rp.company_name != '';

-- Step 4: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_id ON recruiter_profiles(company_id);

-- Step 5: Add additional columns that might be needed
ALTER TABLE recruiter_profiles 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Step 6: Migrate position to job_title if job_title is empty
UPDATE recruiter_profiles 
SET job_title = position 
WHERE job_title IS NULL AND position IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN recruiter_profiles.company_id IS 'Foreign key to companies table';
COMMENT ON COLUMN recruiter_profiles.job_title IS 'Recruiter job title/position';
COMMENT ON COLUMN recruiter_profiles.phone IS 'Recruiter phone number';
COMMENT ON COLUMN recruiter_profiles.linkedin_url IS 'Recruiter LinkedIn profile URL';
