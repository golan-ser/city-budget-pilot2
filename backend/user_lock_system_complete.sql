-- Complete User Lock System with Authority Hierarchy

-- 1. Add user lock columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- 2. Update roles table to include system admin roles
INSERT INTO roles (role_name, description, is_system_role, tenant_id) VALUES 
('מנהל מערכת כללי', 'מנהל מערכת עם הרשאות על כל הרשויות', true, NULL),
('מנהל מערכת רשותי', 'מנהל מערכת ברשות ספציפית', false, NULL)
ON CONFLICT DO NOTHING;

-- 3. Create user unlock history table for audit
CREATE TABLE IF NOT EXISTS user_unlock_history (
    unlock_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    unlocked_by INTEGER REFERENCES users(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    previous_failed_attempts INTEGER,
    ip_address INET,
    user_agent TEXT,
    tenant_id INTEGER REFERENCES tenants(tenant_id)
);

-- 4. Create function to auto-create authority admin when tenant is created
CREATE OR REPLACE FUNCTION create_authority_admin() 
RETURNS TRIGGER AS $$
DECLARE
    admin_role_id INTEGER;
    admin_user_id INTEGER;
BEGIN
    -- Get the "מנהל מערכת רשותי" role ID
    SELECT role_id INTO admin_role_id 
    FROM roles 
    WHERE role_name = 'מנהל מערכת רשותי' AND is_system_role = false;
    
    -- If role doesn't exist, create it for this tenant
    IF admin_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, role_name, description, is_system_role) 
        VALUES (NEW.tenant_id, 'מנהל מערכת רשותי', 'מנהל מערכת של הרשות', false)
        RETURNING role_id INTO admin_role_id;
    END IF;
    
    -- Create default admin user for this tenant
    INSERT INTO users (
        username, 
        full_name, 
        email, 
        password_hash, 
        role_id, 
        tenant_id, 
        status,
        failed_login_attempts,
        locked
    ) VALUES (
        'admin_' || NEW.tenant_id,
        'מנהל מערכת - ' || NEW.name,
        'admin@' || LOWER(REPLACE(NEW.name, ' ', '')) || '.gov.il',
        '$2b$10$defaulthashedpassword', -- This should be changed on first login
        admin_role_id,
        NEW.tenant_id,
        'active',
        0,
        false
    ) RETURNING id INTO admin_user_id;
    
    -- Log the creation
    INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
    VALUES (NEW.tenant_id, admin_user_id, 'create', 'user', admin_user_id, 'Auto-created authority admin user', '127.0.0.1');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for auto-creating authority admin
DROP TRIGGER IF EXISTS trigger_create_authority_admin ON tenants;
CREATE TRIGGER trigger_create_authority_admin
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_authority_admin();

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked) WHERE locked = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts) WHERE failed_login_attempts > 0;
CREATE INDEX IF NOT EXISTS idx_unlock_history_user ON user_unlock_history(user_id);
CREATE INDEX IF NOT EXISTS idx_unlock_history_unlocked_by ON user_unlock_history(unlocked_by);

-- 7. Update existing users to have default lock values
UPDATE users SET 
    failed_login_attempts = 0,
    locked = FALSE
WHERE failed_login_attempts IS NULL OR locked IS NULL;

-- 8. Create view for locked users (for admin interface)
CREATE OR REPLACE VIEW locked_users_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    u.email,
    u.failed_login_attempts,
    u.locked_at,
    u.tenant_id,
    t.name as tenant_name,
    r.role_name,
    EXTRACT(EPOCH FROM (NOW() - u.locked_at))/3600 as hours_locked
FROM users u
JOIN tenants t ON u.tenant_id = t.tenant_id
JOIN roles r ON u.role_id = r.role_id
WHERE u.locked = TRUE
ORDER BY u.locked_at DESC;

COMMIT; 