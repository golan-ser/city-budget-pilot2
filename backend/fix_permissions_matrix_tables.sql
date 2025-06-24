-- ========================================
-- תיקון טבלאות מטריצת הרשאות
-- ========================================

-- יצירת טבלת roles אם לא קיימת
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- יצירת טבלת systems אם לא קיימת  
CREATE TABLE IF NOT EXISTS systems (
    system_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- יצירת טבלת system_pages אם לא קיימת
CREATE TABLE IF NOT EXISTS system_pages (
    page_id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(system_id),
    page_name VARCHAR(100) NOT NULL,
    page_path VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- יצירת טבלת permissions אם לא קיימת
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    tenant_id INTEGER,
    role_id INTEGER REFERENCES roles(role_id),
    page_id INTEGER REFERENCES system_pages(page_id),
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    permission_level VARCHAR(20) DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role_id, page_id)
);

-- יצירת טבלת tenant_systems אם לא קיימת
CREATE TABLE IF NOT EXISTS tenant_systems (
    tenant_id INTEGER,
    system_id INTEGER REFERENCES systems(system_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, system_id)
);

-- הכנסת נתונים בסיסיים
INSERT INTO roles (role_id, name, description) VALUES 
  (1, 'admin', 'מנהל מערכת עם הרשאות מלאות'),
  (2, 'user', 'משתמש רגיל'),
  (3, 'viewer', 'צופה בלבד'),
  (4, 'manager', 'מנהל רשות')
ON CONFLICT (role_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO systems (system_id, name, description, is_active) VALUES 
  (1, 'ניהול תקציב', 'מערכת ניהול תקציב עירוני', true),
  (2, 'ניהול פרויקטים', 'מערכת ניהול פרויקטים', true),
  (3, 'דוחות ואנליטיקה', 'מערכת דוחות ואנליטיקה', true)
ON CONFLICT (system_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

INSERT INTO system_pages (page_id, system_id, page_name, page_path, description, is_active, sort_order) VALUES 
  (1, 1, 'דשבורד', '/dashboard', 'דף הבית של המערכת', true, 1),
  (2, 1, 'פרויקטים', '/projects', 'ניהול פרויקטים', true, 2),
  (3, 1, 'תבריים', '/tabarim', 'ניהול תבריים', true, 3),
  (4, 1, 'דוחות', '/reports', 'דוחות ואנליטיקה', true, 4),
  (5, 1, 'ניהול מערכת', '/admin', 'ניהול מערכת ומשתמשים', true, 5),
  (6, 1, 'הרשאות', '/admin/permissions', 'ניהול הרשאות', true, 6),
  (7, 1, 'משתמשים', '/admin/users', 'ניהול משתמשים', true, 7),
  (8, 1, 'רשויות', '/admin/tenants', 'ניהול רשויות', true, 8)
ON CONFLICT (page_id) DO UPDATE SET
  page_name = EXCLUDED.page_name,
  page_path = EXCLUDED.page_path,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- הכנסת tenant_systems
INSERT INTO tenant_systems (tenant_id, system_id, is_active) VALUES 
  (1, 1, true),
  (2, 1, true),
  (3, 1, true)
ON CONFLICT (tenant_id, system_id) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- הכנסת הרשאות בסיס
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export, permission_level) VALUES 
  -- הרשאות admin (role_id = 1)
  (1, 1, 1, true, true, true, true, true, 'full'),
  (1, 1, 2, true, true, true, true, true, 'full'),
  (1, 1, 3, true, true, true, true, true, 'full'),
  (1, 1, 4, true, true, true, true, true, 'full'),
  (1, 1, 5, true, true, true, true, true, 'full'),
  (1, 1, 6, true, true, true, true, true, 'full'),
  (1, 1, 7, true, true, true, true, true, 'full'),
  (1, 1, 8, true, true, true, true, true, 'full'),
  -- הרשאות user (role_id = 2)
  (1, 2, 1, true, false, false, false, true, 'read'),
  (1, 2, 2, true, true, true, false, true, 'edit'),
  (1, 2, 3, true, true, true, false, true, 'edit'),
  (1, 2, 4, true, false, false, false, true, 'read'),
  -- הרשאות viewer (role_id = 3)
  (1, 3, 1, true, false, false, false, false, 'read'),
  (1, 3, 2, true, false, false, false, false, 'read'),
  (1, 3, 3, true, false, false, false, false, 'read'),
  (1, 3, 4, true, false, false, false, true, 'read'),
  -- הרשאות manager (role_id = 4)
  (1, 4, 1, true, true, true, false, true, 'edit'),
  (1, 4, 2, true, true, true, true, true, 'full'),
  (1, 4, 3, true, true, true, true, true, 'full'),
  (1, 4, 4, true, true, false, false, true, 'edit')
ON CONFLICT (tenant_id, role_id, page_id) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_export = EXCLUDED.can_export,
  permission_level = EXCLUDED.permission_level;

-- יצירת אינדקסים
CREATE INDEX IF NOT EXISTS idx_permissions_tenant_role ON permissions(tenant_id, role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role_page ON permissions(role_id, page_id);
CREATE INDEX IF NOT EXISTS idx_system_pages_system_id ON system_pages(system_id);
CREATE INDEX IF NOT EXISTS idx_tenant_systems_tenant ON tenant_systems(tenant_id);

-- הצגת סיכום
SELECT 
  'roles' as table_name,
  COUNT(*) as count
FROM roles
UNION ALL
SELECT 
  'systems' as table_name,
  COUNT(*) as count
FROM systems
UNION ALL
SELECT 
  'system_pages' as table_name,
  COUNT(*) as count
FROM system_pages
UNION ALL
SELECT 
  'permissions' as table_name,
  COUNT(*) as count
FROM permissions
UNION ALL
SELECT 
  'tenant_systems' as table_name,
  COUNT(*) as count
FROM tenant_systems; 