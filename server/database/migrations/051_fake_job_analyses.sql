-- Migration: Create fake_job_analyses table for tracking usage
-- This table stores all fake job detection analyses for analytics

CREATE TABLE IF NOT EXISTS fake_job_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User tracking (optional - null for anonymous users)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  
  -- Job posting data (truncated for privacy)
  job_title VARCHAR(500),
  job_description_snippet TEXT, -- First 500 chars only
  
  -- Analysis results
  is_fake BOOLEAN NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  red_flags_count INTEGER DEFAULT 0,
  red_flags JSONB, -- Array of red flag strings
  reasoning TEXT,
  
  -- Metadata
  analysis_duration_ms INTEGER, -- How long the analysis took
  model_version VARCHAR(50), -- Which AI model was used
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_fake_job_analyses_created_at ON fake_job_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_fake_job_analyses_user_id ON fake_job_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_fake_job_analyses_is_fake ON fake_job_analyses(is_fake);
CREATE INDEX IF NOT EXISTS idx_fake_job_analyses_risk_level ON fake_job_analyses(risk_level);
CREATE INDEX IF NOT EXISTS idx_fake_job_analyses_ip_address ON fake_job_analyses(ip_address);

-- Create a view for analytics
CREATE OR REPLACE VIEW fake_job_analysis_stats AS
SELECT 
  DATE(created_at) as analysis_date,
  COUNT(*) as total_analyses,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips,
  SUM(CASE WHEN is_fake THEN 1 ELSE 0 END) as fake_jobs_detected,
  SUM(CASE WHEN NOT is_fake THEN 1 ELSE 0 END) as legitimate_jobs,
  AVG(confidence_score) as avg_confidence,
  SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk_count,
  SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium_risk_count,
  SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low_risk_count,
  AVG(analysis_duration_ms) as avg_duration_ms
FROM fake_job_analyses
GROUP BY DATE(created_at)
ORDER BY analysis_date DESC;

-- Add comment
COMMENT ON TABLE fake_job_analyses IS 'Tracks all fake job detection analyses for usage statistics and analytics';
