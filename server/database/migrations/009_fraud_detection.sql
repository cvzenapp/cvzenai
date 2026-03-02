-- Fraud Detection and Prevention Migration
-- Creates tables for fraud detection, manual review, and IP tracking

-- Manual review cases table
CREATE TABLE IF NOT EXISTS manual_review_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    referral_id INTEGER,
    fraud_score DECIMAL(5,2) NOT NULL,
    patterns TEXT NOT NULL, -- JSON array of fraud patterns
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, investigating, approved, rejected, escalated
    assigned_to INTEGER, -- reviewer user ID
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- Indexes for manual_review_cases
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_user_id ON manual_review_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_status ON manual_review_cases(status);
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_fraud_score ON manual_review_cases(fraud_score);
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_created_at ON manual_review_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_review_cases_assigned_to ON manual_review_cases(assigned_to);

-- IP tracking table for geolocation and behavior analysis
CREATE TABLE IF NOT EXISTS ip_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    country_code VARCHAR(2),
    city VARCHAR(100),
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    is_suspicious BOOLEAN DEFAULT FALSE
);

-- Indexes for ip_tracking
CREATE INDEX IF NOT EXISTS idx_ip_tracking_user_id ON ip_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_ip_address ON ip_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_last_seen ON ip_tracking(last_seen);
CREATE INDEX IF NOT EXISTS idx_ip_tracking_suspicious ON ip_tracking(is_suspicious);

-- Unique constraint for user_id + ip_address combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_tracking_user_ip ON ip_tracking(user_id, ip_address);

-- Fraud patterns cache table for performance
CREATE TABLE IF NOT EXISTS fraud_patterns_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data TEXT NOT NULL, -- JSON with pattern details
    confidence_score INTEGER NOT NULL, -- 0-100
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes for fraud_patterns_cache
CREATE INDEX IF NOT EXISTS idx_fraud_patterns_cache_user_id ON fraud_patterns_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_patterns_cache_pattern_type ON fraud_patterns_cache(pattern_type);
CREATE INDEX IF NOT EXISTS idx_fraud_patterns_cache_expires_at ON fraud_patterns_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_fraud_patterns_cache_active ON fraud_patterns_cache(is_active);

-- Fraud detection rules table for configurable detection
CREATE TABLE IF NOT EXISTS fraud_detection_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50) NOT NULL, -- sequential_emails, rapid_creation, etc.
    threshold_value DECIMAL(10,2) NOT NULL,
    confidence_weight DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0
    is_enabled BOOLEAN DEFAULT TRUE,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fraud_detection_rules
CREATE INDEX IF NOT EXISTS idx_fraud_detection_rules_type ON fraud_detection_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_rules_enabled ON fraud_detection_rules(is_enabled);

-- Insert default fraud detection rules
INSERT OR IGNORE INTO fraud_detection_rules (rule_name, rule_type, threshold_value, confidence_weight, severity, description) VALUES
('Sequential Emails Threshold', 'sequential_emails', 3, 0.30, 'high', 'Minimum number of sequential emails to trigger detection'),
('Rapid Creation Hourly Limit', 'rapid_creation', 10, 0.25, 'medium', 'Maximum referrals per hour before flagging'),
('Duplicate Data Threshold', 'duplicate_data', 2, 0.20, 'medium', 'Minimum duplicate entries to trigger detection'),
('Fake Email Ratio Threshold', 'fake_emails', 0.3, 0.35, 'high', 'Minimum ratio of suspicious emails to trigger detection'),
('Bot Behavior IP Users', 'bot_behavior', 5, 0.40, 'high', 'Maximum users per IP before flagging as bot'),
('Suspicious Timing Intervals', 'suspicious_timing', 3, 0.15, 'medium', 'Minimum regular intervals to detect automation');

-- Whitelist table for trusted users/IPs
CREATE TABLE IF NOT EXISTS fraud_whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    whitelist_type VARCHAR(20) NOT NULL, -- user, ip, email_domain
    whitelist_value VARCHAR(255) NOT NULL,
    reason TEXT,
    added_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Indexes for fraud_whitelist
