-- Add missing columns to companies table for complete company profile functionality
-- This migration ensures all required columns exist for the company profile feature

-- Add basic company information columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS logo TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS size VARCHAR(50),
ADD COLUMN IF NOT EXISTS size_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS company_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_environment VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_values TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS specialties JSONB,
ADD COLUMN IF NOT EXISTS benefits JSONB,
ADD COLUMN IF NOT EXISTS assets JSONB,
ADD COLUMN IF NOT EXISTS clients JSONB,
ADD COLUMN IF NOT EXISTS projects JSONB,
ADD COLUMN IF NOT EXISTS awards JSONB,
ADD COLUMN IF NOT EXISTS achievements JSONB,
ADD COLUMN IF NOT EXISTS team_members JSONB,
ADD COLUMN IF NOT EXISTS culture_values JSONB,
ADD COLUMN IF NOT EXISTS testimonials JSONB;

-- Create unique index on slug if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Add timestamps if they don't exist
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Generate slugs for existing companies that don't have them
UPDATE companies 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

-- Initialize empty JSON fields for existing records
UPDATE companies 
SET 
  social_links = COALESCE(social_links, '{}'),
  specialties = COALESCE(specialties, '[]'),
  benefits = COALESCE(benefits, '[]'),
  assets = COALESCE(assets, '[]'),
  clients = COALESCE(clients, '[]'),
  projects = COALESCE(projects, '[]'),
  awards = COALESCE(awards, '[]'),
  achievements = COALESCE(achievements, '[]'),
  team_members = COALESCE(team_members, '[]'),
  culture_values = COALESCE(culture_values, '[]'),
  testimonials = COALESCE(testimonials, '[]')
WHERE social_links IS NULL 
   OR specialties IS NULL 
   OR benefits IS NULL 
   OR assets IS NULL 
   OR clients IS NULL 
   OR projects IS NULL 
   OR awards IS NULL 
   OR achievements IS NULL 
   OR team_members IS NULL 
   OR culture_values IS NULL 
   OR testimonials IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN companies.slug IS 'URL-friendly company identifier';
COMMENT ON COLUMN companies.logo IS 'Company logo image URL or base64 data';
COMMENT ON COLUMN companies.social_links IS 'JSON object with social media links';
COMMENT ON COLUMN companies.specialties IS 'JSON array of company specialties';
COMMENT ON COLUMN companies.benefits IS 'JSON array of employee benefits';
COMMENT ON COLUMN companies.company_values IS 'Company values and culture description';
COMMENT ON COLUMN companies.work_environment IS 'Work environment type (Remote, Hybrid, On-site)';
COMMENT ON COLUMN companies.assets IS 'JSON array of company assets (images, videos, documents)';
COMMENT ON COLUMN companies.clients IS 'JSON array of client information';
COMMENT ON COLUMN companies.projects IS 'JSON array of company projects';
COMMENT ON COLUMN companies.awards IS 'JSON array of company awards';
COMMENT ON COLUMN companies.achievements IS 'JSON array of company achievements';
COMMENT ON COLUMN companies.team_members IS 'JSON array of team member information';
COMMENT ON COLUMN companies.culture_values IS 'JSON array of company culture values';
COMMENT ON COLUMN companies.testimonials IS 'JSON array of client testimonials';