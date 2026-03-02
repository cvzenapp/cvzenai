-- Add enhanced sections to companies table
-- Team members, culture values, and testimonials

ALTER TABLE companies ADD COLUMN IF NOT EXISTS team_members TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS culture_values TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS testimonials TEXT;

-- Add comments for documentation
COMMENT ON COLUMN companies.team_members IS 'JSON array of team member objects with name, role, bio, photo, linkedin, email';
COMMENT ON COLUMN companies.culture_values IS 'JSON array of culture value objects with title, description, icon';
COMMENT ON COLUMN companies.testimonials IS 'JSON array of testimonial objects with name, role, company, content, photo, rating';
