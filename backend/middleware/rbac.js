import db from '../db.js';

// אימות הרשאות לפי תפקיד
const requireRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'לא מחובר למערכת' });
      }

      // בדיקת פרטי המשתמש
      const userQuery = `
        SELECT u.id as user_id, u.tenant_id, u.status, u.role_id,
               COALESCE(r.name, u.role) as role_name, 
               CASE WHEN r.name = 'admin' OR u.role = 'admin' THEN true ELSE false END as is_system_role,
               COALESCE(t.status, 'active') as tenant_status
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
        WHERE u.id = $1
      `;

      const userResult = await db.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'משתמש לא נמצא' });
      }

      const user = userResult.rows[0];

      // בדיקת סטטוס משתמש
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'חשבון המשתמש לא פעיל' });
      }

      // בדיקת הרשאות
      const userRole = user.role_name;
      
      // אדמין תמיד רשאי
      if (userRole === 'admin' || user.is_system_role) {
        req.user = { ...req.user, ...user };
        return next();
      }

      // בדיקת תפקיד מתאים
      if (Array.isArray(requiredRoles)) {
        if (!requiredRoles.includes(userRole)) {
          return res.status(403).json({ error: 'אין הרשאה לפעולה זו' });
        }
      } else if (userRole !== requiredRoles) {
        return res.status(403).json({ error: 'אין הרשאה לפעולה זו' });
      }

      req.user = { ...req.user, ...user };
      next();

    } catch (error) {
      console.error('Error in role check:', error);
      res.status(500).json({ error: 'שגיאה בבדיקת הרשאות' });
    }
  };
};

// אימות הרשאה לעמוד מסוים
const requirePagePermission = (pageName, action = 'view') => {
  return async (req, res, next) => {
    try {
      // DEMO BYPASS
      if (req.user?.email === 'demo@demo.com' || req.user?.role === 'admin') {
        console.log('🔓 DEMO BYPASS: Allowing page access for demo/admin user');
        return next();
      }

      const userId = req.user?.id;
      const tenantId = req.user?.tenant_id;

      if (!userId || !tenantId) {
        return res.status(401).json({ error: 'לא מחובר למערכת' });
      }

      // חיפוש הרשאות לעמוד
      const permissionQuery = `
        SELECT p.can_view, p.can_create, p.can_edit, p.can_delete, p.can_export
        FROM permissions p
        JOIN system_pages sp ON p.page_id = sp.page_id
        WHERE p.tenant_id = $1 AND p.role_id = $2 AND sp.page_name = $3
      `;

      const permissionResult = await db.query(permissionQuery, [
        tenantId,
        req.user.role_id,
        pageName
      ]);

      if (permissionResult.rows.length === 0) {
        return res.status(403).json({ error: 'אין הרשאה לעמוד זה' });
      }

      const permissions = permissionResult.rows[0];

      // בדיקת הרשאה לפעולה המבוקשת
      switch (action) {
        case 'view':
          if (!permissions.can_view) {
            return res.status(403).json({ error: 'אין הרשאה לצפייה' });
          }
          break;
        case 'create':
          if (!permissions.can_create) {
            return res.status(403).json({ error: 'אין הרשאה ליצירה' });
          }
          break;
        case 'edit':
          if (!permissions.can_edit) {
            return res.status(403).json({ error: 'אין הרשאה לעריכה' });
          }
          break;
        case 'delete':
          if (!permissions.can_delete) {
            return res.status(403).json({ error: 'אין הרשאה למחיקה' });
          }
          break;
        case 'export':
          if (!permissions.can_export) {
            return res.status(403).json({ error: 'אין הרשאה לייצוא' });
          }
          break;
        default:
          return res.status(403).json({ error: 'פעולה לא מוכרת' });
      }

      next();

    } catch (error) {
      console.error('Error in page permission check:', error);
      res.status(500).json({ error: 'שגיאה בבדיקת הרשאות עמוד' });
    }
  };
};

// אימות שיוך לרשות
const requireTenant = (req, res, next) => {
  const requestedTenantId = req.params.tenantId || req.body.tenantId;
  const userTenantId = req.user?.tenant_id;

  // DEMO BYPASS
  if (req.user?.email === 'demo@demo.com' || req.user?.role === 'admin') {
    console.log('🔓 DEMO BYPASS: Allowing tenant access for demo/admin user');
    return next();
  }

  if (!userTenantId) {
    return res.status(401).json({ error: 'משתמש לא שייך לרשות' });
  }

  if (requestedTenantId && parseInt(requestedTenantId) !== userTenantId) {
    return res.status(403).json({ error: 'אין הרשאה לרשות זו' });
  }

  next();
};

// פונקציה לבדיקת הרשאות לפי route
const checkRoutePermission = async (req, res, next) => {
  try {
    // DEMO BYPASS
    if (req.user?.role === 'demo' || req.user?.role === 'admin') {
      console.log('🔓 DEMO BYPASS: Allowing route access for demo/admin user');
      return next();
    }

    // כאן אפשר להוסיף לוגיקה מורכבת יותר לבדיקת הרשאות לפי route
    // לעת עתה נאפשר גישה לכל המשתמשים המאומתים
    next();

  } catch (error) {
    console.error('Error in route permission check:', error);
    res.status(500).json({ error: 'שגיאה בבדיקת הרשאות route' });
  }
};

// פונקציה לבדיקת גישה למערכת
const checkSystemAccessMiddleware = async (req, res, next) => {
  try {
    // DEMO BYPASS
    if (req.user?.role === 'demo' || req.user?.role === 'admin') {
      console.log('🔓 DEMO BYPASS: Allowing system access for demo/admin user');
      return next();
    }

    const userId = req.user?.user_id;
    const tenantId = req.user?.tenant_id;

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'לא מחובר למערכת' });
    }

    // בדיקת גישה למערכת עבור הרשות
    const accessQuery = `
      SELECT ts.is_active
      FROM tenant_systems ts
      WHERE ts.tenant_id = $1 AND ts.system_id = 1 AND ts.is_active = true
    `;

    const accessResult = await db.query(accessQuery, [tenantId]);

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'אין גישה למערכת עבור רשות זו' });
    }

    next();

  } catch (error) {
    console.error('Error in system access check:', error);
    res.status(500).json({ error: 'שגיאה בבדיקת גישה למערכת' });
  }
};

export {
  requireRole,
  requirePagePermission,
  requireTenant,
  checkRoutePermission,
  checkSystemAccessMiddleware
};

 