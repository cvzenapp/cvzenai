-- Payment Processing Migration
-- Adds tables for payment methods, payout transactions, and tax documents

-- Payment methods table for storing user payment information
CREATE TABLE payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'bank_account', 'debit_card'
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    last4 VARCHAR(4),
    bank_name VARCHAR(255),
    account_holder_name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payout transactions table for tracking all payment transactions
CREATE TABLE payout_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    payment_method_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_transfer_id VARCHAR(255),
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
    description TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

-- Tax documents table for 1099 forms and tax reporting
CREATE TABLE tax_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    document_type VARCHAR(10) NOT NULL, -- '1099-MISC', '1099-NEC'
    document_url TEXT, -- URL to the generated PDF document
    is_sent BOOLEAN DEFAULT 0,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, year) -- One document per user per year
);

-- Payment audit log for compliance and reconciliation
CREATE TABLE payment_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    transaction_id VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'payout_initiated', 'payout_completed', 'payout_failed', 'method_added', 'method_removed'
    details TEXT, -- JSON with additional details
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for payment processing performance
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id, is_active);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default, is_active);
CREATE INDEX idx_payment_methods_stripe ON payment_methods(stripe_payment_method_id);

CREATE INDEX idx_payout_transactions_user ON payout_transactions(user_id, status, created_at);
CREATE INDEX idx_payout_transactions_status ON payout_transactions(status, created_at);
CREATE INDEX idx_payout_transactions_stripe ON payout_transactions(stripe_transfer_id);
CREATE INDEX idx_payout_transactions_id ON payout_transactions(transaction_id);

CREATE INDEX idx_tax_documents_user ON tax_documents(user_id, year);
CREATE INDEX idx_tax_documents_year ON tax_documents(year, created_at);

CREATE INDEX idx_payment_audit_user ON payment_audit_log(user_id, created_at);
CREATE INDEX idx_payment_audit_transaction ON payment_audit_log(transaction_id, created_at);
CREATE INDEX idx_payment_audit_action ON payment_audit_log(action, created_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_payment_methods_timestamp
    AFTER UPDATE ON payment_methods
BEGIN
    UPDATE payment_methods SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_payout_transactions_timestamp
    AFTER UPDATE ON payout_transactions
BEGIN
    UPDATE payout_transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_tax_documents_timestamp
    AFTER UPDATE ON tax_documents
BEGIN
    UPDATE tax_documents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Add transaction_id column to rewards table to link with payout transactions
ALTER TABLE rewards ADD COLUMN payout_transaction_id INTEGER REFERENCES payout_transactions(id);

-- Create index for the new foreign key
CREATE INDEX idx_rewards_payout_transaction ON rewards(payout_transaction_id);