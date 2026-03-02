-- Fix missing company_id in recruiter_profiles
-- This migration links existing recruiter profiles to their companies

-- For recruiter_profiles that have company_name but no company_id,
-- find or create the company and link it

DO $$
DECLARE
  rec RECORD;
  company_slug TEXT;
  existing_company_id INTEGER;
  new_company_id INTEGER;
BEGIN
  -- Loop through all recruiter_profiles without a company_id but with a company_name
  FOR rec IN 
    SELECT id, user_id, company_name, company_website
    FROM recruiter_profiles
    WHERE company_id IS NULL 
      AND company_name IS NOT NULL 
      AND company_name != ''
  LOOP
    -- Generate slug from company name
    company_slug := LOWER(REGEXP_REPLACE(rec.company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    company_slug := TRIM(BOTH '-' FROM company_slug);
    
    -- Check if company already exists
    SELECT id INTO existing_company_id
    FROM companies
    WHERE slug = company_slug
    LIMIT 1;
    
    IF existing_company_id IS NOT NULL THEN
      -- Use existing company
      UPDATE recruiter_profiles
      SET company_id = existing_company_id
      WHERE id = rec.id;
      
      RAISE NOTICE 'Linked recruiter profile % to existing company % (ID: %)', rec.id, rec.company_name, existing_company_id;
    ELSE
      -- Create new company
      INSERT INTO companies (name, slug, website, created_at, updated_at)
      VALUES (rec.company_name, company_slug, rec.company_website, NOW(), NOW())
      RETURNING id INTO new_company_id;
      
      -- Link recruiter profile to new company
      UPDATE recruiter_profiles
      SET company_id = new_company_id
      WHERE id = rec.id;
      
      RAISE NOTICE 'Created new company % (ID: %) and linked to recruiter profile %', rec.company_name, new_company_id, rec.id;
    END IF;
  END LOOP;
END $$;

-- Add index if not exists (should already exist from migration 017)
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_id ON recruiter_profiles(company_id);

-- Log completion
DO $$
DECLARE
  total_fixed INTEGER;
  total_without_company INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_fixed
  FROM recruiter_profiles
  WHERE company_id IS NOT NULL;
  
  SELECT COUNT(*) INTO total_without_company
  FROM recruiter_profiles
  WHERE company_id IS NULL;
  
  RAISE NOTICE 'Migration complete: % recruiter profiles have company_id, % still without', total_fixed, total_without_company;
END $$;
