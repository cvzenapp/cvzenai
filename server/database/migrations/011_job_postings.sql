-- Migration: Create job_postings table for recruiter dashboard
-- This allows recruiters to create and manage their job postings

CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    recruiter_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- full-time, part-time, contract, internship
    experience_level VARCHAR(50) NOT NULL, -- entry, mid, senior, executive
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    requirements TEXT, -- JSON array of requirements
    benefits TEXT, -- JSON array of benefits
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create job_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    resume_id INTEGER,
    status VARCHAR(50) DEFAULT 'applied', -- applied, reviewed, interview, rejected, hired
    cover_letter TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
    
    UNIQUE(job_id, user_id) -- Prevent duplicate applications
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_id, is_active);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id, applied_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_postings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_postings_timestamp
    BEFORE UPDATE ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_job_postings_timestamp();