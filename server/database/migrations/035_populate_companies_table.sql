-- Migration to populate companies table from recruiter_profiles
-- This ensures proper normalization and avoids data redundancy

-- Step 1: Insert unique companies from recruiter_profiles into companies table
INSERT INTO companies (name, website, logo, description, created_at, updated_at)
SELECT DISTINCT 
  rp.company_name,
  rp.website,
  rp.logo_url,
  rp.description,
  NOW(),
  NOW()
FROM recruiter_profiles rp
WHERE rp.company_name IS NOT NULL 
  AND rp.company_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM companies c 
    WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(rp.company_name))
  );

-- Step 2: Add company_id column to recruiter_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recruiter_profiles' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE recruiter_profiles 
    ADD COLUMN company_id INTEGER REFERENCES companies(id);
  END IF;
END $$;

-- Step 3: Update recruiter_profiles with company_id from companies table
UPDATE recruiter_profiles rp
SET company_id = c.id
FROM companies c
WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(rp.company_name))
  AND rp.company_id IS NULL
  AND rp.company_name IS NOT NULL;

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_id 
ON recruiter_profiles(company_id);

-- Step 5: Report results
DO $$
DECLARE
  total_companies INTEGER;
  total_recruiters INTEGER;
  recruiters_with_company INTEGER;
  recruiters_without_company INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_companies FROM companies;
  SELECT COUNT(*) INTO total_recruiters FROM recruiter_profiles;
  SELECT COUNT(*) INTO recruiters_with_company FROM recruiter_profiles WHERE company_id IS NOT NULL;
  SELECT COUNT(*) INTO recruiters_without_company FROM recruiter_profiles WHERE company_id IS NULL;
  
  RAISE NOTICE '=== Companies Table Population Complete ===';
  RAISE NOTICE 'Total companies: %', total_companies;
  RAISE NOTICE 'Total recruiters: %', total_recruiters;
  RAISE NOTICE 'Recruiters with company_id: %', recruiters_with_company;
  RAISE NOTICE 'Recruiters without company_id: %', recruiters_without_company;
END $$;
