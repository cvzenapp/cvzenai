-- Financial Reporting Migration
-- Adds tables for payment disputes, financial audit trail, and enhanced tax documents

-- Payment disputes table for handling payment-related disputes
CREATE TABLE payment_disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    dispute_type VARCHAR(50) NOT NULL, -- 'incorrect_amount', 'unauthorized_payment', 'duplicate_payment', 'other'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'rejected'
    description TEXT NOT NULL,
    evidence TEXT, -- JSON array of evidence documents
    resolution TEXT, -- JSON object with resolution details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES payout_transactions(transaction_id) ON DELETE CASCADE
);

-- Financial audit trail for compliance and tracking
CREATE TABLE financial_audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'tax_document_generated', 'dispute_created', 'dispute_resolved', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'referral', 'reward', 'payment', 'dispute', 'tax_document'
    entity_id INTEGER NOT NULL,
    old_values TEXT, -- JSON of old values before change
    new_values TEXT, -- JSON of new values after change
    metadata TEXT, -- JSON with additional context
    ip_address VARCHAR(45),
    user_agent TEXT,
    performed_by INTEGER NOT NULL, -- User ID who performed the action (0 for system)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Enhanced tax documents table with additional fields
ALTER TABLE tax_documents ADD COLUMN document_data TEXT; -- JSON with full tax document data
ALTER TABLE tax_documents ADD COLUMN recipient_tin VARCHAR(20); -- Tax Identification Number
ALTER TABLE tax_documents ADD COLUMN recipient_address TEXT;
ALTER TABLE tax_documents ADD COLUMN filing_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'filed', 'amended'
ALTER TABLE tax_documents ADD COLUMN filing_date DATE;
ALTER TABLE tax_documents ADD COLUMN amended_reason TEXT;

-- Compliance reporting configuration table
CREATE TABLE compliance_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general', -- 'tax', 'reporting', 'dispute', 'general'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Financial reporting schedules table
CREATE TABLE reporting_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type VARCHAR(50) NOT NULL, -- 'quarterly', 'annual', 'monthly'
    schedule_name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL, -- For scheduling automated reports
    recipients TEXT NOT NULL, -- JSON array of email recipients
    is_active BOOLEAN DEFAULT 1,
    last_run_at DATETIME,
    next_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add additional user fields for tax compliance
ALTER TABLE users ADD COLUMN tax_id VARCHAR(20); -- SSN or EIN
ALTER TABLE users ADD COLUMN address_line1 VARCHAR(255);
ALTER TABLE users ADD COLUMN address_line2 VARCHAR(255);
ALTER TABLE users ADD COLUMN city VARCHAR(100);
ALTER TABLE users ADD COLUMN state VARCHAR(50);
ALTER TABLE users ADD COLUMN zip_code VARCHAR(20);
ALTER TABLE users ADD COLUMN country VARCHAR(50) DEFAULT 'US';
ALTER TABLE users ADD COLUMN tax_exempt BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN w9_submitted BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN w9_submitted_at DATETIME;

-- Indexes for financial reporting performance
CREATE INDEX idx_payment_disputes_user ON payment_disputes(user_id, status);
CREATE INDEX idx_payment_disputes_transaction ON payment_disputes(transaction_id);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(status, created_at);
CREATE INDEX idx_payment_disputes_type ON payment_disputes(dispute_type, created_at);

CREATE INDEX idx_financial_audit_user ON financial_audit_trail(user_id, created_at);
CREATE INDEX idx_financial_audit_action ON financial_audit_trail(action, created_at);
CREATE INDEX idx_financial_audit_entity ON financial_audit_trail(entity_type, entity_id);
CREATE INDEX idx_financial_audit_performed_by ON financial_audit_trail(performed_by, created_at);

CREATE INDEX idx_tax_documents_user_year ON tax_documents(user_id, year);
CREATE INDEX idx_tax_documents_filing_status ON tax_documents(filing_status, created_at);
CREATE INDEX idx_tax_documents_amount ON tax_documents(total_amount, year);

CREATE INDEX idx_compliance_config_key ON compliance_config(config_key);
CREATE INDEX idx_compliance_config_category ON compliance_config(category, is_active);

CREATE INDEX idx_reporting_schedules_active ON reporting_schedules(is_active, next_run_at);
CREATE INDEX idx_reporting_schedules_type ON reporting_schedules(report_type, is_active);

CREATE INDEX idx_users_tax_info ON users(tax_id, w9_submitted);
CREATE INDEX idx_users_location ON users(country, state);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_payment_disputes_timestamp
    AFTER UPDATE ON payment_disputes
BEGIN
    UPDATE payment_disputes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_compliance_config_timestamp
    AFTER UPDATE ON compliance_config
BEGIN
    UPDATE compliance_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_reporting_schedules_timestamp
    AFTER UPDATE ON reporting_schedules
BEGIN
    UPDATE reporting_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insert default compliance configuration
INSERT OR IGNORE INTO compliance_config (config_key, config_value, description, category) VALUES
('tax_threshold_1099', '600.00', 'Minimum amount requiring 1099 form generation', 'tax'),
('dispute_resolution_sla_days', '30', 'Service level agreement for dispute resolution in days', 'dispute'),
('audit_retention_days', '2555', 'Number of days to retain audit trail records (7 years)', 'reporting'),
('quarterly_report_enabled', 'true', 'Enable automatic quarterly compliance reports', 'reporting'),
('annual_report_enabled', 'true', 'Enable automatic annual compliance reports', 'reporting'),
('dispute_auto_close_days', '90', 'Days after which unresolved disputes are auto-closed', 'dispute'),
('tax_document_retention_years', '7', 'Years to retain tax documents for compliance', 'tax'),
('compliance_notification_emails', '["compliance@cvzen.com", "finance@cvzen.com"]', 'Email addresses for compliance notifications', 'reporting');

-- Insert default reporting schedules
INSERT OR IGNORE INTO reporting_schedules (report_type, schedule_name, cron_expression, recipients) VALUES
('quarterly', 'Quarterly Compliance Report', '0 0 1 1,4,7,10 *', '["compliance@cvzen.com", "finance@cvzen.com"]'),
('annual', 'Annual Tax Compliance Report', '0 0 15 1 *', '["compliance@cvzen.com", "finance@cvzen.com", "legal@cvzen.com"]'),
('monthly', 'Monthly Financial Summary', '0 0 1 * *', '["finance@cvzen.com"]');