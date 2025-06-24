-- Update system to include Tabar Management System

-- First, let's make sure we have the Tabar Management System
INSERT INTO systems (system_id, name, description, icon, is_active) VALUES 
(1, 'Tabar Management System', 'System for managing city budget items and projects', 'Calculator', true)
ON CONFLICT (system_id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active;

-- Update existing system_pages to work with our system
-- Clear existing pages first
DELETE FROM system_pages WHERE module_id = 1;

-- Insert pages for Tabar Management System using the existing structure
INSERT INTO system_pages (page_id, name, module_id, description) VALUES 
(25, 'System Admin', 1, 'System administration and permissions'),
(26, 'Tenants Management', 1, 'Manage tenants and authorities'),
(27, 'Users Management', 1, 'Manage users and roles'),
(28, 'Roles Management', 1, 'Manage roles and permissions'),
(29, 'Permissions Matrix', 1, 'View and edit permissions matrix'),
(30, 'Audit Log', 1, 'View system audit log'),
(31, 'Systems Management', 1, 'Manage systems and modules'),
(1, 'Dashboard', 1, 'Main dashboard'),
(2, 'Projects', 1, 'Project management'),
(3, 'Tabarim', 1, 'Budget items management'),
(4, 'Reports', 1, 'Reports center'),
(5, 'Project Details', 1, 'View project details'),
(6, 'Tabar Details', 1, 'View tabar details'),
(7, 'Budget Items Report', 1, 'Budget items report'),
(8, 'Full Tabar Report', 1, 'Full tabar report'),
(9, 'Tabar Budget Report', 1, 'Tabar budget report')
ON CONFLICT (page_id) DO UPDATE SET 
    name = EXCLUDED.name,
    module_id = EXCLUDED.module_id,
    description = EXCLUDED.description;

-- Now let's create a tenant_systems table to control which tenants have access to which systems
CREATE TABLE IF NOT EXISTS tenant_systems (
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    system_id INTEGER REFERENCES systems(system_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, system_id)
);

-- Give tenant 1 (Demo Authority) access to the Tabar Management System
INSERT INTO tenant_systems (tenant_id, system_id, is_active) VALUES 
(1, 1, true)
ON CONFLICT (tenant_id, system_id) DO UPDATE SET 
    is_active = EXCLUDED.is_active;

-- Make sure existing users have access to the system
-- Update existing permissions to ensure they reference the correct pages
DELETE FROM permissions WHERE tenant_id = 1;

-- Insert permissions for role 1 (Authority Manager) - full access
INSERT INTO permissions (tenant_id, role_id, page_id, system_page_id, can_view, can_edit, can_create, can_delete, can_export, permission_level) VALUES 
(1, 1, 1, 1, true, true, true, true, true, 'full'),
(1, 1, 2, 2, true, true, true, true, true, 'full'),
(1, 1, 3, 3, true, true, true, true, true, 'full'),
(1, 1, 4, 4, true, false, false, false, true, 'view'),
(1, 1, 5, 5, true, true, true, false, true, 'high'),
(1, 1, 6, 6, true, true, true, false, true, 'high'),
(1, 1, 7, 7, true, false, false, false, true, 'view'),
(1, 1, 8, 8, true, false, false, false, true, 'view'),
(1, 1, 9, 9, true, false, false, false, true, 'view'),
(1, 1, 25, 25, true, true, true, true, true, 'full'),
(1, 1, 26, 26, true, true, true, true, true, 'full'),
(1, 1, 27, 27, true, true, true, true, true, 'full'),
(1, 1, 28, 28, true, true, true, true, true, 'full'),
(1, 1, 29, 29, true, true, true, true, true, 'full'),
(1, 1, 30, 30, true, false, false, false, true, 'view'),
(1, 1, 31, 31, true, true, true, true, true, 'full');

-- Insert permissions for role 2 (Authority Employee) - limited access
INSERT INTO permissions (tenant_id, role_id, page_id, system_page_id, can_view, can_edit, can_create, can_delete, can_export, permission_level) VALUES 
(1, 2, 1, 1, true, false, false, false, false, 'view'),
(1, 2, 2, 2, true, true, false, false, false, 'edit'),
(1, 2, 3, 3, true, true, false, false, false, 'edit'),
(1, 2, 4, 4, true, false, false, false, false, 'view'),
(1, 2, 5, 5, true, false, false, false, false, 'view'),
(1, 2, 6, 6, true, false, false, false, false, 'view'),
(1, 2, 7, 7, true, false, false, false, false, 'view'),
(1, 2, 8, 8, true, false, false, false, false, 'view'),
(1, 2, 9, 9, true, false, false, false, false, 'view');

-- Insert permissions for role 3 (System Manager) - full access to everything
INSERT INTO permissions (tenant_id, role_id, page_id, system_page_id, can_view, can_edit, can_create, can_delete, can_export, permission_level) VALUES 
(NULL, 3, 1, 1, true, true, true, true, true, 'full'),
(NULL, 3, 2, 2, true, true, true, true, true, 'full'),
(NULL, 3, 3, 3, true, true, true, true, true, 'full'),
(NULL, 3, 4, 4, true, true, true, true, true, 'full'),
(NULL, 3, 5, 5, true, true, true, true, true, 'full'),
(NULL, 3, 6, 6, true, true, true, true, true, 'full'),
(NULL, 3, 7, 7, true, true, true, true, true, 'full'),
(NULL, 3, 8, 8, true, true, true, true, true, 'full'),
(NULL, 3, 9, 9, true, true, true, true, true, 'full'),
(NULL, 3, 25, 25, true, true, true, true, true, 'full'),
(NULL, 3, 26, 26, true, true, true, true, true, 'full'),
(NULL, 3, 27, 27, true, true, true, true, true, 'full'),
(NULL, 3, 28, 28, true, true, true, true, true, 'full'),
(NULL, 3, 29, 29, true, true, true, true, true, 'full'),
(NULL, 3, 30, 30, true, true, true, true, true, 'full'),
(NULL, 3, 31, 31, true, true, true, true, true, 'full');

COMMIT; 