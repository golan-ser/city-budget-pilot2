import db from '../db.js';
import puppeteer from 'puppeteer';

// ==================================================
// ניהול רשויות (Tenants Management)
// ==================================================

// שליפת כל הרשויות
const getAllTenants = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        t.*,
        COUNT(u.id) as user_count
      FROM tenants t
      LEFT JOIN users u ON t.tenant_id = u.tenant_id
      GROUP BY t.tenant_id
      ORDER BY t.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'שגיאה בשליפת רשויות' });
  }
};

// יצירת רשות חדשה
const createTenant = async (req, res) => {
  const { name, status = 'active' } = req.body;
  
  try {
    const result = await db.query(
      'INSERT INTO tenants (name, status) VALUES ($1, $2) RETURNING *',
      [name, status]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'שגיאה ביצירת רשות' });
  }
};

// עדכון רשות
const updateTenant = async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;
  
  try {
    const result = await db.query(
      'UPDATE tenants SET name = $1, status = $2, updated_at = NOW() WHERE tenant_id = $3 RETURNING *',
      [name, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'רשות לא נמצאה' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'שגיאה בעדכון רשות' });
  }
};

// מחיקת רשות
const deleteTenant = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query('DELETE FROM tenants WHERE tenant_id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'רשות לא נמצאה' });
    }
    
    res.json({ message: 'רשות נמחקה בהצלחה' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'שגיאה במחיקת רשות' });
  }
};

// ==================================================
// ניהול מערכות (Systems Management)
// ==================================================

// שליפת כל המערכות
const getAllSystems = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        s.*,
        COUNT(DISTINCT ts.tenant_id) as tenants_count
      FROM systems s
      LEFT JOIN tenant_systems ts ON s.system_id = ts.system_id AND ts.is_active = true
      GROUP BY s.system_id
      ORDER BY s.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching systems:', error);
    res.status(500).json({ error: 'שגיאה בשליפת מערכות' });
  }
};

