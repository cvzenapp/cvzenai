-- Create resume_customizations table for PostgreSQL (UUID version)
CREATE TABLE IF NOT EXISTS resume_customizations (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  customization_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_resume_customization UNIQUE(resume_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_customizations_resume_id ON resume_customizations(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_customizations_user_id ON resume_customizations(user_id);

COMMENT ON TABLE resume_customizations IS 'Stores customization settings for individual resumes';
