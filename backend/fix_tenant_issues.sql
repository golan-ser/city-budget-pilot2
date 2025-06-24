-- תיקון בעיות tenant במסד הנתונים

-- 1. הוספת רשות דמו (עם אנגלית כדי לא להיכנס לבעיות encoding)
INSERT INTO tenants (tenant_id, name, status) 
VALUES (1, 'Demo Authority', 'active') 
ON CONFLICT (tenant_id) DO UPDATE SET name = 'Demo Authority';

-- 2. עדכון משתמש demo (אם קיים)
UPDATE users SET tenant_id = 1 WHERE email = 'demo@demo.com' OR username = 'demo';

-- 3. אם לא קיים משתמש demo, ניצר אחד
INSERT INTO users (username, full_name, email, password, password_hash, tenant_id, role, status)
SELECT 'demo', 'Demo User', 'demo@demo.com', 'temp', 
       '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2',
       1, 'demo', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@demo.com');

-- 4. עדכון כל הנתונים הקיימים לרשות דמו
UPDATE projects SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE tabarim SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE departments SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- בדיקה
SELECT 'Tenant created:' as status, name FROM tenants WHERE tenant_id = 1;
SELECT 'Demo user:' as status, email, role FROM users WHERE email = 'demo@demo.com';
SELECT 'Projects with tenant:' as status, COUNT(*) as count FROM projects WHERE tenant_id = 1; 