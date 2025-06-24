-- Simple User Lock System

-- 1. Add user lock columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- 2. Create user unlock history table for audit
CREATE TABLE IF NOT EXISTS user_unlock_history (
    unlock_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    unlocked_by INTEGER REFERENCES users(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    previous_failed_attempts INTEGER,
    ip_address INET,
    user_agent TEXT,
    tenant_id INTEGER
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked) WHERE locked = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) WHERE failed_login_attempts > 0;
CREATE INDEX IF NOT EXISTS idx_unlock_history_user ON user_unlock_history(user_id);
CREATE INDEX IF NOT EXISTS idx_unlock_history_unlocked_by ON user_unlock_history(unlocked_by);

-- 4. Update existing users to have default lock values
UPDATE users SET 
    failed_login_attempts = 0,
    locked = FALSE
WHERE failed_login_attempts IS NULL OR locked IS NULL;

-- 5. Add system admin roles
INSERT INTO roles (role_name, description, is_system_role, tenant_id) VALUES 
('System Admin', 'Global system administrator with access to all authorities', true, NULL),
('Authority Admin', 'Authority system administrator', false, NULL)
ON CONFLICT DO NOTHING;

COMMIT; 