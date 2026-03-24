-- Migration: Add cached job search results table
-- This table stores Tavily search results per user to reduce API calls

CREATE TABLE IF NOT EXISTS cached_job_search_results (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_location TEXT,
    job_results JSONB NOT NULL, -- Store the full Tavily response
    total_results INTEGER DEFAULT 0,
    search_metadata JSONB DEFAULT '{}', -- Store search parameters, filters, etc.
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'), -- Cache expires after 7 days
    is_active BOOLEAN DEFAULT true
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cached_job_search_user_id ON cached_job_search_results(user_id);
CREATE INDEX IF NOT EXISTS idx_cached_job_search_active ON cached_job_search_results(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cached_job_search_expires ON cached_job_search_results(expires_at);

-- Unique constraint to ensure only one active cache per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_active_cache 
ON cached_job_search_results(user_id) 
WHERE is_active = true;

-- Comments
COMMENT ON TABLE cached_job_search_results IS 'Stores cached Tavily job search results per user to reduce API calls';
COMMENT ON COLUMN cached_job_search_results.job_results IS 'Full JSON response from Tavily API';
COMMENT ON COLUMN cached_job_search_results.expires_at IS 'Cache expiration time (default 7 days)';
COMMENT ON COLUMN cached_job_search_results.is_active IS 'Only one active cache per user allowed';

-- Function to automatically deactivate old caches when inserting new ones
CREATE OR REPLACE FUNCTION deactivate_old_job_caches()
RETURNS TRIGGER AS $$
BEGIN
    -- Deactivate any existing active caches for this user
    UPDATE cached_job_search_results 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id AND is_active = true AND id != NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically deactivate old caches
CREATE TRIGGER trigger_deactivate_old_job_caches
    AFTER INSERT ON cached_job_search_results
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_old_job_caches();

-- Function to clean up expired caches (can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_job_caches()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cached_job_search_results 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;