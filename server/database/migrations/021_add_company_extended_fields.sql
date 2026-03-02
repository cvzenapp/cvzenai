-- Add extended fields to companies table
-- These fields are used by the company profile feature

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS founded_year INTEGER;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS employee_count INTEGER;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_type VARCHAR(50);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS social_links JSONB;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS specialties TEXT[];

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS benefits TEXT[];

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS company_values TEXT;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS work_environment VARCHAR(50);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS assets JSONB;

-- Add comments
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.employee_count IS 'Number of employees';
COMMENT ON COLUMN companies.company_type IS 'Type of company (Startup, SME, Enterprise, etc.)';
COMMENT ON COLUMN companies.social_links IS 'JSON object with social media links';
COMMENT ON COLUMN companies.specialties IS 'Array of company specialties';
COMMENT ON COLUMN companies.benefits IS 'Array of employee benefits';
COMMENT ON COLUMN companies.company_values IS 'Company values and culture description';
COMMENT ON COLUMN companies.work_environment IS 'Work environment type (Remote, Hybrid, On-site)';
COMMENT ON COLUMN companies.assets IS 'JSON array of company assets (images, videos, documents)';
