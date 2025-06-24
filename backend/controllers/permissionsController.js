import pool from '../db.js';
import { getUserPermissions, checkPermission } from '../middleware/rbac.js';
import { PAGE_IDS } from '../config/pageMapping.js';

export const getAllPermissions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permissions ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const getPermissionsById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM permissions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching permission:', error);
    res.status(500).json({ error: 'Failed to fetch permission' });
  }
};

export const createPermissions = async (req, res) => {
  try {
    const { project_id, year, ministry, amount, valid_until } = req.body;
    const result = await pool.query(
      'INSERT INTO permissions (project_id, year, ministry, amount, valid_until) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [project_id, year, ministry, amount, valid_until]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating permission:', error);
    res.status(500).json({ error: 'Failed to create permission' });
  }
};

export const updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, year, ministry, amount, valid_until } = req.body;
    const result = await pool.query(
      'UPDATE permissions SET project_id = $1, year = $2, ministry = $3, amount = $4, valid_until = $5 WHERE id = $6 RETURNING *',
      [project_id, year, ministry, amount, valid_until, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating permission:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
};

export const deletePermissions = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM permissions WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting permission:', error);
    res.status(500).json({ error: 'Failed to delete permission' });
  }
};

// 🔐 RBAC: Permissions Management Controller
export const getCurrentUserPermissions = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const permissions = await getUserPermissions(req.user.user_id);
    
    res.json({
      user_id: req.user.user_id,
      tenant_id: tenantId,
      role: req.user.role,
      permissions: permissions
    });
    
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// שליפת כל התפקידים במערכת
export const getAllRoles = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    // בדיקת הרשאה לצפייה בתפקידים
    const canView = await checkPermission(
      req.user.user_id, 
      PAGE_IDS.ROLE_MANAGEMENT, 
      'view', 
      tenantId
    );
    
    if (!canView) {
      return res.status(403).json({ error: 'Access denied - Cannot view roles' });
    }

    const query = `
      SELECT role_id, role_name, role_description, created_at, updated_at
      FROM user_roles 
      ORDER BY role_name
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// שליפת כל הדפים במערכת
export const getAllPages = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    // בדיקת הרשאה לצפייה בדפים
    const canView = await checkPermission(
      req.user.user_id, 
      PAGE_IDS.PERMISSIONS, 
      'view', 
      tenantId
    );
    
    if (!canView) {
      return res.status(403).json({ error: 'Access denied - Cannot view pages' });
    }

    const query = `
      SELECT page_id, page_name, page_route, page_description, page_category
      FROM system_pages 
      ORDER BY page_category, page_name
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

// שליפת הרשאות לפי תפקיד
export const getPermissionsByRole = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    // בדיקת הרשאה לצפייה בהרשאות
    const canView = await checkPermission(
      req.user.user_id, 
      PAGE_IDS.PERMISSIONS, 
      'view', 
      tenantId
    );
    
    if (!canView) {
      return res.status(403).json({ error: 'Access denied - Cannot view permissions' });
    }

    const { roleId } = req.params;
    
    const query = `
      SELECT 
        p.permission_id,
        p.role_id,
        p.page_id,
        p.can_view,
        p.can_edit,
        p.can_create,
        p.can_delete,
        p.permission_level,
        sp.page_name,
        sp.page_route,
        sp.page_description,
        sp.page_category,
        ur.role_name
      FROM permissions p
      JOIN system_pages sp ON p.page_id = sp.page_id
      JOIN user_roles ur ON p.role_id = ur.role_id
      WHERE p.role_id = $1
      ORDER BY sp.page_category, sp.page_name
    `;
    
    const result = await pool.query(query, [roleId]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching permissions by role:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

// עדכון הרשאות לתפקיד
export const updateRolePermissions = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    // בדיקת הרשאה לעדכון הרשאות
    const canEdit = await checkPermission(
      req.user.user_id, 
      PAGE_IDS.PERMISSIONS, 
      'edit', 
      tenantId
    );
    
    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied - Cannot edit permissions' });
    }

    const { roleId } = req.params;
    const { permissions } = req.body;
    
    // התחלת טרנזקציה
    await pool.query('BEGIN');
    
    try {
      // מחיקת הרשאות קיימות
      await pool.query('DELETE FROM permissions WHERE role_id = $1', [roleId]);
      
      // הוספת הרשאות חדשות
      for (const perm of permissions) {
        const insertQuery = `
          INSERT INTO permissions (
            role_id, page_id, can_view, can_edit, can_create, can_delete, permission_level
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await pool.query(insertQuery, [
          roleId,
          perm.page_id,
          perm.can_view || false,
          perm.can_edit || false,
          perm.can_create || false,
          perm.can_delete || false,
          perm.permission_level || 'basic'
        ]);
      }
      
      await pool.query('COMMIT');
      
      // רישום פעולה לaudit log
      await logPermissionChange(req.user.user_id, roleId, 'update_permissions', req.ip);
      
      res.json({ message: 'Permissions updated successfully' });
      
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};

// יצירת תפקיד חדש
export const createRole = async (req, res) => {
  try {
    // 🔐 SECURITY: Get tenant_id from authenticated user only
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    // בדיקת הרשאה ליצירת תפקידים
    const canCreate = await checkPermission(
      req.user.user_id, 
      PAGE_IDS.ROLE_MANAGEMENT, 
      'create', 
      tenantId
    );
    
    if (!canCreate) {
      return res.status(403).json({ error: 'Access denied - Cannot create roles' });
    }

    const { role_name, role_description } = req.body;
    
    const query = `
      INSERT INTO user_roles (role_name, role_description)
      VALUES ($1, $2)
      RETURNING role_id, role_name, role_description, created_at
    `;
    
    const result = await pool.query(query, [role_name, role_description]);
    
    // רישום פעולה לaudit log
    await logPermissionChange(req.user.user_id, result.rows[0].role_id, 'create_role', req.ip);
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

// בדיקת הרשאה ספציפית
export const checkSpecificPermission = async (req, res) => {
  try {
    const { pageId, action } = req.params;
    const tenantId = req.user?.tenant_id;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - No tenant access' });
    }

    const hasPermission = await checkPermission(
      req.user.user_id,
      parseInt(pageId),
      action,
      tenantId
    );
    
    res.json({ 
      has_permission: hasPermission,
      user_id: req.user.user_id,
      page_id: pageId,
      action: action
    });
    
  } catch (error) {
    console.error('Error checking specific permission:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
};

// רישום שינויים בהרשאות לaudit log
const logPermissionChange = async (userId, roleId, actionType, ipAddress) => {
  try {
    const auditQuery = `
      INSERT INTO audit_log (
        user_id, action_type, resource_type, resource_id, 
        ip_address, details, status, created_at
      ) VALUES (
        $1, $2, 'role_permissions', $3, 
        $4, $5, 'success', NOW()
      )
    `;
    
    const details = JSON.stringify({
      role_id: roleId,
      action: actionType,
      timestamp: new Date().toISOString()
    });
    
    await pool.query(auditQuery, [
      userId, actionType, roleId, 
      ipAddress, details
    ]);
    
  } catch (error) {
    console.error('❌ Error logging permission change:', error);
  }
};
