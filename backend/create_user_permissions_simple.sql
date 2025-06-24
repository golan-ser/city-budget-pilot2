-- User-specific permissions system
-- Creates tables for individual user permissions management

-- 1. Permission templates (default permissions by role)
CREATE TABLE IF NOT EXISTS permission_templates (
    template_id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(role_id),
    page_id INTEGER REFERENCES system_pages(page_id),
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    permission_level VARCHAR(20) DEFAULT 'none',
    is_system_default BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, page_id, tenant_id)
);

-- 2. User-specific permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    user_permission_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    page_id INTEGER REFERENCES system_pages(page_id),
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    permission_level VARCHAR(20) DEFAULT 'none',
    is_custom BOOLEAN DEFAULT false,
    inherited_from_role INTEGER REFERENCES roles(role_id),
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_id)
);

-- 3. Custom roles per tenant
CREATE TABLE IF NOT EXISTS custom_roles (
    custom_role_id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    based_on_role_id INTEGER REFERENCES roles(role_id),
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role_name)
);

-- 4. Detailed permissions for future use
CREATE TABLE IF NOT EXISTS detailed_permissions (
    detailed_permission_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    permission_type VARCHAR(50),
    resource_id INTEGER,
    resource_type VARCHAR(50),
    permission_action VARCHAR(50),
    amount_limit DECIMAL(15,2),
    scope VARCHAR(50) DEFAULT 'department',
    conditions JSONB,
    granted_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Permissions audit log
CREATE TABLE IF NOT EXISTS permissions_audit_log (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    changed_by INTEGER REFERENCES users(id),
    change_type VARCHAR(50),
    permission_type VARCHAR(50),
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_page_id ON user_permissions(page_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_page ON user_permissions(user_id, page_id);
CREATE INDEX IF NOT EXISTS idx_permission_templates_role_tenant ON permission_templates(role_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_detailed_permissions_user_type ON detailed_permissions(user_id, permission_type);
CREATE INDEX IF NOT EXISTS idx_custom_roles_tenant ON custom_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_user ON permissions_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_changed_by ON permissions_audit_log(changed_by);

-- Migrate existing permissions to templates
INSERT INTO permission_templates (
    role_id, page_id, tenant_id, can_view, can_create, can_edit, can_delete, can_export,
    permission_level, is_system_default, created_by
)
SELECT 
    p.role_id, p.page_id, p.tenant_id, p.can_view, p.can_create, p.can_edit, p.can_delete, p.can_export,
    p.permission_level, true, 1
FROM permissions p
ON CONFLICT (role_id, page_id, tenant_id) DO UPDATE SET
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    permission_level = EXCLUDED.permission_level,
    updated_at = CURRENT_TIMESTAMP;

-- Create user-specific permissions for all existing users
INSERT INTO user_permissions (
    user_id, page_id, can_view, can_create, can_edit, can_delete, can_export,
    permission_level, is_custom, inherited_from_role, granted_by
)
SELECT 
    u.id, pt.page_id, pt.can_view, pt.can_create, pt.can_edit, pt.can_delete, pt.can_export,
    pt.permission_level, false, u.role_id, 1
FROM users u
JOIN permission_templates pt ON u.role_id = pt.role_id 
WHERE (pt.tenant_id = u.tenant_id OR pt.is_system_default = true)
ON CONFLICT (user_id, page_id) DO UPDATE SET
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    can_export = EXCLUDED.can_export,
    permission_level = EXCLUDED.permission_level,
    inherited_from_role = EXCLUDED.inherited_from_role,
    updated_at = CURRENT_TIMESTAMP;

-- Show summary
SELECT 
    'permission_templates' as table_name,
    COUNT(*) as count
FROM permission_templates
UNION ALL
SELECT 
    'user_permissions' as table_name,
    COUNT(*) as count
FROM user_permissions
UNION ALL
SELECT 
    'custom_roles' as table_name,
    COUNT(*) as count
FROM custom_roles; 