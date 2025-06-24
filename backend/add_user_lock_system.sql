-- Add User Account Lock System columns to users table

-- Add failed login attempts counter
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

-- Add locked status
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;

-- Add locked timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- Add unlock history for audit purposes
CREATE TABLE IF NOT EXISTS user_unlock_history (
    unlock_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    unlocked_by INTEGER REFERENCES users(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    previous_failed_attempts INTEGER,
    ip_address INET,
    user_agent TEXT
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked) WHERE locked = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) WHERE failed_login_attempts > 0;

-- Update existing users to have default values
UPDATE users SET 
    failed_login_attempts = 0,
    locked = FALSE
WHERE failed_login_attempts IS NULL OR locked IS NULL;

COMMIT; 