CREATE INDEX IF NOT EXISTS idx_fraud_whitelist_type ON fraud_whitelist(whitelist_type);
CREATE INDEX IF NOT EXISTS idx_fraud_whitelist_value ON fraud_whitelist(whitelist_value);
CREATE INDEX IF NOT EXISTS idx_fraud_whitelist_expires_at ON fraud_whitelist(expires_at);

-- Unique constraint for whitelist entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_fraud_whitelist_unique ON fraud_whitelist(whitelist_type, whitelist_value);

-- Machine learning features table for advanced detection
CREATE TABLE IF NOT EXISTS ml_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    feature_vector TEXT NOT NULL, -- JSON array of numerical features
    feature_names TEXT NOT NULL, -- JSON array of feature names
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(20) DEFAULT '1.0'
);

-- Indexes for ml_features
CREATE INDEX IF NOT EXISTS idx_ml_features_user_id ON ml_features(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_features_calculated_at ON ml_features(calculated_at);
CREATE INDEX IF NOT EXISTS idx_ml_features_model_version ON ml_features(model_version);

-- Fraud detection statistics view
CREATE VIEW IF NOT EXISTS fraud_detection_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_cases,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_cases,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_cases,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_cases,
    AVG(fraud_score) as avg_fraud_score,
    COUNT(CASE WHEN fraud_score >= 75 THEN 1 END) as high_risk_cases,
    COUNT(CASE WHEN fraud_score >= 90 THEN 1 END) as critical_risk_cases
FROM manual_review_cases 
WHERE created_at >= date('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Triggers for automatic fraud pattern detection
CREATE TRIGGER IF NOT EXISTS trigger_fraud_detection_on_referral
    AFTER INSERT ON referrals
    FOR EACH ROW
BEGIN
    -- Insert a job for fraud analysis (would be processed by background worker)
    INSERT INTO fraud_analysis_queue (user_id, referral_id, analysis_type, created_at)
    VALUES (NEW.referrer_id, NEW.id, 'new_referral', CURRENT_TIMESTAMP);
END;

-- Fraud analysis queue table for background processing
CREATE TABLE IF NOT EXISTS fraud_analysis_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    referral_id INTEGER,
    analysis_type VARCHAR(50) NOT NULL, -- new_referral, periodic_check, manual_trigger
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 5, -- 1-10, higher is more urgent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    error_message TEXT
);

-- Indexes for fraud_analysis_queue
CREATE INDEX IF NOT EXISTS idx_fraud_analysis_queue_status ON fraud_analysis_queue(status);
CREATE INDEX IF NOT EXISTS idx_fraud_analysis_queue_priority ON fraud_analysis_queue(priority);
CREATE INDEX IF NOT EXISTS idx_fraud_analysis_queue_created_at ON fraud_analysis_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_analysis_queue_user_id ON fraud_analysis_queue(user_id);

-- Fraud detection configuration table
CREATE TABLE IF NOT EXISTS fraud_detection_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT OR IGNORE INTO fraud_detection_config (config_key, config_value, config_type, description) VALUES
('fraud_detection_enabled', 'true', 'boolean', 'Enable/disable fraud detection system'),
('auto_block_critical_risk', 'true', 'boolean', 'Automatically block users with critical risk scores'),
('manual_review_threshold', '50', 'number', 'Fraud score threshold for manual review'),
('ml_model_enabled', 'false', 'boolean', 'Enable machine learning fraud detection'),
('notification_webhook_url', '', 'string', 'Webhook URL for fraud detection notifications'),
('max_daily_referrals_new_user', '5', 'number', 'Maximum daily referrals for new users'),
('suspicious_ip_check_enabled', 'true', 'boolean', 'Enable suspicious IP address checking');

-- Indexes for fraud_detection_config
CREATE INDEX IF NOT EXISTS idx_fraud_detection_config_key ON fraud_detection_config(config_key);