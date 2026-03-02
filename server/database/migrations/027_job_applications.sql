-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);