-- ==================================================
-- מערכת ניהול מערכת והרשאות מלאה (System & Permissions Admin)
-- ==================================================

-- 1. טבלת מערכות/מודולים (Systems/Modules)
CREATE TABLE IF NOT EXISTS systems (
  system_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. טבלת קישור רשויות למערכות (Tenant Systems)
CREATE TABLE IF NOT EXISTS tenant_systems (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  system_id INTEGER REFERENCES systems(system_id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, system_id)
);

-- 3. טבלת עמודים/מסכים במערכת (System Pages)
CREATE TABLE IF NOT EXISTS system_pages (
  page_id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(system_id) ON DELETE CASCADE,
  page_name VARCHAR(255) NOT NULL,
  page_route VARCHAR(255) NOT NULL,
  page_description TEXT,
  parent_page_id INTEGER REFERENCES system_pages(page_id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. טבלת תפקידים (Roles) - עדכון הטבלה הקיימת
CREATE TABLE IF NOT EXISTS roles (
  role_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  role_name VARCHAR(255) NOT NULL,
  role_description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- תפקידי מערכת (super_admin, admin)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, role_name)
);

-- 5. עדכון טבלת משתמשים - הוספת role_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(role_id);

-- 6. טבלת הרשאות מפורטת (Detailed Permissions)
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
  permission_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(role_id) ON DELETE CASCADE,
  page_id INTEGER REFERENCES system_pages(page_id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  custom_permissions JSONB, -- הרשאות מותאמות אישית
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, role_id, page_id)
);

-- 7. טבלת לוג שינויים (Audit Log)
CREATE TABLE IF NOT EXISTS audit_log (
  log_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  user_id INTEGER REFERENCES users(user_id),
  action_type VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  table_name VARCHAR(100),
  record_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_tenant_systems_tenant ON tenant_systems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_systems_system ON tenant_systems(system_id);
CREATE INDEX IF NOT EXISTS idx_system_pages_system ON system_pages(system_id);
CREATE INDEX IF NOT EXISTS idx_system_pages_parent ON system_pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_tenant ON permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_page ON permissions(page_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- ==================================================
-- נתוני דמו - מערכות בסיסיות
-- ==================================================

INSERT INTO systems (name, description, icon, is_active) VALUES 
('ניהול פרויקטים', 'ניהול פרויקטים עירוניים ותב"רים', 'FolderOpen', true),
('דוחות ואנליטיקה', 'מערכת דוחות מתקדמת ואנליטיקה', 'BarChart3', true),
('ניהול תקציבים', 'ניהול תקציבי העירייה', 'Calculator', true),
('ניהול מסמכים', 'מערכת ניהול מסמכים דיגיטלית', 'FileText', true),
('קולות קוראים', 'ניהול קולות קוראים ומכרזים', 'Megaphone', true),
('חינוך', 'מערכת ניהול חינוך עירוני', 'GraduationCap', true),
('רווחה', 'מערכת ניהול שירותי רווחה', 'Heart', true),
('תרבות וספורט', 'ניהול פעילויות תרבות וספורט', 'Music', true),
('איכות הסביבה', 'ניהול נושאי איכות סביבה', 'Leaf', true),
('ניהול מערכת', 'ניהול משתמשים והרשאות', 'Settings', true)
ON CONFLICT DO NOTHING;

-- ==================================================
-- נתוני דמו - עמודים למערכת ניהול פרויקטים
-- ==================================================

INSERT INTO system_pages (system_id, page_name, page_route, page_description, sort_order) VALUES 
-- מערכת ניהול פרויקטים (system_id = 1)
(1, 'דף הבית', '/dashboard', 'דף הבית הראשי של המערכת', 1),
(1, 'פרויקטים', '/projects', 'רשימת כל הפרויקטים', 2),
(1, 'פרטי פרויקט', '/projects/:id', 'עמוד פרטי פרויקט בודד', 3),
(1, 'תב"רים', '/tabarim', 'רשימת כל התב"רים', 4),
(1, 'פרטי תב"ר', '/tabarim/:id', 'עמוד פרטי תב"ר בודד', 5),
(1, 'מחלקות', '/departments', 'ניהול מחלקות העירייה', 6),

-- מערכת דוחות ואנליטיקה (system_id = 2)
(2, 'מרכז דוחות', '/reports', 'מרכז הדוחות הראשי', 1),
(2, 'דוח תקציבי', '/reports/budget', 'דוח תקציבי מפורט', 2),
(2, 'דוח ביצוע', '/reports/execution', 'דוח ביצוע פרויקטים', 3),
(2, 'אנליטיקה חכמה', '/analytics', 'כלי אנליטיקה מתקדמים', 4),
(2, 'דוח תב"ר מלא', '/reports/tabar-full', 'דוח תב"ר מפורט', 5),

-- מערכת ניהול תקציבים (system_id = 3)
(3, 'סקירת תקציב', '/budget/overview', 'סקירה כללית של התקציב', 1),
(3, 'סעיפי תקציב', '/budget/items', 'ניהול סעיפי תקציב', 2),
(3, 'תנועות כספיות', '/budget/transactions', 'רשימת תנועות כספיות', 3),
(3, 'ספקים', '/suppliers', 'ניהול ספקים', 4),

-- מערכת ניהול מסמכים (system_id = 4)
(4, 'ספריית מסמכים', '/documents', 'ספריית המסמכים הראשית', 1),
(4, 'העלאת מסמכים', '/documents/upload', 'העלאת מסמכים חדשים', 2),
(4, 'אישורים והרשאות', '/documents/approvals', 'מסמכי אישורים והרשאות', 3),

-- מערכת ניהול מערכת (system_id = 10)
(10, 'ניהול רשויות', '/admin/tenants', 'ניהול רשויות במערכת', 1),
(10, 'ניהול משתמשים', '/admin/users', 'ניהול משתמשי המערכת', 2),
(10, 'ניהול תפקידים', '/admin/roles', 'ניהול תפקידים והרשאות', 3),
(10, 'הרשאות מערכת', '/admin/permissions', 'ניהול הרשאות מפורט', 4),
(10, 'לוג מערכת', '/admin/audit', 'צפייה בלוג פעילות המערכת', 5)
ON CONFLICT DO NOTHING;

-- ==================================================
-- נתוני דמו - תפקידים בסיסיים
-- ==================================================

INSERT INTO roles (tenant_id, role_name, role_description, is_system_role, is_active) VALUES 
-- תפקידי מערכת גלובליים
(NULL, 'super_admin', 'מנהל על כללי של המערכת', true, true),
(NULL, 'system_admin', 'מנהל מערכת', true, true),

-- תפקידים לרשות דמו (tenant_id = 1)
(1, 'admin', 'מנהל רשות', false, true),
(1, 'manager', 'מנהל מחלקה', false, true),
(1, 'project_manager', 'מנהל פרויקטים', false, true),
(1, 'financial_manager', 'מנהל כספים', false, true),
(1, 'user', 'משתמש רגיל', false, true),
(1, 'viewer', 'צופה בלבד', false, true)
ON CONFLICT (tenant_id, role_name) DO NOTHING;

-- ==================================================
-- נתוני דמו - קישור מערכות לרשות
-- ==================================================

INSERT INTO tenant_systems (tenant_id, system_id, is_active) VALUES 
-- רשות דמו (tenant_id = 1) - כל המערכות
(1, 1, true), -- ניהול פרויקטים
(1, 2, true), -- דוחות ואנליטיקה
(1, 3, true), -- ניהול תקציבים
(1, 4, true), -- ניהול מסמכים
(1, 5, false), -- קולות קוראים - לא פעיל
(1, 6, true), -- חינוך
(1, 7, true), -- רווחה
(1, 8, false), -- תרבות וספורט - לא פעיל
(1, 9, true), -- איכות הסביבה
(1, 10, true) -- ניהול מערכת
ON CONFLICT (tenant_id, system_id) DO NOTHING;

-- ==================================================
-- נתוני דמו - הרשאות בסיסיות
-- ==================================================

-- הרשאות למנהל רשות (role_id = 3) - גישה מלאה לכל המערכות
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export) 
SELECT 1, 3, page_id, true, true, true, true, true
FROM system_pages 
WHERE system_id IN (SELECT system_id FROM tenant_systems WHERE tenant_id = 1 AND is_active = true)
ON CONFLICT (tenant_id, role_id, page_id) DO NOTHING;

-- הרשאות למנהל פרויקטים (role_id = 5) - גישה מלאה לפרויקטים ותב"רים
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export) 
SELECT 1, 5, page_id, true, true, true, false, true
FROM system_pages 
WHERE system_id = 1 -- מערכת ניהול פרויקטים
ON CONFLICT (tenant_id, role_id, page_id) DO NOTHING;

-- הרשאות למנהל כספים (role_id = 6) - גישה מלאה לתקציבים ודוחות
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export) 
SELECT 1, 6, page_id, true, true, true, false, true
FROM system_pages 
WHERE system_id IN (2, 3) -- דוחות ותקציבים
ON CONFLICT (tenant_id, role_id, page_id) DO NOTHING;

