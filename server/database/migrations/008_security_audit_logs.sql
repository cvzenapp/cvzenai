-- Security and Audit Logs Migration
-- Creates tables for audit logging and security tracking

-- Audit logs table for tracking all referral-related activities
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(45), -- IPv6 compatible
    user_agent TEXT,
    metadata TEXT, -- JSON data
    severity VARCHAR(20) NOT NULL DEFAULT 'low', -- low, medium, high, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Security incidents table for tracking flagged activities
CREATE TABLE IF NOT EXISTS security_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    incident_type VARCHAR(50) NOT NULL, -- rate_limit, suspicious_activity, fraud_attempt
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata TEXT, -- JSON data with incident details
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, false_positive
    resolved_at TIMESTAMP,
    resolved_by INTEGER, -- admin user ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for security_incidents
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at);

-- Rate limiting tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ip_address VARCHAR(45),
    action VARCHAR(50) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rate_limit_tracking
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_window ON rate_limit_tracking(user_id, action, window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_window ON rate_limit_tracking(ip_address, action, window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_tracking(created_at);

-- Failed authentication attempts tracking
CREATE TABLE IF NOT EXISTS failed_auth_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempt_type VARCHAR(50) NOT NULL, -- login, token_validation, permission_check
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for failed_auth_attempts
CREATE INDEX IF NOT EXISTS idx_failed_auth_email ON failed_auth_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_auth_ip ON failed_auth_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_auth_created_at ON failed_auth_attempts(created_at);

-- Suspicious patterns tracking
CREATE TABLE IF NOT EXISTS suspicious_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern_type VARCHAR(50) NOT NULL, -- sequential_emails, rapid_creation, duplicate_data
    pattern_data TEXT NOT NULL, -- JSON with pattern details
    user_id INTEGER,
    ip_address VARCHAR(45),
    confidence_score INTEGER NOT NULL, -- 0-100
    status VARCHAR(20) DEFAULT 'detected', -- detected, investigating, confirmed, false_positive
    first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    occurrence_count INTEGER DEFAULT 1
);

-- Indexes for suspicious_patterns
CREATE INDEX IF NOT EXISTS idx_suspicious_patterns_type ON suspicious_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_suspicious_patterns_user ON suspicious_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_patterns_status ON suspicious_patterns(status);
CREATE INDEX IF NOT EXISTS idx_suspicious_patterns_confidence ON suspicious_patterns(confidence_score);

-- Add security-related columns to existing referrals table
ALTER TABLE referrals ADD COLUMN security_flags TEXT; -- JSON array of security flags
ALTER TABLE referrals ADD COLUMN risk_score INTEGER DEFAULT 0; -- 0-100 risk assessment
ALTER TABLE referrals ADD COLUMN requires_manual_review BOOLEAN DEFAULT FALSE;
ALTER TABLE referrals ADD COLUMN reviewed_by INTEGER; -- admin user ID who reviewed
ALTER TABLE referrals ADD COLUMN reviewed_at TIMESTAMP;

-- Add indexes for new security columns
CREATE INDEX IF NOT EXISTS idx_referrals_risk_score ON referrals(risk_score);
CREATE INDEX IF NOT EXISTS idx_referrals_manual_review ON referrals(requires_manual_review);

-- Add security-related columns to users table for role-based access control
ALTER TABLE users ADD COLUMN security_role VARCHAR(50) DEFAULT 'user'; -- user, moderator, admin, security_admin
ALTER TABLE users ADD COLUMN max_referrals_per_day INTEGER DEFAULT 10;
ALTER TABLE users ADD COLUMN max_referrals_per_hour INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN max_reward_amount DECIMAL(10,2) DEFAULT 100.00;
ALTER TABLE users ADD COLUMN account_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_failed_attempt TIMESTAMP;

-- Add indexes for user security columns
CREATE INDEX IF NOT EXISTS idx_users_security_role ON users(security_role);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked);

-- Create triggers for automatic audit logging
CREATE TRIGGER IF NOT EXISTS audit_referral_insert
    AFTER INSERT ON referrals
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, severity, created_at)
    VALUES (NEW.referrer_id, 'create_referral', 'referral', NEW.id, 'low', CURRENT_TIMESTAMP);
END;

CREATE TRIGGER IF NOT EXISTS audit_referral_update
    AFTER UPDATE ON referrals
    FOR EACH ROW
    WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        metadata, severity, created_at
    )
    VALUES (
        NEW.referrer_id, 'update_referral_status', 'referral', NEW.id,
        json_object('old_status', OLD.status, 'new_status', NEW.status),
        'low', CURRENT_TIMESTAMP
    );
END;

CREATE TRIGGER IF NOT EXISTS audit_reward_insert
    AFTER INSERT ON rewards
    FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, severity, created_at)
    VALUES (NEW.user_id, 'create_reward', 'reward', NEW.id, 'medium', CURRENT_TIMESTAMP);
END;

-- User role permissions table for additional permissions beyond base role
CREATE TABLE IF NOT EXISTS user_role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    permissions TEXT NOT NULL, -- JSON object with additional permissions
    granted_by INTEGER NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_role_permissions
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_user_id ON user_role_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_permissions_expires_at ON user_role_permissions(expires_at);

-- Role permission change logs
CREATE TABLE IF NOT EXISTS role_permission_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- grant_permissions, revoke_permissions, update_role, lock_account, unlock_account
    changed_by INTEGER NOT NULL,
    permissions TEXT, -- JSON data with permission details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for role_permission_logs
CREATE INDEX IF NOT EXISTS idx_role_permission_logs_user_id ON role_permission_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permission_logs_action ON role_permission_logs(action);
CREATE INDEX IF NOT EXISTS idx_role_permission_logs_created_at ON role_permission_logs(created_at);

-- Create view for security dashboard
CREATE VIEW IF NOT EXISTS security_dashboard AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_events,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events,
    COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_events,
    COUNT(CASE WHEN action = 'rate_limit_exceeded' THEN 1 END) as rate_limit_violations,
    COUNT(CASE WHEN action = 'suspicious_activity_detected' THEN 1 END) as suspicious_activities,
    COUNT(CASE WHEN action = 'token_validation_failed' THEN 1 END) as token_failures,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM audit_logs 
WHERE created_at >= date('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;