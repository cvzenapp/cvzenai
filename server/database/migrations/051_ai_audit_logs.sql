-- AI Audit Logs Migration
-- Tracks all interactions with external AI services (Groq, etc.)

CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service identification
  service_name VARCHAR(50) NOT NULL, -- 'groq', 'openai', etc.
  operation_type VARCHAR(100) NOT NULL, -- 'resume_parsing', 'ats_scoring', 'ats_improvement', 'job_description', 'job_search', 'ai_chat', etc.
  
  -- User context
  user_id UUID, -- NULL for guest operations
  user_type VARCHAR(20), -- 'job_seeker', 'recruiter', 'guest'
  
  -- Request details
  request_type VARCHAR(50), -- 'resume_parsing', 'text_generation', 'chat', etc.
  prompt_length INTEGER, -- Character count of prompt sent
  prompt_hash VARCHAR(64), -- SHA-256 hash of prompt for deduplication detection
  contains_pii BOOLEAN DEFAULT false, -- Flag if PII was detected/redacted
  pii_redacted BOOLEAN DEFAULT false, -- Flag if PII was redacted before sending
  
  -- Response details
  response_length INTEGER, -- Character count of response received
  response_status VARCHAR(20), -- 'success', 'error', 'timeout', 'rate_limited'
  error_message TEXT, -- Error details if failed
  
  -- Performance metrics
  latency_ms INTEGER, -- Response time in milliseconds
  tokens_used INTEGER, -- Tokens consumed (if available from API)
  cost_estimate DECIMAL(10, 6), -- Estimated cost in USD
  
  -- Privacy and compliance
  data_categories TEXT[], -- Array of data types: ['skills', 'experience', 'education', 'projects']
  redacted_fields TEXT[], -- Array of redacted fields: ['email', 'phone', 'name']
  
  -- Metadata
  ip_address VARCHAR(45), -- Client IP for audit trail
  user_agent TEXT, -- Client user agent
  session_id VARCHAR(255), -- Session identifier
  
  -- Related entities
  resume_id UUID, -- If related to a resume
  job_posting_id UUID, -- If related to a job posting
  application_id UUID, -- If related to an application
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_audit_logs_user_id ON ai_audit_logs(user_id);
CREATE INDEX idx_ai_audit_logs_operation_type ON ai_audit_logs(operation_type);
CREATE INDEX idx_ai_audit_logs_service_name ON ai_audit_logs(service_name);
CREATE INDEX idx_ai_audit_logs_created_at ON ai_audit_logs(created_at DESC);
CREATE INDEX idx_ai_audit_logs_resume_id ON ai_audit_logs(resume_id);
CREATE INDEX idx_ai_audit_logs_contains_pii ON ai_audit_logs(contains_pii);
CREATE INDEX idx_ai_audit_logs_response_status ON ai_audit_logs(response_status);

-- Composite index for common analytics queries
CREATE INDEX idx_ai_audit_logs_analytics ON ai_audit_logs(operation_type, response_status, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE ai_audit_logs IS 'Audit trail for all external AI service interactions';
COMMENT ON COLUMN ai_audit_logs.operation_type IS 'Type of operation: resume_parsing, ats_scoring, ats_improvement, job_description, job_search, ai_chat, section_improvement, resume_optimization';
COMMENT ON COLUMN ai_audit_logs.contains_pii IS 'Whether the request contained personally identifiable information';
COMMENT ON COLUMN ai_audit_logs.pii_redacted IS 'Whether PII was redacted before sending to AI service';
COMMENT ON COLUMN ai_audit_logs.data_categories IS 'Categories of data sent: skills, experience, education, projects, certifications, languages';
COMMENT ON COLUMN ai_audit_logs.redacted_fields IS 'Fields that were redacted: email, phone, name, linkedin, github, website';
