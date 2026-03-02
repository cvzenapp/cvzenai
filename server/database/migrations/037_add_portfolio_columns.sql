-- Add portfolio columns to recruiter_profiles table
ALTER TABLE recruiter_profiles 
ADD COLUMN IF NOT EXISTS clients JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS culture_values JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;