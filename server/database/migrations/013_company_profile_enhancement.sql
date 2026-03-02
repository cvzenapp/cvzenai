-- Add comprehensive company profile fields
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS company_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS benefits TEXT[],
ADD COLUMN IF NOT EXISTS company_values TEXT,
ADD COLUMN IF NOT EXISTS work_environment VARCHAR(50),
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(location);
CREATE INDEX IF NOT EXISTS idx_companies_size_range ON companies(size_range);

-- Add comments for documentation
COMMENT ON COLUMN companies.founded_year IS 'Year the company was founded';
COMMENT ON COLUMN companies.employee_count IS 'Current number of employees';
COMMENT ON COLUMN companies.company_type IS 'Type: Startup, SME, Enterprise, etc.';
COMMENT ON COLUMN companies.logo_url IS 'Company logo image URL or base64';
COMMENT ON COLUMN companies.social_links IS 'JSON object with social media links';
COMMENT ON COLUMN companies.specialties IS 'Array of company specialties/focus areas';
COMMENT ON COLUMN companies.benefits IS 'Array of employee benefits';
COMMENT ON COLUMN companies.company_values IS 'Company values and culture description';
COMMENT ON COLUMN companies.work_environment IS 'Remote, Hybrid, or On-site';
COMMENT ON COLUMN companies.assets IS 'JSON array of company assets (images, documents)';
