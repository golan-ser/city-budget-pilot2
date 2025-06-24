-- ==================================================
-- הוספת עמודת tenant_id לכל הטבלאות הקיימות
-- ==================================================

-- הוספת עמודת tenant_id לטבלאות עיקריות
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE tabarim ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;

-- הוספת עמודת tenant_id לטבלאות משניות
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE execution_reports ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE funding_sources ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;

-- הוספת עמודת tenant_id לטבלאות תב"ר
ALTER TABLE tabar_items ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE tabar_transactions ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE tabar_permissions ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE tabar_funding ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;
ALTER TABLE tabar_documents ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;

-- הוספת עמודת tenant_id לטבלאות נוספות (אם קיימות)
ALTER TABLE requests ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(tenant_id) DEFAULT 1;

-- עדכון כל הרשומות הקיימות לרשות דמו (tenant_id = 1)
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

-- הוספת אינדקסים לביצועים על עמודת tenant_id
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

-- הוספת אילוצי NOT NULL אחרי שהנתונים מעודכנים
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