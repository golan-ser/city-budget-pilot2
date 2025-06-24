-- ========================================
-- תיקון כל הבעיות במסד הנתונים בבת אחת
-- ========================================

-- 1. וידוא שיש משתמשים בטבלה
INSERT INTO users (id, full_name, email, password_hash, role, role_id, tenant_id, status, created_at) 
VALUES 
  (1, 'מנהל ראשי', 'admin@example.com', '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2', 'admin', 1, 1, 'active', NOW()),
  (2, 'יעל כהן', 'yael@example.com', '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2', 'user', 2, 1, 'active', NOW()),
  (3, 'משתמש דמו', 'demo@demo.com', '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2', 'demo', 1, 1, 'active', NOW()),
  (7, 'מנהל מערכת', 'admin@demo.com', '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2', 'admin', 1, 1, 'active', NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  role_id = EXCLUDED.role_id,
  tenant_id = EXCLUDED.tenant_id,
  status = EXCLUDED.status;

-- 2. וידוא שיש רשויות
INSERT INTO tenants (tenant_id, name, status, created_at)
VALUES 
  (1, 'רשות דמו', 'active', NOW()),
  (2, 'רשות ירושלים', 'active', NOW()),
  (3, 'רשות תל אביב', 'active', NOW())
ON CONFLICT (tenant_id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- 3. וידוא שיש תפקידים
INSERT INTO roles (role_id, name, description)
VALUES 
  (1, 'admin', 'מנהל מערכת עם הרשאות מלאות'),
  (2, 'user', 'משתמש רגיל'),
  (3, 'viewer', 'צופה בלבד'),
  (4, 'manager', 'מנהל רשות')
ON CONFLICT (role_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4. וידוא שיש מערכות
INSERT INTO systems (system_id, name, description, is_active)
VALUES 
  (1, 'ניהול תקציב', 'מערכת ניהול תקציב עירוני', true)
ON CONFLICT (system_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 5. וידוא גישות רשויות למערכות
INSERT INTO tenant_systems (tenant_id, system_id, is_active, created_at)
VALUES 
  (1, 1, true, NOW()),
  (2, 1, true, NOW()),
  (3, 1, true, NOW())
ON CONFLICT (tenant_id, system_id) DO UPDATE SET
  is_active = EXCLUDED.is_active;

-- 6. וידוא שיש pages
INSERT INTO system_pages (page_id, system_id, page_name, page_path, description, is_active, sort_order)
VALUES 
  (1, 1, 'דשבורד', '/dashboard', 'דף הבית של המערכת', true, 1),
  (2, 1, 'פרויקטים', '/projects', 'ניהול פרויקטים', true, 2),
  (3, 1, 'תקציב', '/budget', 'ניהול תקציב', true, 3),
  (4, 1, 'דוחות', '/reports', 'דוחות ואנליטיקה', true, 4),
  (5, 1, 'ניהול', '/admin', 'ניהול מערכת', true, 5)
ON CONFLICT (page_id) DO UPDATE SET
  page_name = EXCLUDED.page_name,
  page_path = EXCLUDED.page_path,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 7. וידוא הרשאות בסיס
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export, permission_level)
VALUES 
  -- הרשאות admin
  (1, 1, 1, true, true, true, true, true, 'full'),
  (1, 1, 2, true, true, true, true, true, 'full'),
  (1, 1, 3, true, true, true, true, true, 'full'),
  (1, 1, 4, true, true, true, true, true, 'full'),
  (1, 1, 5, true, true, true, true, true, 'full'),
  -- הרשאות user
  (1, 2, 1, true, false, false, false, true, 'read'),
  (1, 2, 2, true, true, true, false, true, 'edit'),
  (1, 2, 3, true, false, true, false, true, 'edit'),
  (1, 2, 4, true, false, false, false, true, 'read')
ON CONFLICT (tenant_id, role_id, page_id) DO UPDATE SET
  can_view = EXCLUDED.can_view,
  can_create = EXCLUDED.can_create,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_export = EXCLUDED.can_export,
  permission_level = EXCLUDED.permission_level;

-- 8. עדכון מספר sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 9. יצירת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- הצגת סיכום
SELECT 
  'Users' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Tenants' as table_name,
  COUNT(*) as count
FROM tenants
UNION ALL
SELECT 
  'Roles' as table_name,
  COUNT(*) as count
FROM roles
UNION ALL
SELECT 
  'Permissions' as table_name,
  COUNT(*) as count
FROM permissions; 