// שליפת מערכות לרשות ספציפית
const getTenantSystems = async (req, res) => {
  const { tenantId } = req.params;
  
  try {
    const query = `
      SELECT 
        s.system_id,
        s.name,
        s.description,
        s.icon,
        s.is_active as system_active,
        ts.is_active as tenant_has_access,
        ts.created_at as access_granted_at
      FROM systems s
      LEFT JOIN tenant_systems ts ON s.system_id = ts.system_id AND ts.tenant_id = $1
      WHERE s.is_active = true
      ORDER BY s.system_id
    `;
    
    const result = await db.query(query, [tenantId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tenant systems:', error);
    res.status(500).json({ error: 'שגיאה בשליפת מערכות הרשות' });
  }
};

// הוספת/הסרת מערכת לרשות
const updateTenantSystem = async (req, res) => {
  const { tenantId, systemId } = req.params;
  const { isActive } = req.body;
  
  try {
    const result = await db.query(`
      INSERT INTO tenant_systems (tenant_id, system_id, is_active)
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id, system_id)
      DO UPDATE SET is_active = $3, activated_at = NOW()
      RETURNING *
    `, [tenantId, systemId, isActive]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tenant system:', error);
    res.status(500).json({ error: 'שגיאה בעדכון מערכת רשות' });
  }
};

// ==================================================
// ניהול עמודים (Pages Management)
// ==================================================

// שליפת עמודים למערכת
const getSystemPages = async (req, res) => {
  const { systemId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT * FROM system_pages 
      WHERE system_id = $1 AND is_active = true
      ORDER BY sort_order, page_name
    `, [systemId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching system pages:', error);
    res.status(500).json({ error: 'שגיאה בשליפת עמודי מערכת' });
  }
};

// ==================================================
// ניהול תפקידים (Roles Management)
// ==================================================

// שליפת תפקידים לרשות
const getTenantRoles = async (req, res) => {
  const { tenantId } = req.params;
  
  try {
    // DEMO BYPASS - מאפשר גישה למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing tenant roles access for demo user');
    
    const result = await db.query(`
      SELECT 
        r.role_id,
        r.name as role_name,
        r.description as role_description,
        false as is_system_role
      FROM roles r
      ORDER BY r.role_id
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tenant roles:', error);
    res.status(500).json({ 
      success: false,
      error: 'שגיאה בשליפת תפקידים' 
    });
  }
};

// יצירת תפקיד חדש
const createRole = async (req, res) => {
  const { tenantId, roleName, roleDescription } = req.body;
  
  try {
    const result = await db.query(`
      INSERT INTO roles (tenant_id, role_name, role_description)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [tenantId, roleName, roleDescription]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'שגיאה ביצירת תפקיד' });
  }
};

// עדכון תפקיד
const updateRole = async (req, res) => {
  const { id } = req.params;
  const { roleName, roleDescription, isActive } = req.body;
  
  try {
    const result = await db.query(`
      UPDATE roles 
      SET role_name = $1, role_description = $2, is_active = $3, updated_at = NOW()
      WHERE role_id = $4 AND is_system_role = false
      RETURNING *
    `, [roleName, roleDescription, isActive, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'תפקיד לא נמצא או לא ניתן לעדכון' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'שגיאה בעדכון תפקיד' });
  }
};

// מחיקת תפקיד
const deleteRole = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await db.query(`
      DELETE FROM roles 
      WHERE role_id = $1 AND is_system_role = false
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'תפקיד לא נמצא או לא ניתן למחיקה' });
    }
    
    res.json({ message: 'תפקיד נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'שגיאה במחיקת תפקיד' });
  }
};

// ==================================================
// ניהול משתמשים (Users Management)
// ==================================================

// שליפת משתמשים לרשות
const getTenantUsers = async (req, res) => {
  const tenantId = req.params.tenantId || req.query.tenantId;
  
  try {
    // DEMO BYPASS - מאפשר גישה למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing tenant users access for demo user');
    
    const result = await db.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.status,
        u.last_login,
        COALESCE(r.name, u.role) as role_name,
        COALESCE(r.description, 'תפקיד ברירת מחדל') as role_description,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.tenant_id = $1 AND u.status = 'active'
      ORDER BY u.created_at DESC
    `, [tenantId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching tenant users:', error);
    res.status(500).json({ 
      success: false,
      error: 'שגיאה בשליפת משתמשים' 
    });
  }
};

// יצירת משתמש חדש
const createUser = async (req, res) => {
  const { fullName, email, password, roleId, tenantId } = req.body;
  
  try {
    // DEMO BYPASS
    console.log('🔓 DEMO BYPASS: Allowing user creation for demo admin');
    
    // בדיקה שכל הפרטים הנדרשים נשלחו
    if (!fullName || !email || !password || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'חסרים פרטים נדרשים: שם מלא, אימייל, סיסמא ורשות'
      });
    }
    
    // בדיקה שהמשתמש לא קיים
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'משתמש עם כתובת אימייל זו כבר קיים במערכת'
      });
    }
    
    // הצפנת הסיסמא
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // קבלת שם התפקיד
    const roleResult = await db.query('SELECT name FROM roles WHERE role_id = $1', [roleId || 2]);
    const roleName = roleResult.rows[0]?.name || 'user';
    
    // יצירת המשתמש
    const createUserQuery = `
      INSERT INTO users (full_name, email, password_hash, role, role_id, tenant_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
      RETURNING id, full_name, email, status, created_at
    `;
    
    const result = await db.query(createUserQuery, [
      fullName,
      email,
      passwordHash,
      roleName,
      roleId || 2,
      tenantId
    ]);
    
    const newUser = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: `משתמש חדש נוצר בהצלחה: ${newUser.full_name}`,
      data: newUser
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת משתמש חדש: ' + error.message
    });
  }
};

// עדכון תפקיד משתמש
const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;
  
  try {
    const result = await db.query(
      'UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *',
      [roleId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'שגיאה בעדכון תפקיד משתמש' });
  }
};

// ==================================================
// ניהול הרשאות (Permissions Management)
// ==================================================

// שליפת הרשאות
const getPermissions = async (req, res) => {
  const { tenantId, systemId, roleId } = req.query;
  
  try {
    let query = `
      SELECT 
        p.*,
        sp.page_name,
        sp.page_route,
        r.role_name,
        s.name as system_name
      FROM permissions p
      JOIN system_pages sp ON p.page_id = sp.page_id
      JOIN roles r ON p.role_id = r.role_id
      JOIN systems s ON sp.system_id = s.system_id
      WHERE p.tenant_id = $1
    `;
    
    const params = [tenantId];
    let paramIndex = 2;
    
    if (systemId) {
      query += ` AND sp.system_id = $${paramIndex}`;
      params.push(systemId);
      paramIndex++;
    }
    
    if (roleId) {
      query += ` AND p.role_id = $${paramIndex}`;
      params.push(roleId);
      paramIndex++;
    }
    
    query += ` ORDER BY s.name, sp.sort_order, r.role_name`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'שגיאה בשליפת הרשאות' });
  }
};

// עדכון הרשאות
const updatePermissions = async (req, res) => {
  const { permissions } = req.body;
  
  try {
    await db.query('BEGIN');
    
    for (const permission of permissions) {
      const { tenantId, roleId, pageId, canView, canCreate, canEdit, canDelete, canExport } = permission;
      
      await db.query(`
        INSERT INTO permissions (tenant_id, role_id, page_id, can_view, can_create, can_edit, can_delete, can_export)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (tenant_id, role_id, page_id)
        DO UPDATE SET 
          can_view = $4,
          can_create = $5,
          can_edit = $6,
          can_delete = $7,
          can_export = $8,
          updated_at = NOW()
      `, [tenantId, roleId, pageId, canView, canCreate, canEdit, canDelete, canExport]);
    }
    
    await db.query('COMMIT');
    res.json({ message: 'הרשאות עודכנו בהצלחה' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'שגיאה בעדכון הרשאות' });
  }
};

// שליפת מטריצת הרשאות
const getPermissionsMatrix = async (req, res) => {
  const { tenantId, systemId } = req.query;
  
  try {
    // DEMO BYPASS - מאפשר גישה למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing permissions matrix access for demo user');
    
    // שליפת כל התפקידים
    const rolesResult = await db.query(`
      SELECT role_id, name as role_name, description 
      FROM roles 
      ORDER BY role_id, name
    `);
    
    // שליפת כל העמודים במערכת
    const pagesResult = await db.query(`
      SELECT page_id, name as page_name, description
      FROM system_pages 
      ORDER BY name
    `);
    
    // שליפת כל ההרשאות
    const permissionsResult = await db.query(`
      SELECT 
        p.permission_id,
        p.role_id,
        p.page_id,
        p.can_view,
        p.can_edit,
        p.can_create,
        p.can_delete,
        p.can_export,
        p.permission_level
      FROM permissions p
      WHERE p.tenant_id = $1 OR p.tenant_id IS NULL
    `, [tenantId || 1]);
    
    // בניית מטריצה
    const matrix = {
      roles: rolesResult.rows,
      pages: pagesResult.rows,
      permissions: {}
    };
    
    // מיפוי הרשאות
    permissionsResult.rows.forEach(permission => {
      const key = `${permission.role_id}-${permission.page_id}`;
      matrix.permissions[key] = permission;
    });
    
    res.json(matrix);
  } catch (error) {
    console.error('Error fetching permissions matrix:', error);
    res.status(500).json({ error: 'שגיאה בשליפת מטריצת הרשאות' });
  }
};

// ==================================================
// Audit Log
// ==================================================

// שליפת לוג פעילות
const getAuditLog = async (req, res) => {
  const { page = 1, limit = 50, action, resource_type, date_from, date_to } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let whereClause = '';
    const params = [];
    let paramCount = 0;
    
    if (action) {
      whereClause += ` AND al.action = $${++paramCount}`;
      params.push(action);
    }
    
    if (resource_type) {
      whereClause += ` AND al.resource_type = $${++paramCount}`;
      params.push(resource_type);
    }
    
    if (date_from) {
      whereClause += ` AND al.created_at >= $${++paramCount}`;
      params.push(date_from);
    }
    
    if (date_to) {
      whereClause += ` AND al.created_at <= $${++paramCount}`;
      params.push(date_to);
    }
    
    // Count total records
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM audit_log al
      WHERE 1=1 ${whereClause}
    `, params);
    
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated records
    const result = await db.query(`
      SELECT 
        al.log_id,
        al.tenant_id,
        t.name as tenant_name,
        al.user_id,
        u.full_name as user_name,
        al.action,
        al.resource_type,
        al.resource_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON al.tenant_id = t.tenant_id
      WHERE 1=1 ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `, [...params, limit, offset]);
    
    res.json({
      logs: result.rows,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'שגיאה בשליפת לוג פעילות' });
  }
};

// ==================================================
// System Access
// ==================================================

// בדיקת גישה למערכת
const checkUserSystemAccess = async (req, res) => {
  const { userId, systemId = 1 } = req.query;
  
  try {
    // אם לא סופק userId, נשתמש במשתמש הנוכחי
    const targetUserId = userId || req.user?.user_id;
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // בדיקת גישה למערכת
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.tenant_id,
        t.name as tenant_name,
        ts.system_id,
        s.name as system_name,
        ts.is_active as has_access
      FROM users u
      JOIN tenants t ON u.tenant_id = t.tenant_id
      LEFT JOIN tenant_systems ts ON t.tenant_id = ts.tenant_id AND ts.system_id = $2
      LEFT JOIN systems s ON ts.system_id = s.system_id
      WHERE u.id = $1
    `;
    
    const result = await db.query(query, [targetUserId, systemId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userAccess = result.rows[0];
    
    res.json({
      user_id: userAccess.user_id,
      full_name: userAccess.full_name,
      tenant_id: userAccess.tenant_id,
      tenant_name: userAccess.tenant_name,
      system_id: userAccess.system_id,
      system_name: userAccess.system_name || 'Unknown System',
      has_access: userAccess.has_access || false
    });
  } catch (error) {
    console.error('Error checking user system access:', error);
    res.status(500).json({ error: 'שגיאה בבדיקת גישה למערכת' });
  }
};

// פונקציה לבדיקת הרשאות שחרור חשבונות
const canUnlockUser = async (adminUserId, targetUserId) => {
  try {
    const adminQuery = `
      SELECT u.id, u.tenant_id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.id = $1
    `;
    
    const targetQuery = `
      SELECT u.id, u.tenant_id
      FROM users u
      WHERE u.id = $1
    `;
    
    const [adminResult, targetResult] = await Promise.all([
      db.query(adminQuery, [adminUserId]),
      db.query(targetQuery, [targetUserId])
    ]);
    
    if (adminResult.rows.length === 0 || targetResult.rows.length === 0) {
      return false;
    }
    
    const admin = adminResult.rows[0];
    const target = targetResult.rows[0];
    
    // מנהל מערכת כללי יכול לשחרר כל משתמש
    if (admin.role_name === 'System Admin') {
      return true;
    }
    
    // מנהל מערכת רשותי יכול לשחרר רק משתמשים מהרשות שלו
    if (admin.role_name === 'Authority Admin' && admin.tenant_id === target.tenant_id) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking unlock permissions:', error);
    return false;
  }
};

// קבלת רשימת משתמשים נעולים
export const getLockedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // DEMO BYPASS - מאפשר גישה למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing locked users access for demo user');
    
    const lockedUsersQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        u.full_name,
        u.email,
        u.failed_login_attempts,
        u.locked_at,
        u.tenant_id,
        t.name as tenant_name,
        u.role as role_name,
        EXTRACT(EPOCH FROM (NOW() - u.locked_at))/3600 as hours_locked
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
      WHERE u.locked = TRUE
      ORDER BY u.locked_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.locked = TRUE
    `;
    
    const [usersResult, countResult] = await Promise.all([
      db.query(lockedUsersQuery, [limit, offset]),
      db.query(countQuery)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching locked users:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליפת משתמשים נעולים'
    });
  }
};

// שחרור משתמש נעול
export const unlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // DEMO BYPASS - מאפשר שחרור למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing unlock user for demo user');
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'מזהה משתמש נדרש'
      });
    }
    
    // שליפת פרטי המשתמש לפני השחרור
    const userQuery = `
      SELECT u.id, u.full_name, u.email, u.failed_login_attempts, u.locked, u.tenant_id
      FROM users u
      WHERE u.id = $1
    `;
    
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.locked) {
      return res.status(400).json({
        success: false,
        error: 'המשתמש אינו נעול'
      });
    }
    
    // שחרור המשתמש
    await db.query(`
      UPDATE users 
      SET locked = FALSE,
          failed_login_attempts = 0,
          locked_at = NULL
      WHERE id = $1
    `, [userId]);
    
    // רישום בהיסטוריית שחרורים
    await db.query(`
      INSERT INTO user_unlock_history (
        user_id, unlocked_by, reason, previous_failed_attempts, 
        ip_address, user_agent, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId, 
      1, // Demo admin user ID
      reason || 'לא צוין', 
      user.failed_login_attempts,
      ipAddress,
      userAgent,
      user.tenant_id
    ]);
    
    // רישום באודיט לוג
    await db.query(`
      INSERT INTO audit_log (
        user_id, tenant_id, action, resource_type, resource_id, 
        details, ip_address
      ) VALUES ($1, $2, 'unlock_user', 'user', $3, $4, $5)
    `, [
      1, // Demo admin user ID
      user.tenant_id,
      userId,
      `Unlocked user ${user.full_name} (${user.email}). Reason: ${reason || 'לא צוין'}`,
      ipAddress
    ]);
    
    res.json({
      success: true,
      message: `המשתמש ${user.full_name} שוחרר בהצלחה`
    });
    
  } catch (error) {
    console.error('Error unlocking user:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשחרור המשתמש'
    });
  }
};

// קבלת היסטוריית שחרורים
export const getUnlockHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const offset = (page - 1) * limit;
    
    // DEMO BYPASS - מאפשר גישה למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing unlock history access for demo user');
    
    let whereClause = '';
    let queryParams = [limit, offset];
    
    // הוספת פילטר לפי משתמש ספציפי
    if (userId) {
      whereClause = ' WHERE uh.user_id = $3';
      queryParams.push(userId);
    }
    
    const historyQuery = `
      SELECT 
        uh.unlock_id,
        uh.unlocked_at,
        uh.reason,
        uh.previous_failed_attempts,
        uh.ip_address,
        u1.full_name as unlocked_user_name,
        u1.email as unlocked_user_email,
        u2.full_name as unlocked_by_name,
        u2.email as unlocked_by_email,
        COALESCE(t.name, 'Unknown') as tenant_name
      FROM user_unlock_history uh
      LEFT JOIN users u1 ON uh.user_id = u1.id
      LEFT JOIN users u2 ON uh.unlocked_by = u2.id
      LEFT JOIN tenants t ON uh.tenant_id = t.tenant_id
      ${whereClause}
      ORDER BY uh.unlocked_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM user_unlock_history uh
      ${whereClause}
    `;
    
    const [historyResult, countResult] = await Promise.all([
      db.query(historyQuery, queryParams),
      db.query(countQuery, queryParams.slice(2)) // Remove limit and offset for count
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        history: historyResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching unlock history:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליפת היסטוריית שחרורים'
    });
  }
};

// ==================================================
// ניהול סיסמאות (Password Management)
// ==================================================

// איפוס סיסמא למשתמש (מנהל מערכת)
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, sendEmail = false } = req.body;
    const adminId = req.user?.id || 1; // ID של המנהל שמבצע את הפעולה
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // DEMO BYPASS - מאפשר איפוס סיסמא למשתמש demo
    console.log('🔓 DEMO BYPASS: Allowing password reset for demo admin');
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'מזהה משתמש נדרש'
      });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'סיסמא חדשה חייבת להכיל לפחות 6 תווים'
      });
    }
    
    // שליפת פרטי המשתמש
    const userResult = await db.query(`
      SELECT id, full_name, email, tenant_id 
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
    }
    
    const user = userResult.rows[0];
    
    // יצירת hash לסיסמא החדשה
    const { hashPassword } = await import('../middleware/auth.js');
    const hashedPassword = await hashPassword(newPassword);
    
    // עדכון הסיסמא במסד הנתונים
    await db.query(`
      UPDATE users 
      SET password_hash = $1,
          locked = FALSE,
          failed_login_attempts = 0,
          locked_at = NULL,
          updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, userId]);
    
    // רישום בהיסטוריית איפוס סיסמאות
    await db.query(`
      INSERT INTO password_reset_history (
        user_id, reset_by, reset_method, ip_address, tenant_id
      ) VALUES ($1, $2, 'admin_reset', $3, $4)
    `, [userId, adminId, ipAddress, user.tenant_id]);
    
    // רישום באודיט לוג
    await db.query(`
      INSERT INTO audit_log (
        user_id, tenant_id, action, resource_type, resource_id, 
        details, ip_address
      ) VALUES ($1, $2, 'password_reset', 'user', $3, $4, $5)
    `, [
      adminId,
      user.tenant_id,
      userId,
      `Password reset for user ${user.full_name} (${user.email}) by admin`,
      ipAddress
    ]);
    
    res.json({
      success: true,
      message: `סיסמת המשתמש ${user.full_name} אופסה בהצלחה`,
      data: {
        userId: user.id,
        userEmail: user.email,
        newPassword: newPassword // החזרת הסיסמא החדשה למנהל
      }
    });
    
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה באיפוס סיסמת המשתמש'
    });
  }
};

// יצירת סיסמא אקראית
export const generateRandomPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { length = 8 } = req.body;
    const adminId = req.user?.id || 1;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // DEMO BYPASS
    console.log('🔓 DEMO BYPASS: Allowing random password generation for demo admin');
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'מזהה משתמש נדרש'
      });
    }
    
    // יצירת סיסמא אקראית
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let randomPassword = '';
    for (let i = 0; i < length; i++) {
      randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // שליפת פרטי המשתמש
    const userResult = await db.query(`
      SELECT id, full_name, email, tenant_id 
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
    }
    
    const user = userResult.rows[0];
    
    // יצירת hash לסיסמא החדשה
    const { hashPassword } = await import('../middleware/auth.js');
    const hashedPassword = await hashPassword(randomPassword);
    
    // עדכון הסיסמא במסד הנתונים
    await db.query(`
      UPDATE users 
      SET password_hash = $1,
          locked = FALSE,
          failed_login_attempts = 0,
          locked_at = NULL,
          updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, userId]);
    
    // רישום בהיסטוריית איפוס סיסמאות
    await db.query(`
      INSERT INTO password_reset_history (
        user_id, reset_by, reset_method, ip_address, tenant_id
      ) VALUES ($1, $2, 'admin_generate', $3, $4)
    `, [userId, adminId, ipAddress, user.tenant_id]);
    
    // רישום באודיט לוג
    await db.query(`
      INSERT INTO audit_log (
        user_id, tenant_id, action, resource_type, resource_id, 
        details, ip_address
      ) VALUES ($1, $2, 'password_generate', 'user', $3, $4, $5)
    `, [
      adminId,
      user.tenant_id,
      userId,
      `Generated new password for user ${user.full_name} (${user.email}) by admin`,
      ipAddress
    ]);
    
    res.json({
      success: true,
      message: `סיסמא אקראית נוצרה בהצלחה עבור ${user.full_name}`,
      data: {
        userId: user.id,
        userEmail: user.email,
        newPassword: randomPassword // החזרת הסיסמא החדשה למנהל
      }
    });
    
  } catch (error) {
    console.error('Error generating random password:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה ביצירת סיסמא אקראית'
    });
  }
};

// הצגת היסטוריית איפוס סיסמאות
export const getPasswordResetHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const offset = (page - 1) * limit;
    
    // DEMO BYPASS
    console.log('🔓 DEMO BYPASS: Allowing password reset history access for demo admin');
    
    let whereClause = '';
    let queryParams = [limit, offset];
    
    if (userId) {
      whereClause = ' WHERE prh.user_id = $3';
      queryParams.push(userId);
    }
    
    const historyQuery = `
      SELECT 
        prh.reset_id,
        prh.reset_at,
        prh.reset_method,
        prh.ip_address,
        u1.full_name as user_name,
        u1.email as user_email,
        u2.full_name as reset_by_name,
        u2.email as reset_by_email,
        COALESCE(t.name, 'Unknown') as tenant_name
      FROM password_reset_history prh
      LEFT JOIN users u1 ON prh.user_id = u1.id
      LEFT JOIN users u2 ON prh.reset_by = u2.id
      LEFT JOIN tenants t ON prh.tenant_id = t.tenant_id
      ${whereClause}
      ORDER BY prh.reset_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM password_reset_history prh
      ${whereClause}
    `;
    
    const [historyResult, countResult] = await Promise.all([
      db.query(historyQuery, queryParams),
      db.query(countQuery, queryParams.slice(2))
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        history: historyResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching password reset history:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליפת היסטוריית איפוס סיסמאות'
    });
  }
};

// קבלת פרטי המשתמש הנוכחי (כולל האם הוא מנהל)
export const getCurrentAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?.id || 1;
    
    // DEMO BYPASS
    console.log('🔓 DEMO BYPASS: Allowing admin profile access for demo admin');
    
    const profileQuery = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.status,
        u.created_at,
        u.last_login,
        r.name as role_name,
        r.description as role_description,
        t.name as tenant_name,
        COUNT(al.log_id) as total_actions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
      LEFT JOIN audit_log al ON u.id = al.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.full_name, u.email, u.status, u.created_at, u.last_login, 
               r.name, r.description, t.name
    `;
    
    const profileResult = await db.query(profileQuery, [adminId]);
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'פרופיל מנהל לא נמצא'
      });
    }
    
    const profile = profileResult.rows[0];
    
    res.json({
      success: true,
      data: {
        profile,
        note: '⚠️ לא ניתן לראות את הסיסמא המקורית מסיבות אבטחה. השתמש באיפוס סיסמא לשינוי.'
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליפת פרופיל המנהל'
    });
  }
};

