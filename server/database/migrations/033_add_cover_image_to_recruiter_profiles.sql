-- Add cover image columns to recruiter_profiles table
ALTER TABLE recruiter_profiles 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_position VARCHAR(50) DEFAULT 'center';
