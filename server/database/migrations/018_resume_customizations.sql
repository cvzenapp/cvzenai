-- Drop existing broken tables
DROP TABLE IF EXISTS customization_settings CASCADE;
DROP TABLE IF EXISTS template_customizations CASCADE;

-- Create simple customization table (per resume)
CREATE TABLE IF NOT EXISTS resume_customizations (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_resume_customization UNIQUE(resume_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_resume_customizations_resume_id ON resume_customizations(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_customizations_user_id ON resume_customizations(user_id);

-- Insert default settings for existing resumes
INSERT INTO resume_customizations (resume_id, user_id, settings)
SELECT r.id, r.user_id, '{
  "colors": {
    "primary": "#2563eb",
    "secondary": "#1e40af",
    "accent": "#3b82f6",
    "text": "#1f2937",
    "background": "#ffffff"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "fontSize": 14,
    "lineHeight": 1.6
  },
  "layout": {
    "spacing": "normal",
    "borderRadius": 8
  }
}'::jsonb
FROM resumes r
ON CONFLICT (resume_id) DO NOTHING;
