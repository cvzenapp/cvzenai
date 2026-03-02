-- Create customization_settings table for PostgreSQL
CREATE TABLE IF NOT EXISTS customization_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_customization UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customization_user_id ON customization_settings(user_id);
