-- Token blacklist table for invalidating JWT tokens
-- Used when password is changed or user logs out from all devices

CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) NOT NULL, -- JWT ID (jti claim)
  reason VARCHAR(100), -- 'password_reset', 'logout_all', 'security'
  blacklisted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL -- When the token would have expired anyway
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Cleanup function to remove expired blacklisted tokens
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE token_blacklist IS 'Stores invalidated JWT tokens to prevent their use after password reset or logout';
COMMENT ON COLUMN token_blacklist.token_jti IS 'JWT ID (jti claim) - unique identifier for each token';
COMMENT ON COLUMN token_blacklist.reason IS 'Why the token was blacklisted: password_reset, logout_all, security';