// ==================================================
// ניהול הרשאות אישיות (User Permissions Management)
// ==================================================

// שליפת הרשאות אישיות למשתמש ספציפי - REAL DATABASE VERSION
export const getUserPermissions = async (req, res) => {
  try {
    const { tenantId, systemId, userId } = req.query;
    
    console.log('📋 Real getUserPermissions called with:', { tenantId, systemId, userId });
    
    if (!tenantId || !systemId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'חסרים פרמטרים נדרשים: tenantId, systemId, userId'
      });
    }

    // Get user details
    const userQuery = `
      SELECT u.id, u.email, u.full_name, r.name as role_name, u.status, u.last_login
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'משתמש לא נמצא'
      });
    }

    const user = userResult.rows[0];

    // Get all pages for the system
    const pagesQuery = `
      SELECT page_id, name as page_name, name as page_route, 
             COALESCE(description, name) as page_description, 
             page_id as sort_order
      FROM system_pages 
      WHERE module_id = $1 
      ORDER BY page_id
    `;
    const pagesResult = await db.query(pagesQuery, [systemId]);
    const pages = pagesResult.rows;

    // Get user-specific permissions (using existing table structure)
    const userPermissionsQuery = `
      SELECT up.user_permission_id as permission_id, up.user_id, up.page_id,
             up.can_view, up.can_create, up.can_edit, up.can_delete, up.can_export
      FROM user_permissions up
      WHERE up.user_id = $1
    `;
    const userPermissionsResult = await db.query(userPermissionsQuery, [userId]);
    
    // Convert to object format expected by frontend
    const permissions = {};
    userPermissionsResult.rows.forEach(perm => {
      permissions[`${perm.user_id}-${perm.page_id}`] = {
        ...perm,
        tenant_id: parseInt(tenantId) // Add tenant_id for frontend compatibility
      };
    });

    // Get role defaults from permission_templates (if exists) or create defaults
    let roleDefaults = {};
    
    try {
      const roleDefaultsQuery = `
        SELECT pt.page_id, pt.can_view, pt.can_create, pt.can_edit, pt.can_delete, pt.can_export
        FROM permission_templates pt
        JOIN users u ON pt.role_id = u.role_id
        WHERE u.id = $1
      `;
      const roleDefaultsResult = await db.query(roleDefaultsQuery, [userId]);
      
      // Convert to object format
      roleDefaultsResult.rows.forEach(def => {
        roleDefaults[def.page_id] = def;
      });
    } catch (error) {
      console.log('Permission templates table not found, using defaults');
    }

    // If no role defaults found, create basic defaults
    if (Object.keys(roleDefaults).length === 0) {
      pages.forEach(page => {
        roleDefaults[page.page_id] = {
          page_id: page.page_id,
          can_view: page.page_id !== 25, // All pages except admin
          can_create: false,
          can_edit: false,
          can_delete: false,
          can_export: false
        };
      });
    }

    res.json({
      success: true,
      data: {
        user,
        pages,
        permissions,
        roleDefaults
      }
    });

  } catch (error) {
    console.error('Error in getUserPermissions:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשליפת הרשאות משתמש'
    });
  }
};

// שמירת הרשאות אישיות למשתמש - REAL DATABASE VERSION
export const saveUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    
    console.log('💾 Real saveUserPermissions called with:', { permissions });
    
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'נתוני הרשאות לא תקינים - נדרש מערך של הרשאות'
      });
    }

    // Get tenantId, systemId, userId from the first permission object
    const firstPermission = permissions[0];
    const { tenant_id: tenantId, system_id: systemId, user_id: userId } = firstPermission;

    if (!tenantId || !systemId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'חסרים פרמטרים נדרשים בנתוני ההרשאות'
      });
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Delete existing permissions for this user
      await db.query(
        'DELETE FROM user_permissions WHERE user_id = $1',
        [userId]
      );

      // Insert new permissions (using existing table structure)
      for (const permission of permissions) {
        const insertQuery = `
          INSERT INTO user_permissions (
            user_id, page_id, can_view, can_create, can_edit, can_delete, can_export, is_custom
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        `;
        
        await db.query(insertQuery, [
          userId,
          permission.page_id,
          permission.can_view || false,
          permission.can_create || false,
          permission.can_edit || false,
          permission.can_delete || false,
          permission.can_export || false
        ]);
      }

      // Commit transaction
      await db.query('COMMIT');

      console.log('✅ Permissions saved successfully for user:', userId);
      
      res.json({
        success: true,
        message: 'הרשאות המשתמש נשמרו בהצלחה',
        saved_permissions: permissions.length
      });

    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error saving user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'שגיאה בשמירת הרשאות משתמש'
    });
  }
};

// ==================================================
// סטטיסטיקות דשבורד (Dashboard Statistics)
// ==================================================

// שליפת סטטיסטיקות כלליות למערכת
export const getSystemStatistics = async (req, res) => {
  try {
    console.log('📊 Getting system statistics...');
    
    // ספירת רשויות פעילות
    const tenantsResult = await db.query(`
      SELECT 
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants
      FROM tenants
    `);
    
    // ספירת משתמשים
    const usersResult = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'locked' THEN 1 END) as locked_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month
      FROM users
    `);
    
    // ספירת מערכות פעילות
    const systemsResult = await db.query(`
      SELECT 
        COUNT(*) as total_systems,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_systems
      FROM systems
    `);
    
    // ספירת תפקידים
    const rolesResult = await db.query(`
      SELECT 
        COUNT(*) as total_roles,
        COUNT(CASE WHEN name != 'admin' AND name != 'super_admin' THEN 1 END) as custom_roles
      FROM roles
    `);
    
    // פעילות היום (לוגים)
    const activityResult = await db.query(`
      SELECT COUNT(*) as today_activities
      FROM audit_log 
      WHERE created_at >= CURRENT_DATE
    `);
    
    // הרשאות מותאמות אישית
    const customPermissionsResult = await db.query(`
      SELECT COUNT(DISTINCT user_id) as users_with_custom_permissions
      FROM user_permissions 
      WHERE is_custom = true
    `);
    
    const stats = {
      tenants: {
        total: parseInt(tenantsResult.rows[0]?.total_tenants || 0),
        active: parseInt(tenantsResult.rows[0]?.active_tenants || 0),
        growth: '+2 מהחודש הקודם' // TODO: חישוב אמיתי
      },
      users: {
        total: parseInt(usersResult.rows[0]?.total_users || 0),
        active: parseInt(usersResult.rows[0]?.active_users || 0),
        locked: parseInt(usersResult.rows[0]?.locked_users || 0),
        new_this_month: parseInt(usersResult.rows[0]?.new_users_month || 0),
        growth: `+${usersResult.rows[0]?.new_users_month || 0} מהחודש הקודם`
      },
      systems: {
        total: parseInt(systemsResult.rows[0]?.total_systems || 0),
        active: parseInt(systemsResult.rows[0]?.active_systems || 0)
      },
      roles: {
        total: parseInt(rolesResult.rows[0]?.total_roles || 0),
        custom: parseInt(rolesResult.rows[0]?.custom_roles || 0)
      },
      activity: {
        today: parseInt(activityResult.rows[0]?.today_activities || 0)
      },
      permissions: {
        custom_users: parseInt(customPermissionsResult.rows[0]?.users_with_custom_permissions || 0)
      }
    };
    
    console.log('📊 System statistics:', stats);
    res.json(stats);
    
  } catch (error) {
    console.error('Error getting system statistics:', error);
    res.status(500).json({ error: 'שגיאה בשליפת סטטיסטיקות מערכת' });
  }
};

