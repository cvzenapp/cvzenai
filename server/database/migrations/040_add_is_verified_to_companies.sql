-- Add is_verified column to companies table
-- This column indicates whether a company has been verified by admin

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add index for faster queries filtering by verified status
CREATE INDEX IF NOT EXISTS idx_companies_is_verified ON companies(is_verified);
