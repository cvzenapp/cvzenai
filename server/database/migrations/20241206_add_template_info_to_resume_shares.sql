-- Migration: Add template and customization info to resume_shares table
-- This allows shared links to preserve the exact template and customization that was being viewed

-- Add columns for template and customization tracking
ALTER TABLE resume_shares 
ADD COLUMN template_id VARCHAR(255),
ADD COLUMN customization_id INTEGER;

-- Add foreign key constraints (optional, for data integrity)
-- Note: Uncomment these if you want strict referential integrity
-- ALTER TABLE resume_shares 
-- ADD CONSTRAINT fk_resume_shares_customization 
-- FOREIGN KEY (customization_id) REFERENCES template_customizations(id) ON DELETE SET NULL;

-- Create index for faster lookups by template
CREATE INDEX IF NOT EXISTS idx_resume_shares_template_id ON resume_shares(template_id);
CREATE INDEX IF NOT EXISTS idx_resume_shares_customization_id ON resume_shares(customization_id);

-- Update existing records to have NULL values (they will work with fallback logic)
-- No data update needed as new columns will default to NULL

-- Add comment explaining the new columns
COMMENT ON COLUMN resume_shares.template_id IS 'ID of the template being used when share link was created';
COMMENT ON COLUMN resume_shares.customization_id IS 'ID of the customization being used when share link was created';

-- Migration complete
SELECT 'Migration completed: Added template_id and customization_id to resume_shares table' as status;
