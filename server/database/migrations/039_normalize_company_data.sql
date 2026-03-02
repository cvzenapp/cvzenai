-- Normalize company data: Move company info from recruiter_profiles to companies table
-- This migration ensures proper data normalization and eliminates redundancy

-- Step 1: Ensure company_id column exists in recruiter_profiles
ALTER TABLE recruiter_profiles 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;

-- Step 2: For each recruiter_profile with company data but no company_id, create/link company
DO $$
DECLARE
  rec RECORD;
  existing_company_id INTEGER;
  new_company_id INTEGER;
BEGIN
  -- Loop through recruiter_profiles that have company data but no company_id
  FOR rec IN 
    SELECT id, user_id, company_name, website, logo_url, industry, location, 
           description, founded_year, employee_count, company_type, size_range,
           work_environment, company_values, social_links, specialties, benefits,
           cover_image_url, cover_image_position,
           clients, projects, awards, achievements, assets, team_members, 
           culture_values, testimonials
    FROM recruiter_profiles
    WHERE company_id IS NULL 
      AND company_name IS NOT NULL 
      AND company_name != ''
  LOOP
    -- Check if company already exists with this name
    SELECT id INTO existing_company_id
    FROM companies
    WHERE LOWER(name) = LOWER(rec.company_name)
    LIMIT 1;
    
    IF existing_company_id IS NOT NULL THEN
      -- Use existing company and update it with any missing data
      UPDATE companies
      SET 
        website = COALESCE(companies.website, rec.website),
        logo = COALESCE(companies.logo, rec.logo_url),
        industry = COALESCE(companies.industry, rec.industry),
        location = COALESCE(companies.location, rec.location),
        description = COALESCE(companies.description, rec.description),
        founded_year = COALESCE(companies.founded_year, rec.founded_year),
        employee_count = COALESCE(companies.employee_count, rec.employee_count),
        company_type = COALESCE(companies.company_type, rec.company_type),
        size_range = COALESCE(companies.size_range, rec.size_range),
        work_environment = COALESCE(companies.work_environment, rec.work_environment),
        company_values = COALESCE(companies.company_values, rec.company_values),
        social_links = COALESCE(companies.social_links, rec.social_links),
        specialties = COALESCE(companies.specialties, rec.specialties),
        benefits = COALESCE(companies.benefits, rec.benefits),
        cover_image_url = COALESCE(companies.cover_image_url, rec.cover_image_url),
        cover_image_position = COALESCE(companies.cover_image_position, rec.cover_image_position),
        clients = COALESCE(companies.clients, rec.clients),
        projects = COALESCE(companies.projects, rec.projects),
        awards = COALESCE(companies.awards, rec.awards),
        achievements = COALESCE(companies.achievements, rec.achievements),
        assets = COALESCE(companies.assets, rec.assets),
        team_members = COALESCE(companies.team_members, rec.team_members),
        culture_values = COALESCE(companies.culture_values, rec.culture_values),
        testimonials = COALESCE(companies.testimonials, rec.testimonials),
        updated_at = NOW()
      WHERE id = existing_company_id;
      
      -- Link recruiter profile to existing company
      UPDATE recruiter_profiles
      SET company_id = existing_company_id
      WHERE id = rec.id;
      
      RAISE NOTICE 'Linked recruiter % to existing company % (ID: %)', rec.user_id, rec.company_name, existing_company_id;
    ELSE
      -- Create new company with all data from recruiter_profile
      INSERT INTO companies (
        name, slug, website, logo, industry, location, description,
        founded_year, employee_count, company_type, size_range, work_environment,
        company_values, social_links, specialties, benefits,
        cover_image_url, cover_image_position,
        clients, projects, awards, achievements, assets, team_members,
        culture_values, testimonials,
        created_at, updated_at
      ) VALUES (
        rec.company_name,
        LOWER(REGEXP_REPLACE(rec.company_name, '[^a-zA-Z0-9]+', '-', 'g')),
        rec.website,
        rec.logo_url,
        rec.industry,
        rec.location,
        rec.description,
        rec.founded_year,
        rec.employee_count,
        rec.company_type,
        rec.size_range,
        rec.work_environment,
        rec.company_values,
        rec.social_links,
        rec.specialties,
        rec.benefits,
        rec.cover_image_url,
        rec.cover_image_position,
        rec.clients,
        rec.projects,
        rec.awards,
        rec.achievements,
        rec.assets,
        rec.team_members,
        rec.culture_values,
        rec.testimonials,
        NOW(),
        NOW()
      )
      RETURNING id INTO new_company_id;
      
      -- Link recruiter profile to new company
      UPDATE recruiter_profiles
      SET company_id = new_company_id
      WHERE id = rec.id;
      
      RAISE NOTICE 'Created new company % (ID: %) for recruiter %', rec.company_name, new_company_id, rec.user_id;
    END IF;
  END LOOP;
END $$;

-- Step 3: Ensure companies table has all necessary columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS logo VARCHAR(255),
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS company_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS size_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_environment VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_values TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS specialties JSONB,
ADD COLUMN IF NOT EXISTS benefits JSONB,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_position VARCHAR(50) DEFAULT 'center',
ADD COLUMN IF NOT EXISTS clients JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS culture_values JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_id ON recruiter_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Step 5: Add unique constraint on company slug
DO $$
BEGIN
  -- First, ensure all slugs are unique by appending numbers to duplicates
  WITH duplicates AS (
    SELECT slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) as rn
    FROM companies
    WHERE slug IS NOT NULL
  )
  UPDATE companies c
  SET slug = c.slug || '-' || d.rn
  FROM duplicates d
  WHERE c.slug = d.slug AND d.rn > 1;
  
  -- Now add the unique constraint
  ALTER TABLE companies ADD CONSTRAINT companies_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Unique constraint on companies.slug already exists';
END $$;

-- Step 6: Report migration results
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
  
  RAISE NOTICE '=== Company Data Normalization Complete ===';
  RAISE NOTICE 'Total companies: %', total_companies;
  RAISE NOTICE 'Total recruiters: %', total_recruiters;
  RAISE NOTICE 'Recruiters linked to companies: %', recruiters_with_company;
  RAISE NOTICE 'Recruiters without companies: %', recruiters_without_company;
  RAISE NOTICE '==========================================';
END $$;

-- Add comments for documentation
COMMENT ON COLUMN recruiter_profiles.company_id IS 'Foreign key to companies table - normalized company data';
COMMENT ON TABLE companies IS 'Normalized company data - single source of truth for all company information';
