-- Add portfolio, clients, awards, and achievements fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS clients JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]';

-- Add comments for documentation
COMMENT ON COLUMN companies.clients IS 'JSON array of client logos and names: [{name, logo, description}]';
COMMENT ON COLUMN companies.projects IS 'JSON array of portfolio projects: [{title, description, image, technologies, link, date}]';
COMMENT ON COLUMN companies.awards IS 'JSON array of awards and recognitions: [{title, issuer, date, description, image}]';
COMMENT ON COLUMN companies.achievements IS 'JSON array of key achievements: [{title, description, metric, icon, date}]';
