-- יצירת טבלת לוג פעילות אם לא קיימת
CREATE TABLE IF NOT EXISTS audit_log (
    log_id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- יצירת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- הוספת נתוני דמו
INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, created_at) 
VALUES 
(1, 1, 'login', 'user', 1, 'התחברות למערכת', NOW() - INTERVAL '5 minutes'),
(1, 1, 'view', 'dashboard', 1, 'צפייה בדשבורד', NOW() - INTERVAL '3 minutes'),
(1, 1, 'update', 'permissions', 2, 'עדכון הרשאות משתמש', NOW() - INTERVAL '15 minutes'),
(1, 2, 'create', 'user', 3, 'יצירת משתמש חדש', NOW() - INTERVAL '1 hour'),
(1, 1, 'view', 'reports', 1, 'צפייה בדוחות', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- הודעת הצלחה
SELECT 'Audit log table created successfully' as result; 