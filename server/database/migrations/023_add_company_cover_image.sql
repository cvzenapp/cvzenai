-- Add cover image field to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_position VARCHAR(20) DEFAULT 'center';

-- Add comment for documentation
COMMENT ON COLUMN companies.cover_image_url IS 'Company cover/banner image URL or base64';
COMMENT ON COLUMN companies.cover_image_position IS 'Cover image position: top, center, bottom, or custom percentage';