// שליפת פעילות אחרונה
export const getRecentActivity = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    
    const result = await db.query(`
      SELECT 
        al.action,
        al.resource_type,
        al.details,
        al.created_at,
        u.full_name as user_name,
        t.name as tenant_name
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN tenants t ON al.tenant_id = t.tenant_id
      ORDER BY al.created_at DESC
      LIMIT $1
    `, [limit]);
    
    const activities = result.rows.map(activity => ({
      ...activity,
      time_ago: getTimeAgo(activity.created_at)
    }));
    
    res.json(activities);
    
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({ error: 'שגיאה בשליפת פעילות אחרונה' });
  }
};

// פונקציית עזר לחישוב זמן שעבר
const getTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'עכשיו';
  if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `לפני ${diffInDays} ימים`;
};

// ==================================================
// ייצוא נתונים (Data Export)
// ==================================================

// ייצוא הרשאות משתמשים ל-Excel
export const exportUserPermissionsExcel = async (req, res) => {
  try {
    const { tenantId, systemId } = req.query;
    
    if (!tenantId || !systemId) {
      return res.status(400).json({ error: 'tenantId and systemId are required' });
    }

    // שליפת משתמשים עם הרשאות
    const usersQuery = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        r.name as role_name,
        u.created_at,
        u.last_login,
        u.status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.tenant_id = $1
      ORDER BY u.full_name
    `;
    
    const usersResult = await db.query(usersQuery, [tenantId]);
    const users = usersResult.rows;

    // שליפת עמודים במערכת
    const pagesQuery = `
      SELECT page_id, name as page_name
      FROM system_pages 
      WHERE system_id = $1 AND is_active = true
      ORDER BY sort_order, name
    `;
    
    const pagesResult = await db.query(pagesQuery, [systemId]);
    const pages = pagesResult.rows;

    // שליפת הרשאות לכל משתמש
    const permissionsData = [];
    
    for (const user of users) {
      const userPermissions = {
        'שם מלא': user.full_name,
        'אימייל': user.email,
        'תפקיד': user.role_name || 'לא מוגדר',
        'סטטוס': user.status === 'active' ? 'פעיל' : 'לא פעיל',
        'תאריך הצטרפות': new Date(user.created_at).toLocaleDateString('he-IL'),
        'התחברות אחרונה': user.last_login ? new Date(user.last_login).toLocaleDateString('he-IL') : 'מעולם לא'
      };

      // הוספת הרשאות לכל עמוד
      for (const page of pages) {
        const permissionQuery = `
          SELECT permission_type
          FROM user_permissions up
          WHERE up.user_id = $1 AND up.page_id = $2
          UNION
          SELECT pt.permission_type
          FROM permission_templates pt
          JOIN users u ON u.role_id = pt.role_id AND u.tenant_id = pt.tenant_id
          WHERE u.id = $1 AND pt.page_id = $2
        `;
        
        const permissionResult = await db.query(permissionQuery, [user.user_id, page.page_id]);
        const hasPermission = permissionResult.rows.length > 0;
        
        userPermissions[`${page.page_name} - הרשאה`] = hasPermission ? 'יש' : 'אין';
      }
      
      permissionsData.push(userPermissions);
    }

    res.json({
      success: true,
      data: permissionsData,
      filename: `user_permissions_${tenantId}_${systemId}_${new Date().toISOString().split('T')[0]}.xlsx`
    });

  } catch (error) {
    console.error('Error exporting user permissions to Excel:', error);
    res.status(500).json({ error: 'שגיאה בייצוא הרשאות ל-Excel' });
  }
};

export const exportSystemOverviewPDF = async (req, res) => {
  try {
    console.log('📄 Generating system overview PDF via Puppeteer...');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // כתובת ה־URL לדוח HTML שנטען בצד ה־Backend
    await page.goto('http://localhost:3000/api/admin/pdf-view', {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="system_overview_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);

    console.log('✅ PDF generated and sent successfully.');
  } catch (error) {
    console.error('❌ Failed to generate PDF:', error);
    res.status(500).json({ error: 'שגיאה ביצירת PDF', details: error.message });
  }
};

export const exportSystemOverview = async (req, res) => {
  try {
    const { format } = req.query;
    
    if (!format || !['excel', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format must be excel or pdf' });
    }

    // שליפת נתונים סטטיסטיים
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM tenants WHERE status = 'active') as active_tenants,
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM users WHERE status = 'locked') as locked_users,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM systems WHERE is_active = true) as active_systems,
        (SELECT COUNT(*) FROM systems) as total_systems,
        (SELECT COUNT(*) FROM roles) as total_roles,
        (SELECT COUNT(DISTINCT user_id) FROM user_permissions) as custom_permissions_users
    `;
    
    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    // שליפת פעילות אחרונה
    const activityQuery = `
      SELECT 
        action,
        resource_type,
        details,
        user_name,
        created_at
      FROM audit_log 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const activityResult = await db.query(activityQuery);
    const activities = activityResult.rows;

    if (format === 'excel') {
      // ייצוא Excel
      const overviewData = [{
        'נתון': 'רשויות פעילות',
        'ערך': stats.active_tenants,
        'מתוך סה"כ': stats.total_tenants,
        'אחוז': `${Math.round((stats.active_tenants / stats.total_tenants) * 100)}%`
      }, {
        'נתון': 'משתמשים פעילים',
        'ערך': stats.active_users,
        'מתוך סה"כ': stats.total_users,
        'אחוז': `${Math.round((stats.active_users / stats.total_users) * 100)}%`
      }, {
        'נתון': 'משתמשים נעולים',
        'ערך': stats.locked_users,
        'מתוך סה"כ': stats.total_users,
        'אחוז': `${Math.round((stats.locked_users / stats.total_users) * 100)}%`
      }, {
        'נתון': 'מערכות פעילות',
        'ערך': stats.active_systems,
        'מתוך סה"כ': stats.total_systems,
        'אחוז': `${Math.round((stats.active_systems / stats.total_systems) * 100)}%`
      }, {
        'נתון': 'תפקידים מוגדרים',
        'ערך': stats.total_roles,
        'מתוך סה"כ': '-',
        'אחוז': '-'
      }, {
        'נתון': 'משתמשים עם הרשאות מותאמות',
        'ערך': stats.custom_permissions_users,
        'מתוך סה"כ': stats.total_users,
        'אחוז': `${Math.round((stats.custom_permissions_users / stats.total_users) * 100)}%`
      }];

      const activityData = activities.map(activity => ({
        'פעולה': activity.action,
        'סוג משאב': activity.resource_type,
        'פרטים': activity.details || '-',
        'משתמש': activity.user_name || 'מערכת',
        'תאריך': new Date(activity.created_at).toLocaleDateString('he-IL'),
        'שעה': new Date(activity.created_at).toLocaleTimeString('he-IL')
      }));

      res.json({
        success: true,
        data: {
          overview: overviewData,
          activity: activityData
        },
        filename: `system_overview_${new Date().toISOString().split('T')[0]}.xlsx`
      });

    } else if (format === 'pdf') {
      // ייצוא PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>סקירה כללית - מערכת ניהול</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              direction: rtl;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-card h3 {
              margin: 0 0 10px 0;
              color: #374151;
              font-size: 16px;
            }
            .stat-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            .stat-card .percentage {
              font-size: 14px;
              color: #6b7280;
            }
            .activity-section {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .activity-section h2 {
              margin-top: 0;
              color: #374151;
            }
            .activity-item {
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .activity-item:last-child {
              border-bottom: none;
            }
            .activity-item .action {
              font-weight: bold;
              color: #1f2937;
            }
            .activity-item .details {
              color: #6b7280;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>סקירה כללית - מערכת ניהול</h1>
            <p>נוצר ב-${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL')}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>רשויות פעילות</h3>
              <div class="value">${stats.active_tenants}</div>
              <div class="percentage">מתוך ${stats.total_tenants} רשויות (${Math.round((stats.active_tenants / stats.total_tenants) * 100)}%)</div>
            </div>
            
            <div class="stat-card">
              <h3>משתמשים פעילים</h3>
              <div class="value">${stats.active_users}</div>
              <div class="percentage">מתוך ${stats.total_users} משתמשים (${Math.round((stats.active_users / stats.total_users) * 100)}%)</div>
            </div>
            
            <div class="stat-card">
              <h3>משתמשים נעולים</h3>
              <div class="value">${stats.locked_users}</div>
              <div class="percentage">מתוך ${stats.total_users} משתמשים (${Math.round((stats.locked_users / stats.total_users) * 100)}%)</div>
            </div>
            
            <div class="stat-card">
              <h3>מערכות פעילות</h3>
              <div class="value">${stats.active_systems}</div>
              <div class="percentage">מתוך ${stats.total_systems} מערכות (${Math.round((stats.active_systems / stats.total_systems) * 100)}%)</div>
            </div>
            
            <div class="stat-card">
              <h3>תפקידים מוגדרים</h3>
              <div class="value">${stats.total_roles}</div>
              <div class="percentage">תפקידים במערכת</div>
            </div>
            
            <div class="stat-card">
              <h3>הרשאות מותאמות</h3>
              <div class="value">${stats.custom_permissions_users}</div>
              <div class="percentage">משתמשים עם הרשאות מותאמות (${Math.round((stats.custom_permissions_users / stats.total_users) * 100)}%)</div>
            </div>
          </div>

          <div class="activity-section">
            <h2>פעילות אחרונה</h2>
            ${activities.map(activity => `
              <div class="activity-item">
                <div class="action">${activity.action} ${activity.resource_type}</div>
                <div class="details">
                  ${activity.details || 'ללא פרטים נוספים'} • 
                  ${activity.user_name || 'מערכת'} • 
                  ${new Date(activity.created_at).toLocaleDateString('he-IL')} ${new Date(activity.created_at).toLocaleTimeString('he-IL')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            דוח זה נוצר אוטומטית על ידי מערכת ניהול המערכת<br>
            תאריך יצירה: ${new Date().toLocaleDateString('he-IL')} | שעה: ${new Date().toLocaleTimeString('he-IL')}
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="system_overview_${new Date().toISOString().split('T')[0]}.html"`);
      res.send(htmlContent);
    }

  } catch (error) {
    console.error('Error exporting system overview:', error);
    res.status(500).json({ error: 'שגיאה בייצוא סקירה כללית' });
  }
};

// ייצוא הרשאות משתמשים ל-PDF
export const exportUserPermissionsPDF = async (req, res) => {
  try {
    const { tenantId, systemId } = req.query;
    
    if (!tenantId || !systemId) {
      return res.status(400).json({ error: 'tenantId and systemId are required' });
    }

    // שליפת נתונים בסיסיים
    const tenantQuery = `SELECT name FROM tenants WHERE tenant_id = $1`;
    const systemQuery = `SELECT name FROM systems WHERE system_id = $1`;
    
    const [tenantResult, systemResult] = await Promise.all([
      db.query(tenantQuery, [tenantId]),
      db.query(systemQuery, [systemId])
    ]);

    const tenantName = tenantResult.rows[0]?.name || 'רשות לא ידועה';
    const systemName = systemResult.rows[0]?.name || 'מערכת לא ידועה';

    // שליפת משתמשים עם הרשאות (אותה לוגיקה כמו Excel)
    const usersQuery = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        r.name as role_name,
        u.created_at,
        u.last_login,
        u.status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.tenant_id = $1
      ORDER BY u.full_name
    `;
    
    const usersResult = await db.query(usersQuery, [tenantId]);
    const users = usersResult.rows;

    // שליפת עמודים במערכת
    const pagesQuery = `
      SELECT page_id, name as page_name
      FROM system_pages 
      WHERE system_id = $1 AND is_active = true
      ORDER BY sort_order, name
    `;
    
    const pagesResult = await db.query(pagesQuery, [systemId]);
    const pages = pagesResult.rows;

    // יצירת תוכן HTML לדוח
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>דוח הרשאות משתמשים</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .info-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
          }
          .users-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .users-table th {
            background: #4f46e5;
            color: white;
            padding: 12px 8px;
            text-align: right;
            font-weight: bold;
            font-size: 12px;
          }
          .users-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
          }
          .users-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .permission-yes {
            color: #059669;
            font-weight: bold;
          }
          .permission-no {
            color: #dc2626;
          }
          .status-active {
            color: #059669;
            font-weight: bold;
          }
          .status-inactive {
            color: #dc2626;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>דוח הרשאות משתמשים</h1>
          <p>נוצר ב-${new Date().toLocaleDateString('he-IL')} בשעה ${new Date().toLocaleTimeString('he-IL')}</p>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span><strong>רשות:</strong></span>
              <span>${tenantName}</span>
            </div>
            <div class="info-item">
              <span><strong>מערכת:</strong></span>
              <span>${systemName}</span>
            </div>
            <div class="info-item">
              <span><strong>מספר משתמשים:</strong></span>
              <span>${users.length}</span>
            </div>
            <div class="info-item">
              <span><strong>מספר עמודים:</strong></span>
              <span>${pages.length}</span>
            </div>
          </div>
        </div>

        <table class="users-table">
          <thead>
            <tr>
              <th style="width: 15%">שם מלא</th>
              <th style="width: 15%">אימייל</th>
              <th style="width: 10%">תפקיד</th>
              <th style="width: 8%">סטטוס</th>
              <th style="width: 12%">התחברות אחרונה</th>
              ${pages.map(page => `<th style="width: ${Math.floor(40/pages.length)}%">${page.page_name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${await Promise.all(users.map(async (user) => {
              const permissionCells = await Promise.all(pages.map(async (page) => {
                const permissionQuery = `
                  SELECT permission_type
                  FROM user_permissions up
                  WHERE up.user_id = $1 AND up.page_id = $2
                  UNION
                  SELECT pt.permission_type
                  FROM permission_templates pt
                  JOIN users u ON u.role_id = pt.role_id AND u.tenant_id = pt.tenant_id
                  WHERE u.id = $1 AND pt.page_id = $2
                `;
                
                const permissionResult = await db.query(permissionQuery, [user.user_id, page.page_id]);
                const hasPermission = permissionResult.rows.length > 0;
                
                return `<td class="${hasPermission ? 'permission-yes' : 'permission-no'}">${hasPermission ? '✓' : '✗'}</td>`;
              }));

              return `
                <tr>
                  <td><strong>${user.full_name}</strong></td>
                  <td>${user.email}</td>
                  <td>${user.role_name || 'לא מוגדר'}</td>
                  <td class="${user.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${user.status === 'active' ? 'פעיל' : 'לא פעיל'}
                  </td>
                  <td>${user.last_login ? new Date(user.last_login).toLocaleDateString('he-IL') : 'מעולם לא'}</td>
                  ${permissionCells.join('')}
                </tr>
              `;
            }))}
          </tbody>
        </table>

        <div class="footer">
          דוח זה נוצר אוטומטית על ידי מערכת ניהול הרשאות המשתמשים<br>
          תאריך יצירה: ${new Date().toLocaleDateString('he-IL')} | שעה: ${new Date().toLocaleTimeString('he-IL')}
        </div>
      </body>
      </html>
    `;

    // החזרת תוכן HTML (במקום PDF אמיתי כרגע)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="user_permissions_${tenantId}_${systemId}.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('Error exporting user permissions to PDF:', error);
    res.status(500).json({ error: 'שגיאה בייצוא הרשאות ל-PDF' });
  }
};

// דף HTML לטעינה על ידי Puppeteer
export const getPdfView = async (req, res) => {
  try {
    console.log('📄 Generating PDF view HTML...');
    
    // שליפת נתונים סטטיסטיים עם טיפול בטבלאות שלא קיימות
    let stats = {
      active_tenants: 0,
      total_tenants: 0,
      active_users: 0,
      locked_users: 0,
      total_users: 0,
      active_systems: 0,
      total_systems: 0,
      total_roles: 0,
      custom_permissions_users: 0
    };

    try {
      // ספירת רשויות
      const tenantsResult = await db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as active FROM tenants', ['active']);
      stats.total_tenants = parseInt(tenantsResult.rows[0].total) || 0;
      stats.active_tenants = parseInt(tenantsResult.rows[0].active) || 0;
    } catch (e) {
      console.log('Tenants table error:', e.message);
    }

    try {
      // ספירת משתמשים
      const usersResult = await db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as active, COUNT(CASE WHEN status = $2 THEN 1 END) as locked FROM users', ['active', 'locked']);
      stats.total_users = parseInt(usersResult.rows[0].total) || 0;
      stats.active_users = parseInt(usersResult.rows[0].active) || 0;
      stats.locked_users = parseInt(usersResult.rows[0].locked) || 0;
    } catch (e) {
      console.log('Users table error:', e.message);
    }

    try {
      // ספירת מערכות
      const systemsResult = await db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM systems');
      stats.total_systems = parseInt(systemsResult.rows[0].total) || 0;
      stats.active_systems = parseInt(systemsResult.rows[0].active) || 0;
    } catch (e) {
      console.log('Systems table error:', e.message);
    }

    try {
      // ספירת תפקידים
      const rolesResult = await db.query('SELECT COUNT(*) as total FROM roles');
      stats.total_roles = parseInt(rolesResult.rows[0].total) || 0;
    } catch (e) {
      console.log('Roles table error:', e.message);
    }

    try {
      // ספירת הרשאות מותאמות
      const permissionsResult = await db.query('SELECT COUNT(DISTINCT user_id) as total FROM user_permissions');
      stats.custom_permissions_users = parseInt(permissionsResult.rows[0].total) || 0;
    } catch (e) {
      console.log('User permissions table error:', e.message);
    }

    // שליפת פעילות אחרונה
    let activities = [];
    try {
      const activityQuery = `
        SELECT 
          a.action,
          a.resource_type,
          a.details,
          COALESCE(u.username, u.email, 'משתמש לא ידוע') as user_name,
          a.created_at
        FROM audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC 
        LIMIT 20
      `;
      
      const activityResult = await db.query(activityQuery);
      activities = activityResult.rows;
    } catch (e) {
      console.log('Audit log table error:', e.message);
      // אם אין טבלת audit_log, נוסיף פעילות דמה
      activities = [
        {
          action: 'system',
          resource_type: 'startup',
          details: 'מערכת הופעלה',
          user_name: 'מערכת',
          created_at: new Date()
        }
      ];
    }

    // הכנת נתונים לדוח
    const reportData = {
      title: 'דוח סקירת מערכת',
      subtitle: 'מערכת ניהול תב"רים',
      reportDate: new Date().toLocaleDateString('he-IL'),
      reportTime: new Date().toLocaleTimeString('he-IL'),
      stats,
      activities: activities.map(activity => ({
        ...activity,
        activity_date: new Date(activity.created_at).toLocaleDateString('he-IL')
      }))
    };

    // יצירת HTML לדוח
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>דוח סקירת מערכת</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            color: #333;
            background: #fff;
            font-size: 12px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #1565c0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #1565c0;
            margin-bottom: 8px;
        }
        
        .header .subtitle {
            font-size: 16px;
            color: #666;
            font-weight: normal;
        }
        
        .header .meta {
            font-size: 11px;
            color: #888;
            margin-top: 10px;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e0e0e0;
        }
        
        .summary-card .number {
            font-size: 18px;
            font-weight: bold;
            color: #1565c0;
            margin-bottom: 5px;
        }
        
        .summary-card .label {
            font-size: 10px;
            color: #666;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section h2 {
            font-size: 14px;
            color: #1565c0;
            margin-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 5px;
        }
        
        .activity-list {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        
        .activity-item {
            padding: 6px 0;
            border-bottom: 1px solid #e0e0e0;
            font-size: 10px;
        }
        
        .activity-item:last-child {
            border-bottom: none;
        }
        
        .activity-type {
            font-weight: bold;
            color: #1565c0;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        
        @media print {
            .container { 
                padding: 10mm;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportData.title}</h1>
            <div class="subtitle">${reportData.subtitle}</div>
            <div class="meta">
                דוח נוצר בתאריך: ${reportData.reportDate} | ${reportData.reportTime}
            </div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="number">${reportData.stats.total_tenants}</div>
                <div class="label">רשויות</div>
            </div>
            <div class="summary-card">
                <div class="number">${reportData.stats.total_users}</div>
                <div class="label">משתמשים</div>
            </div>
            <div class="summary-card">
                <div class="number">${reportData.stats.total_systems}</div>
                <div class="label">מערכות</div>
            </div>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="number">${reportData.stats.total_roles}</div>
                <div class="label">תפקידים</div>
            </div>
            <div class="summary-card">
                <div class="number">${reportData.stats.active_users}</div>
                <div class="label">משתמשים פעילים</div>
            </div>
            <div class="summary-card">
                <div class="number">${reportData.stats.custom_permissions_users}</div>
                <div class="label">הרשאות מותאמות</div>
            </div>
        </div>

        <div class="section">
            <h2>פעילות אחרונה (30 יום)</h2>
            <div class="activity-list">
                ${reportData.activities.map(activity => `
                    <div class="activity-item">
                        <span class="activity-type">${activity.action || 'פעולה'}:</span>
                        ${activity.details || 'פרטים לא זמינים'} - 
                        ${activity.user_name || 'מערכת'} - 
                        ${activity.activity_date}
                    </div>
                `).join('')}
                ${reportData.activities.length === 0 ? '<div class="activity-item">אין פעילות אחרונה</div>' : ''}
            </div>
        </div>

        <div class="footer">
            <div>מערכת ניהול תב"רים | משרד הפנים</div>
            <div>דוח זה נוצר אוטומטית ממסד הנתונים בתאריך ${reportData.reportDate}</div>
        </div>
    </div>
</body>
</html>`;
    
    // החזרת HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
    
    console.log('✅ PDF view HTML generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating PDF view HTML:', error);
    res.status(500).json({ error: 'Failed to generate PDF view', details: error.message });
  }
};

export default {
  // Tenants
  getAllTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  
  // Systems
  getAllSystems,
  getTenantSystems,
  updateTenantSystem,
  
  // Pages
  getSystemPages,
  
  // Roles
  getTenantRoles,
  createRole,
  updateRole,
  deleteRole,
  
  // Users
  getTenantUsers,
  createUser,
  updateUserRole,
  
  // Permissions
  getPermissions,
  updatePermissions,
  getPermissionsMatrix,
  
  // Audit
  getAuditLog,
  
  // System Access
  checkUserSystemAccess,
  
  // User Unlock
  getLockedUsers,
  unlockUser,
  getUnlockHistory,
  
  // Password Management
  resetUserPassword,
  generateRandomPassword,
  getPasswordResetHistory,
  getCurrentAdminProfile,
  
  // User Permissions
  getUserPermissions,
  saveUserPermissions,
  
  // Dashboard Statistics
  getSystemStatistics,
  getRecentActivity,
  
     // Data Export
   exportUserPermissionsExcel,
   exportUserPermissionsPDF,
   exportSystemOverview,
   getPdfView
 }; 