-- הרשאות למשתמש רגיל (role_id = 7) - צפייה ועריכה מוגבלת
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export) 
SELECT 1, 7, page_id, true, false, false, false, false
FROM system_pages 
WHERE system_id IN (1, 2, 4) -- פרויקטים, דוחות, מסמכים
ON CONFLICT (tenant_id, role_id, page_id) DO NOTHING;

-- הרשאות לצופה (role_id = 8) - צפייה בלבד
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export) 
SELECT 1, 8, page_id, true, false, false, false, false
FROM system_pages 
WHERE system_id IN (1, 2) -- פרויקטים ודוחות בלבד
ON CONFLICT (tenant_id, role_id, page_id) DO NOTHING;

-- עדכון משתמש הדמו לתפקיד מנהל רשות
UPDATE users SET role_id = 3 WHERE email = 'demo@demo.com';

-- ==================================================
-- פונקציות עזר
-- ==================================================

-- פונקציה לבדיקת הרשאה
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id INTEGER,
  p_page_route VARCHAR,
  p_action VARCHAR -- 'view', 'create', 'edit', 'delete', 'export'
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := false;
  user_tenant_id INTEGER;
  user_role_id INTEGER;
BEGIN
  -- שליפת פרטי המשתמש
  SELECT tenant_id, role_id INTO user_tenant_id, user_role_id
  FROM users WHERE user_id = p_user_id;
  
  -- בדיקת הרשאה
  SELECT 
    CASE p_action
      WHEN 'view' THEN p.can_view
      WHEN 'create' THEN p.can_create
      WHEN 'edit' THEN p.can_edit
      WHEN 'delete' THEN p.can_delete
      WHEN 'export' THEN p.can_export
      ELSE false
    END INTO has_permission
  FROM permissions p
  JOIN system_pages sp ON p.page_id = sp.page_id
  WHERE p.tenant_id = user_tenant_id 
    AND p.role_id = user_role_id
    AND sp.page_route = p_page_route;
    
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- פונקציה לשליפת הרשאות משתמש
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE (
  page_route VARCHAR,
  page_name VARCHAR,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  can_export BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.page_route,
    sp.page_name,
    p.can_view,
    p.can_create,
    p.can_edit,
    p.can_delete,
    p.can_export
  FROM permissions p
  JOIN system_pages sp ON p.page_id = sp.page_id
  JOIN users u ON p.tenant_id = u.tenant_id AND p.role_id = u.role_id
  WHERE u.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;