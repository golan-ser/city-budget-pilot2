-- Add Tabar Management System to systems table

-- Insert Tabar Management System
INSERT INTO systems (system_id, name, description, icon, is_active) VALUES 
(1, 'Tabar Management', 'System for managing city budget items', 'Calculator', true)
ON CONFLICT (system_id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active;

-- Create system_pages table if not exists
CREATE TABLE IF NOT EXISTS system_pages (
    page_id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(system_id),
    page_name VARCHAR(255) NOT NULL,
    page_path VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing pages for system 1 first
DELETE FROM system_pages WHERE system_id = 1;

-- Insert pages for Tabar Management System
INSERT INTO system_pages (system_id, page_name, page_path, description, icon, sort_order, is_active) VALUES 
(1, 'Home Page', '/', 'Main home page', 'Home', 1, true),
(1, 'Projects', '/projects', 'Project management', 'FolderOpen', 2, true),
(1, 'Tabarim', '/tabarim', 'Budget items management', 'FileText', 3, true),
(1, 'Project Details', '/projects/:id', 'View project details', 'Eye', 4, true),
(1, 'Tabar Details', '/tabarim/:id', 'View tabar details', 'FileSearch', 5, true),
(1, 'Reports', '/reports', 'Reports center', 'BarChart3', 6, true),
(1, 'Budget Items Report', '/reports/budget-items', 'Budget items report', 'Receipt', 7, true),
(1, 'Full Tabar Report', '/reports/full-tabar', 'Full tabar report', 'FileBarChart', 8, true),
(1, 'Tabar Budget Report', '/reports/tabar-budget', 'Tabar budget report', 'PieChart', 9, true),
(1, 'Dashboard', '/dashboard', 'Advanced dashboard', 'BarChart2', 10, true),
(1, 'System Admin', '/admin', 'System administration', 'Settings', 11, true);

-- Add can_export column to permissions table if not exists
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS can_export BOOLEAN DEFAULT false;

-- Update permissions table to reference system_pages
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS system_page_id INTEGER REFERENCES system_pages(page_id);

-- Clear existing permissions first
DELETE FROM permissions WHERE tenant_id = 1 OR tenant_id IS NULL;

-- Get the actual page_ids from system_pages
-- Insert default permissions for existing roles
-- For role 1 (Authority Manager) - full access to all pages
INSERT INTO permissions (tenant_id, role_id, page_id, system_page_id, can_view, can_edit, can_create, can_delete, can_export, permission_level) 
SELECT 1, 1, sp.page_id, sp.page_id, 
       CASE WHEN sp.page_path IN ('/reports', '/reports/budget-items', '/reports/full-tabar', '/reports/tabar-budget', '/dashboard') 
            THEN true ELSE true END,
       CASE WHEN sp.page_path IN ('/reports', '/reports/budget-items', '/reports/full-tabar', '/reports/tabar-budget', '/dashboard') 
            THEN false ELSE true END,
       CASE WHEN sp.page_path IN ('/reports', '/reports/budget-items', '/reports/full-tabar', '/reports/tabar-budget', '/dashboard') 
            THEN false ELSE true END,
       CASE WHEN sp.page_path IN ('/projects/:id', '/tabarim/:id', '/reports', '/reports/budget-items', '/reports/full-tabar', '/reports/tabar-budget', '/dashboard') 
            THEN false ELSE true END,
       true,
       CASE WHEN sp.page_path IN ('/reports', '/reports/budget-items', '/reports/full-tabar', '/reports/tabar-budget', '/dashboard') 
            THEN 'view' ELSE 'full' END
FROM system_pages sp WHERE sp.system_id = 1;

-- For role 2 (Authority Employee) - limited access
INSERT INTO permissions (tenant_id, role_id, page_id, system_page_id, can_view, can_edit, can_create, can_delete, can_export, permission_level) 
SELECT 1, 2, sp.page_id, sp.page_id, 
       true,
       CASE WHEN sp.page_path IN ('/', '/projects', '/tabarim') THEN true ELSE false END,
       false,
       false,
       false,
       CASE WHEN sp.page_path IN ('/', '/projects', '/tabarim') THEN 'edit' ELSE 'view' END
FROM system_pages sp WHERE sp.system_id = 1 AND sp.page_path NOT IN ('/admin');

-- For role 3 (System Manager) - full access to everything
INSERT INTO permissions (tenant_id, role_id, page_id, system_page_id, can_view, can_edit, can_create, can_delete, can_export, permission_level) 
SELECT NULL, 3, sp.page_id, sp.page_id, true, true, true, true, true, 'full'
FROM system_pages sp WHERE sp.system_id = 1;

COMMIT; 