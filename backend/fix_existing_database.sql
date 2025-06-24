-- ==================================================
-- תיקון מסד הנתונים הקיים למערכת multi-tenant מאובטחת
-- ==================================================

-- 1. יצירת טבלת רשויות (tenants)
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. עדכון טבלת משתמשים הקיימת
-- הוספת עמודות חסרות לטבלת users הקיימת
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- הוספת מפתח זר לטבלת רשויות
ALTER TABLE users ADD CONSTRAINT fk_users_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);

-- 3. יצירת טבלת sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. הוספת רשות דמו
INSERT INTO tenants (name, status) VALUES ('רשות דמו', 'active')
ON CONFLICT DO NOTHING;

-- 5. עדכון משתמש דמו קיים או יצירת חדש
-- קודם נבדוק אם יש משתמש עם אימייל demo
DO $$
BEGIN
  -- עדכון משתמש קיים אם קיים
  IF EXISTS (SELECT 1 FROM users WHERE email = 'demo@demo.com') THEN
    UPDATE users SET 
      tenant_id = 1,
      password_hash = '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2',
      role = 'demo',
      status = 'active'
    WHERE email = 'demo@demo.com';
  ELSE
    -- יצירת משתמש חדש אם לא קיים
    INSERT INTO users (username, full_name, email, password, password_hash, tenant_id, role, status)
    VALUES (
      'demo', 
      'Demo User', 
      'demo@demo.com', 
      'temp', -- זמני לתואמות עם עמודת password הקיימת
      '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2',
      1, 
      'demo',
      'active'
    );
  END IF;
END $$;

-- 6. הוספת אינדקסים
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);

-- 7. עכשיו נוסיף tenant_id לכל הטבלאות הקיימות

-- טבלאות עיקריות
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE tabarim ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

-- טבלאות משניות
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE execution_reports ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE funding_sources ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

-- טבלאות תב"ר
ALTER TABLE tabar_items ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE tabar_transactions ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE tabar_permissions ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE tabar_funding ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;
ALTER TABLE tabar_documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

-- טבלאות נוספות (אם קיימות)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;

-- 8. עדכון כל הרשומות הקיימות לרשות דמו (tenant_id = 1)
UPDATE projects SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabarim SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE departments SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE budget_items SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE suppliers SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE orders SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE invoices SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE milestones SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE reports SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE execution_reports SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE documents SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE project_documents SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE comments SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE alerts SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE permissions SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE funding_sources SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabar_items SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabar_transactions SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabar_permissions SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabar_funding SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabar_documents SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE requests SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- 9. הוספת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabarim_tenant_id ON tabarim(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_tenant_id ON budget_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_milestones_tenant_id ON milestones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_execution_reports_tenant_id ON execution_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_tenant_id ON project_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_tenant_id ON comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_id ON permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_funding_sources_tenant_id ON funding_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabar_items_tenant_id ON tabar_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabar_transactions_tenant_id ON tabar_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabar_permissions_tenant_id ON tabar_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabar_funding_tenant_id ON tabar_funding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tabar_documents_tenant_id ON tabar_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requests_tenant_id ON requests(tenant_id);

-- 10. הוספת אילוצי NOT NULL (אחרי שכל הנתונים מעודכנים)
ALTER TABLE projects ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tabarim ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE departments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE budget_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE suppliers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE milestones ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE reports ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE execution_reports ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE project_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE comments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE alerts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE permissions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE funding_sources ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tabar_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tabar_transactions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tabar_permissions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tabar_funding ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tabar_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE requests ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;

-- 11. הוספת מפתחות זרים
ALTER TABLE projects ADD CONSTRAINT fk_projects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE tabarim ADD CONSTRAINT fk_tabarim_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);
ALTER TABLE departments ADD CONSTRAINT fk_departments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id);

-- סיום
SELECT 'Database successfully updated for multi-tenant security!' AS result;