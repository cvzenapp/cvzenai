-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'pro', 'starter', 'growth', 'scale', 'enterprise'
  display_name VARCHAR(100) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('candidate', 'recruiter')),
  price_monthly INTEGER NOT NULL DEFAULT 0, -- in paise/cents (₹149 = 14900)
  price_yearly INTEGER, -- optional yearly pricing
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}', -- usage limits
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  
  -- Dates
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  expires_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  
  -- Payment
  payment_method VARCHAR(50), -- 'razorpay', 'stripe', 'manual', etc.
  payment_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Company Subscriptions Table (for recruiters)
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id INTEGER NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  
  -- Dates
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP NOT NULL,
  cancelled_at TIMESTAMP,
  expires_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  
  -- Payment
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('user', 'company')),
  feature_key VARCHAR(100) NOT NULL, -- 'ai_screening', 'job_postings', 'resume_parsing', etc.
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(subscription_id, subscription_type, feature_key, period_start)
);

-- Subscription History/Audit Log
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('user', 'company')),
  action VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'cancelled', 'renewed', 'expired'
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID -- admin user who made the change
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_period_end ON company_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON subscription_usage(subscription_id, subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON subscription_history(subscription_id, subscription_type);

-- Insert default plans for candidates
INSERT INTO subscription_plans (name, display_name, user_type, price_monthly, features, limits) VALUES
('free', 'Free', 'candidate', 0, 
  '{"digital_cv": true, "shareable_link": true, "ats_score": true, "fake_job_detection": true, "guest_resume_parsing": true}'::jsonb,
  '{"resumes": 1, "templates": 3, "customization": "basic"}'::jsonb
),
('pro', 'Pro', 'candidate', 14900,
  '{"all_free_features": true, "ai_job_matching": true, "priority_visibility": true, "resume_optimization": true, "unlimited_customization": true}'::jsonb,
  '{"resumes": -1, "templates": -1, "customization": "unlimited"}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Insert default plans for recruiters
INSERT INTO subscription_plans (name, display_name, user_type, price_monthly, features, limits) VALUES
('starter', 'Starter', 'recruiter', 199900,
  '{"active_job_postings": true, "ai_candidate_screening": true, "ai_jd_generation": true, "bulk_application_management": true}'::jsonb,
  '{"job_postings": 5, "ai_screening_monthly": 100, "jd_generation_monthly": 20}'::jsonb
),
('growth', 'Growth', 'recruiter', 499900,
  '{"active_job_postings": true, "ai_candidate_screening": true, "unlimited_jd_generation": true, "analytics_dashboard": true, "bulk_batch_screening": true}'::jsonb,
  '{"job_postings": 25, "ai_screening_monthly": 500, "jd_generation_monthly": -1}'::jsonb
),
('scale', 'Scale', 'recruiter', 999900,
  '{"unlimited_job_postings": true, "unlimited_screening": true, "api_access_webhooks": true, "white_label_option": true, "priority_support": true}'::jsonb,
  '{"job_postings": -1, "ai_screening_monthly": -1, "jd_generation_monthly": -1}'::jsonb
),
('enterprise', 'Enterprise', 'recruiter', 0,
  '{"all_scale_features": true, "private_local_deployment": true, "custom_integrations": true, "sla_support": true, "dedicated_account_manager": true}'::jsonb,
  '{"job_postings": -1, "ai_screening_monthly": -1, "jd_generation_monthly": -1, "resume_parsing_monthly": -1}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Function to check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(sub_id UUID, sub_type VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  sub_status VARCHAR;
  sub_end TIMESTAMP;
BEGIN
  IF sub_type = 'user' THEN
    SELECT status, current_period_end INTO sub_status, sub_end
    FROM user_subscriptions WHERE id = sub_id;
  ELSE
    SELECT status, current_period_end INTO sub_status, sub_end
    FROM company_subscriptions WHERE id = sub_id;
  END IF;
  
  RETURN sub_status = 'active' AND sub_end > NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get current usage
CREATE OR REPLACE FUNCTION get_current_usage(sub_id UUID, sub_type VARCHAR, feature VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  SELECT COALESCE(usage_count, 0) INTO current_usage
  FROM subscription_usage
  WHERE subscription_id = sub_id
    AND subscription_type = sub_type
    AND feature_key = feature
    AND period_start <= NOW()
    AND period_end > NOW();
  
  RETURN COALESCE(current_usage, 0);
END;
$$ LANGUAGE plpgsql;
