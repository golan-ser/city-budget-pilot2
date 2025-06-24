-- ========================================
-- מערכת הרשאות ברמת המשתמש הפרטני
-- ========================================

-- 1. טבלת תבניות הרשאות (ברירת מחדל לתפקידים)
CREATE TABLE IF NOT EXISTS permission_templates (
    template_id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(role_id),
    page_id INTEGER REFERENCES system_pages(page_id),
    tenant_id INTEGER REFERENCES tenants(tenant_id), -- אפשר תבניות שונות לרשויות שונות
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    permission_level VARCHAR(20) DEFAULT 'none',
    is_system_default BOOLEAN DEFAULT false, -- ברירת מחדל כללית
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, page_id, tenant_id)
);

-- 2. הרשאות ספציפיות למשתמש
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
    is_custom BOOLEAN DEFAULT false, -- האם שונה מברירת המחדל
    inherited_from_role INTEGER REFERENCES roles(role_id), -- מאיזה תפקיד זה הגיע
    granted_by INTEGER REFERENCES users(id), -- מי נתן את ההרשאה
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_id)
);

-- 3. תפקידים מותאמים לרשות (Authority Admin יכול ליצור)
CREATE TABLE IF NOT EXISTS custom_roles (
    custom_role_id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(tenant_id),
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    based_on_role_id INTEGER REFERENCES roles(role_id), -- מבוסס על תפקיד קיים
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role_name)
);

-- 4. הרשאות מפורטות עתידיות (רכש, תקציב וכו')
CREATE TABLE IF NOT EXISTS detailed_permissions (
    detailed_permission_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    permission_type VARCHAR(50), -- 'budget', 'procurement', 'projects'
    resource_id INTEGER, -- ID של הסעיף הספציפי
    resource_type VARCHAR(50), -- 'budget_item', 'project_category', 'supplier'
    permission_action VARCHAR(50), -- 'approve', 'create', 'view', 'edit'
    amount_limit DECIMAL(15,2), -- גבול סכום
    scope VARCHAR(50) DEFAULT 'department', -- 'department', 'authority', 'all'
    conditions JSONB, -- תנאים נוספים (JSON)
    granted_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP, -- תוקף זמני
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. לוג שינויי הרשאות (audit trail)
CREATE TABLE IF NOT EXISTS permissions_audit_log (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- למי שונו ההרשאות
    changed_by INTEGER REFERENCES users(id), -- מי שינה
    change_type VARCHAR(50), -- 'granted', 'revoked', 'modified'
    permission_type VARCHAR(50), -- 'page', 'detailed', 'role'
    old_value JSONB, -- הערך הקודם
    new_value JSONB, -- הערך החדש
    reason TEXT, -- סיבה לשינוי
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- אינדקסים לביצועים
-- ========================================

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_page_id ON user_permissions(page_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_page ON user_permissions(user_id, page_id);
CREATE INDEX IF NOT EXISTS idx_permission_templates_role_tenant ON permission_templates(role_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_detailed_permissions_user_type ON detailed_permissions(user_id, permission_type);
CREATE INDEX IF NOT EXISTS idx_custom_roles_tenant ON custom_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_user ON permissions_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_audit_changed_by ON permissions_audit_log(changed_by);

-- ========================================
-- פונקציות עזר
-- ========================================

-- פונקציה להעתקת הרשאות מתפקיד למשתמש חדש
CREATE OR REPLACE FUNCTION copy_role_permissions_to_user(
    p_user_id INTEGER,
    p_role_id INTEGER,
    p_tenant_id INTEGER,
    p_granted_by INTEGER
) RETURNS VOID AS $$
BEGIN
    -- העתקה מתבנית הרשאות
    INSERT INTO user_permissions (
        user_id, page_id, can_view, can_create, can_edit, can_delete, can_export,
        permission_level, is_custom, inherited_from_role, granted_by
    )
    SELECT 
        p_user_id, pt.page_id, pt.can_view, pt.can_create, pt.can_edit, 
        pt.can_delete, pt.can_export, pt.permission_level, 
        false, -- לא מותאם אישית
        p_role_id, p_granted_by
    FROM permission_templates pt
    WHERE pt.role_id = p_role_id 
    AND (pt.tenant_id = p_tenant_id OR pt.is_system_default = true)
    ON CONFLICT (user_id, page_id) DO UPDATE SET
        can_view = EXCLUDED.can_view,
        can_create = EXCLUDED.can_create,
        can_edit = EXCLUDED.can_edit,
        can_delete = EXCLUDED.can_delete,
        can_export = EXCLUDED.can_export,
        permission_level = EXCLUDED.permission_level,
        inherited_from_role = EXCLUDED.inherited_from_role,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לבדיקת הרשאה ספציפית למשתמש
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_page_id INTEGER,
    p_action VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    permission_exists BOOLEAN := false;
    can_perform BOOLEAN := false;
BEGIN
    -- בדיקה בהרשאות המשתמש הספציפיות
    SELECT 
        CASE 
            WHEN p_action = 'view' THEN up.can_view
            WHEN p_action = 'create' THEN up.can_create
            WHEN p_action = 'edit' THEN up.can_edit
            WHEN p_action = 'delete' THEN up.can_delete
            WHEN p_action = 'export' THEN up.can_export
            ELSE false
        END INTO can_perform
    FROM user_permissions up
    WHERE up.user_id = p_user_id AND up.page_id = p_page_id;
    
    -- אם לא נמצא, fallback לתפקיד
    IF NOT FOUND THEN
        SELECT 
            CASE 
                WHEN p_action = 'view' THEN pt.can_view
                WHEN p_action = 'create' THEN pt.can_create
                WHEN p_action = 'edit' THEN pt.can_edit
                WHEN p_action = 'delete' THEN pt.can_delete
                WHEN p_action = 'export' THEN pt.can_export
                ELSE false
            END INTO can_perform
        FROM permission_templates pt
        JOIN users u ON u.role_id = pt.role_id
        WHERE u.id = p_user_id AND pt.page_id = p_page_id
        AND (pt.tenant_id = u.tenant_id OR pt.is_system_default = true);
    END IF;
    
    RETURN COALESCE(can_perform, false);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- טריגרים
-- ========================================

-- טריגר לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permission_templates_updated_at
    BEFORE UPDATE ON permission_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- טריגר ליצירת audit log כשמשנים הרשאות
CREATE OR REPLACE FUNCTION log_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO permissions_audit_log (
            user_id, changed_by, change_type, permission_type, 
            old_value, new_value, ip_address
        ) VALUES (
            NEW.user_id, 
            COALESCE(NEW.granted_by, OLD.granted_by),
            'modified',
            'page',
            row_to_json(OLD),
            row_to_json(NEW),
            inet_client_addr()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO permissions_audit_log (
            user_id, changed_by, change_type, permission_type, 
            new_value, ip_address
        ) VALUES (
            NEW.user_id,
            NEW.granted_by,
            'granted',
            'page',
            row_to_json(NEW),
            inet_client_addr()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permissions_audit_log (
            user_id, changed_by, change_type, permission_type, 
            old_value, ip_address
        ) VALUES (
            OLD.user_id,
            OLD.granted_by,
            'revoked',
            'page',
            row_to_json(OLD),
            inet_client_addr()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_permissions_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION log_permission_changes(); 