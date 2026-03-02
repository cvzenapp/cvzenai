-- Add certifications and languages columns to resumes table
-- Migration: 052_add_certifications_languages.sql

-- Add certifications column (JSONB array)
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add languages column (JSONB array)
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN resumes.certifications IS 'Array of certifications: [{name, issuer, date, url}]';
COMMENT ON COLUMN resumes.languages IS 'Array of languages: [{language, proficiency}]';
