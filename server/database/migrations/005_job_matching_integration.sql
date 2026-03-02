-- Job Matching Integration Migration
-- Adds tables and indexes for job matching and placement tracking integration

-- Referral job connections table
CREATE TABLE IF NOT EXISTS referral_job_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    job_id VARCHAR(255) NOT NULL,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    UNIQUE(referral_id, job_id)
);

-- Job matches table
CREATE TABLE IF NOT EXISTS job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(255) NOT NULL,
    candidate_id INTEGER NOT NULL,
    referral_id INTEGER,
    match_score DECIMAL(3,2) NOT NULL,
    match_reasons TEXT, -- JSON array
    status VARCHAR(20) DEFAULT 'potential', -- potential, applied, interviewed, hired, rejected
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL
);

-- Referral attributions table
CREATE TABLE IF NOT EXISTS referral_attributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    job_match_id VARCHAR(255) NOT NULL,
    placement_id VARCHAR(255),
    attribution_score DECIMAL(3,2) NOT NULL,
    attribution_reasons TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Placement confirmations table
CREATE TABLE IF NOT EXISTS placement_confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    placement_id VARCHAR(255) NOT NULL,
    attribution_score DECIMAL(3,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending_review, auto_approved, approved, rejected
    requires_manual_review BOOLEAN DEFAULT 0,
    reviewed_by_user_id INTEGER,
    reviewed_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Manual review queue table
CREATE TABLE IF NOT EXISTS manual_review_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    placement_id VARCHAR(255) NOT NULL,
    attribution_score DECIMAL(3,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_review, completed, cancelled
    assigned_to_user_id INTEGER,
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Job opportunities table (simplified for referral integration)
CREATE TABLE IF NOT EXISTS job_opportunities (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT, -- JSON array
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    location VARCHAR(255),
    remote BOOLEAN DEFAULT 0,
    type VARCHAR(20) DEFAULT 'full-time', -- full-time, part-time, contract, internship
    status VARCHAR(20) DEFAULT 'active', -- active, filled, expired, paused
    posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Placement records table
CREATE TABLE IF NOT EXISTS placement_records (
    id VARCHAR(255) PRIMARY KEY,
    candidate_id INTEGER NOT NULL,
    job_id VARCHAR(255) NOT NULL,
    referral_id INTEGER,
    hired_date DATETIME NOT NULL,
    start_date DATETIME,
    salary INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, started, ended, cancelled
    end_date DATETIME,
    end_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_opportunities(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_job_connections_referral ON referral_job_connections(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_job_connections_job ON referral_job_connections(job_id);

CREATE INDEX IF NOT EXISTS idx_job_matches_candidate ON job_matches(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_job_matches_job ON job_matches(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_matches_referral ON job_matches(referral_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_referral_attributions_referral ON referral_attributions(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_attributions_placement ON referral_attributions(placement_id);
CREATE INDEX IF NOT EXISTS idx_referral_attributions_score ON referral_attributions(attribution_score DESC);

CREATE INDEX IF NOT EXISTS idx_placement_confirmations_referral ON placement_confirmations(referral_id);
CREATE INDEX IF NOT EXISTS idx_placement_confirmations_status ON placement_confirmations(status, requires_manual_review);
CREATE INDEX IF NOT EXISTS idx_placement_confirmations_placement ON placement_confirmations(placement_id);

CREATE INDEX IF NOT EXISTS idx_manual_review_queue_status ON manual_review_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_manual_review_queue_assigned ON manual_review_queue(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_manual_review_queue_referral ON manual_review_queue(referral_id);

CREATE INDEX IF NOT EXISTS idx_job_opportunities_status ON job_opportunities(status, posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_company ON job_opportunities(company, status);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_location ON job_opportunities(location, remote);

CREATE INDEX IF NOT EXISTS idx_placement_records_candidate ON placement_records(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_placement_records_job ON placement_records(job_id, status);
CREATE INDEX IF NOT EXISTS idx_placement_records_referral ON placement_records(referral_id);
CREATE INDEX IF NOT EXISTS idx_placement_records_hired_date ON placement_records(hired_date DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_job_matches_timestamp
    AFTER UPDATE ON job_matches
BEGIN
    UPDATE job_matches SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_placement_confirmations_timestamp
    AFTER UPDATE ON placement_confirmations
BEGIN
    UPDATE placement_confirmations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_manual_review_queue_timestamp
    AFTER UPDATE ON manual_review_queue
BEGIN
    UPDATE manual_review_queue SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_job_opportunities_timestamp
    AFTER UPDATE ON job_opportunities
BEGIN
    UPDATE job_opportunities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_placement_records_timestamp
    AFTER UPDATE ON placement_records
BEGIN
    UPDATE placement_records SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;