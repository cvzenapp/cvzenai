-- Add created_by field to companies table to track which recruiter created the company
-- This links to the recruiter_profiles.id (not user_id)

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES recruiter_profiles(id) ON DELETE SET NULL;

-- Add unique constraint to ensure one recruiter can only create one company
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_created_by_unique 
ON companies(created_by) 
WHERE created_by IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_created_by 
ON companies(created_by);

-- Add comment
COMMENT ON COLUMN companies.created_by IS 'Recruiter profile ID of the person who created this company';
