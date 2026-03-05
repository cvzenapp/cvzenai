-- Job Preferences Migration
-- Creates table to store candidate job preferences

CREATE TABLE IF NOT EXISTS job_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    
    -- Work Type Preferences
    work_type VARCHAR(50)[] DEFAULT '{}', -- ['remote', 'hybrid', 'onsite']
    employment_type VARCHAR(50)[] DEFAULT '{}', -- ['full-time', 'part-time', 'contract', 'freelance']
    
    -- Location Preferences
    preferred_countries VARCHAR(100)[] DEFAULT '{}',
    preferred_states VARCHAR(100)[] DEFAULT '{}',
    preferred_cities VARCHAR(100)[] DEFAULT '{}',
    willing_to_relocate BOOLEAN DEFAULT false,
    
    -- Availability
    notice_period_days INTEGER DEFAULT 30,
    last_working_day DATE,
    immediate_availability BOOLEAN DEFAULT false,
    
    -- Interview Preferences
    interview_availability JSONB DEFAULT '{}', -- {days: [], timeSlots: [], timezone: ''}
    preferred_interview_mode VARCHAR(50)[] DEFAULT '{}', -- ['video', 'phone', 'in-person']
    
    -- Compensation
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    salary_negotiable BOOLEAN DEFAULT true,
    
    -- Additional Preferences
    industry_preferences VARCHAR(100)[] DEFAULT '{}',
    company_size_preference VARCHAR(50)[] DEFAULT '{}', -- ['startup', 'small', 'medium', 'large', 'enterprise']
    role_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_preferences_user_id ON job_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_job_preferences_work_type ON job_preferences USING GIN(work_type);
CREATE INDEX IF NOT EXISTS idx_job_preferences_countries ON job_preferences USING GIN(preferred_countries);
CREATE INDEX IF NOT EXISTS idx_job_preferences_states ON job_preferences USING GIN(preferred_states);
CREATE INDEX IF NOT EXISTS idx_job_preferences_salary ON job_preferences(expected_salary_min, expected_salary_max);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_preferences_updated_at
    BEFORE UPDATE ON job_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_job_preferences_updated_at();

-- Sample data commented out since user_id should be actual UUID from users table
-- INSERT INTO job_preferences (user_id, work_type, employment_type, preferred_countries, preferred_states, notice_period_days)
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', '{"remote", "hybrid"}', '{"full-time"}', '{"United States", "Canada"}', '{"California", "New York"}', 30);