-- Fix job_postings.company_id type mismatch
-- Change from UUID to INTEGER to match companies.id

-- Step 1: Drop the existing company_id column (it's likely empty or has invalid data)
ALTER TABLE job_postings DROP COLUMN IF EXISTS company_id;

-- Step 2: Add company_id as INTEGER with foreign key to companies table
ALTER TABLE job_postings 
ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN job_postings.company_id IS 'Foreign key to companies table (INTEGER type to match companies.id)';
