-- Base Schema for CVZen PostgreSQL Database
-- This creates all the core tables needed for the application

-- Users table (for both job seekers and recruiters)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) DEFAULT 'job_seeker', -- 'job_seeker' or 'recruiter'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  personal_info JSONB,
  summary TEXT,
  objective TEXT,
  skills JSONB,
  experience JSONB,
  education JSONB,
  projects JSONB,
  template_id VARCHAR(100),
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Resume shares table
CREATE TABLE IF NOT EXISTS resume_shares (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  share_token VARCHAR(255) UNIQUE NOT NULL,
  template_id VARCHAR(100),
  template_category VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resume upvotes table
CREATE TABLE IF NOT EXISTS resume_upvotes (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resume_id, ip_address)
);

-- Recruiter profiles table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  company_website VARCHAR(255),
  company_logo TEXT,
  position VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Recruiter shortlists table
CREATE TABLE IF NOT EXISTS recruiter_shortlists (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  share_token VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  job_type VARCHAR(50),
  salary_range VARCHAR(100),
  description TEXT,
  requirements JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  logo TEXT,
  description TEXT,
  industry VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_email VARCHAR(255) NOT NULL,
  referee_name VARCHAR(255),
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template customizations table
CREATE TABLE IF NOT EXISTS template_customizations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INTEGER REFERENCES resumes(id) ON DELETE CASCADE,
  template_id VARCHAR(100) NOT NULL,
  customization_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_shares_token ON resume_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_resume_upvotes_resume_id ON resume_upvotes(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_upvotes_ip ON resume_upvotes(ip_address);
CREATE INDEX IF NOT EXISTS idx_recruiter_shortlists_recruiter ON recruiter_shortlists(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_shortlists_resume ON recruiter_shortlists(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);

-- Insert a default admin user (password: admin123)
INSERT INTO users (email, password_hash, user_type) 
VALUES ('admin@cvzen.com', '$2a$10$rQ8K8Z9Z9Z9Z9Z9Z9Z9Z9uXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX', 'job_seeker')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Stores all user accounts (job seekers and recruiters)';
COMMENT ON TABLE resumes IS 'Stores resume data for job seekers';
COMMENT ON TABLE resume_upvotes IS 'Tracks upvotes/likes on resumes';
COMMENT ON TABLE recruiter_shortlists IS 'Stores resumes shortlisted by recruiters';
