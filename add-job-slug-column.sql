-- Add slug column to job_postings table for public URLs
ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON job_postings(slug);

-- Update existing job postings with generated slugs
UPDATE job_postings 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || id::text
WHERE slug IS NULL;