-- Admin Features Migration
-- Creates tables for referral program configuration and admin actions

-- Referral program configuration table
CREATE TABLE IF NOT EXISTS referral_program_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_by_user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

-- Admin actions log table
CREATE TABLE IF NOT EXISTS referral_admin_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER,
    admin_user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id),
    FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

-- Insert default configuration values
INSERT OR IGNORE INTO referral_program_config (config_key, config_value, description) VALUES
('default_reward_amount', '30.00', 'Default reward amount for successful referrals'),
('minimum_payout_threshold', '100.00', 'Minimum amount required before payout'),
('referral_expiry_days', '30', 'Number of days before referral expires'),
('max_referrals_per_day', '10', 'Maximum referrals per user per day'),
('high_value_threshold', '100.00', 'Reward amount requiring manual approval'),
('program_status', 'active', 'Current program status (active/paused)'),
('auto_approve_rewards', 'true', 'Automatically approve rewards below threshold'),
('fraud_detection_enabled', 'true', 'Enable fraud detection algorithms');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_program_config_key ON referral_program_config(config_key);
CREATE INDEX IF NOT EXISTS idx_referral_admin_actions_referral ON referral_admin_actions(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_admin_actions_admin ON referral_admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_admin_actions_type ON referral_admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_referral_admin_actions_created ON referral_admin_actions(created_at);

-- Add admin role to users table if it doesn't exist
-- This assumes the users table already exists
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- Create index on user role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);