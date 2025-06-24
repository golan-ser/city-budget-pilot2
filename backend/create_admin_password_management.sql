-- ==================================================
-- יצירת טבלאות לניהול סיסמאות על ידי מנהל מערכת
-- ==================================================

-- 1. יצירת טבלת היסטוריית איפוס סיסמאות
CREATE TABLE IF NOT EXISTS password_reset_history (
  reset_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  reset_by INTEGER REFERENCES users(user_id), -- המנהל שביצע את האיפוס
  reset_method VARCHAR(50) NOT NULL, -- admin_reset, admin_generate, self_reset
  reset_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_reset_by ON password_reset_history(reset_by);
CREATE INDEX IF NOT EXISTS idx_password_reset_tenant_id ON password_reset_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_date ON password_reset_history(reset_at);

-- 3. הוספת עמודות נדרשות לטבלת משתמשים (אם לא קיימות)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 4. יצירת trigger לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. חיבור הטריגר לטבלת users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. יצירת view למידע מנהלי מערכת
CREATE OR REPLACE VIEW admin_users_view AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.status,
    u.created_at,
    u.last_login,
    u.locked,
    u.failed_login_attempts,
    u.locked_at,
    r.name as role_name,
    t.name as tenant_name,
    COUNT(prh.reset_id) as password_resets_count,
    MAX(prh.reset_at) as last_password_reset
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
LEFT JOIN password_reset_history prh ON u.user_id = prh.user_id
GROUP BY u.user_id, u.full_name, u.email, u.status, u.created_at, u.last_login,
         u.locked, u.failed_login_attempts, u.locked_at, r.name, t.name
ORDER BY u.created_at DESC;

-- 7. הוספת הרשאות מנהל מערכת (אם קיימת טבלת permissions)
INSERT INTO permissions (permission_name, description, category) VALUES 
('admin.users.reset_password', 'איפוס סיסמאות משתמשים', 'admin'),
('admin.users.generate_password', 'יצירת סיסמאות אקראיות', 'admin'),
('admin.users.view_profile', 'צפייה בפרופיל משתמשים', 'admin'),
('admin.password_history.view', 'צפייה בהיסטוריית איפוס סיסמאות', 'admin')
ON CONFLICT (permission_name) DO NOTHING;

-- 8. יצירת view לדוח איפוס סיסמאות
CREATE OR REPLACE VIEW password_reset_report AS
SELECT 
    DATE(prh.reset_at) as reset_date,
    COUNT(*) as total_resets,
    COUNT(DISTINCT prh.user_id) as unique_users,
    COUNT(DISTINCT prh.reset_by) as unique_admins,
    prh.reset_method,
    t.name as tenant_name
FROM password_reset_history prh
LEFT JOIN tenants t ON prh.tenant_id = t.tenant_id
GROUP BY DATE(prh.reset_at), prh.reset_method, t.name
ORDER BY reset_date DESC;

COMMENT ON TABLE password_reset_history IS 'טבלת היסטוריית איפוס סיסמאות על ידי מנהלי מערכת';
COMMENT ON VIEW admin_users_view IS 'מבט כללי על משתמשים עבור מנהלי מערכת';
COMMENT ON VIEW password_reset_report IS 'דוח איפוס סיסמאות לפי תאריך ושיטה'; 