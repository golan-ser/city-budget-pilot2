-- Create basic admin tables for system management

-- Create tenants table if not exists
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create systems table if not exists
CREATE TABLE IF NOT EXISTS systems (
    system_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table if not exists (renamed from user_roles to avoid conflicts)
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table if not exists
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    role_id INTEGER REFERENCES roles(role_id),
    page_id INTEGER,
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    permission_level VARCHAR(50) DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for tenants
INSERT INTO tenants (name, status) VALUES 
('רשות דמו', 'active'),
('עיריית תל אביב', 'active'),
('עיריית ירושלים', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample data for systems
INSERT INTO systems (name, description, icon, is_active) VALUES 
('ניהול פרויקטים', 'מערכת לניהול פרויקטים עירוניים', 'FolderOpen', true),
('דוחות תקציב', 'מערכת לניהול דוחות תקציביים', 'BarChart3', true),
('ניהול תברים', 'מערכת לניהול תברי תקציב', 'FileText', true),
('מסמכים', 'מערכת לניהול מסמכים', 'File', true),
('אנליטיקה', 'מערכת לניתוח נתונים', 'TrendingUp', true)
ON CONFLICT DO NOTHING;

-- Insert sample roles
INSERT INTO roles (tenant_id, role_name, description, is_system_role) VALUES 
(1, 'מנהל רשות', 'מנהל עם הרשאות מלאות', false),
(1, 'עובד רשות', 'עובד עם הרשאות בסיסיות', false),
(NULL, 'מנהל מערכת', 'מנהל על עם גישה לכל המערכות', true)
ON CONFLICT DO NOTHING;

-- Insert sample permissions for tenant 1, role 1 (מנהל רשות)
INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_edit, can_create, can_delete, permission_level) VALUES 
(1, 1, 1, true, true, true, true, 'full'),
(1, 1, 3, true, true, true, false, 'high'),
(1, 1, 7, true, true, true, false, 'high'),
(1, 1, 10, true, true, true, false, 'high')
ON CONFLICT DO NOTHING;

-- Add role_id column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(role_id);

-- Update existing users to have role_id = 1 (מנהל רשות)
UPDATE users SET role_id = 1 WHERE role_id IS NULL;

COMMIT; 