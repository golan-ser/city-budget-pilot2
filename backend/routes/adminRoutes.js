import express from 'express';
import adminController, { getUserPermissions, saveUserPermissions, getSystemStatistics, getRecentActivity, exportUserPermissionsExcel, exportUserPermissionsPDF, exportSystemOverview, exportSystemOverviewPDF, getPdfView } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import db from '../db.js';

const router = express.Router();

// ==================================================
// בדיקת תקינות מערכת (ללא authentication)
// ==================================================

// GET /api/admin/health - בדיקת תקינות מערכת ניהול
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Admin System Management'
  });
});

// GET /api/admin/stats - סטטיסטיקות כלליות (ללא authentication לבדיקה)
router.get('/stats', async (req, res) => {
  try {
    // ספירת רשויות
    const tenantsResult = await db.query('SELECT COUNT(*) as count FROM tenants WHERE status = $1', ['active']);
    
    // ספירת משתמשים
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users WHERE status = $1', ['active']);
    
    // ספירת מערכות (אם הטבלה קיימת)
    let systemsCount = 0;
    try {
      const systemsResult = await db.query('SELECT COUNT(*) as count FROM systems WHERE is_active = true');
      systemsCount = parseInt(systemsResult.rows[0].count);
    } catch (e) {
      console.log('Systems table does not exist yet');
    }
    
    // ספירת הרשאות
    const permissionsResult = await db.query('SELECT COUNT(*) as count FROM permissions');
    
    res.json({
      success: true,
      data: {
        tenants: parseInt(tenantsResult.rows[0].count),
        users: parseInt(usersResult.rows[0].count),
        systems: systemsCount,
        permissions: parseInt(permissionsResult.rows[0].count),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'שגיאה בשליפת סטטיסטיקות', 
      details: error.message 
    });
  }
});

// GET /api/admin/pdf-view - דף HTML לטעינה על ידי Puppeteer (ללא authentication)
router.get('/pdf-view', getPdfView);

// All other admin routes require authentication
router.use(authenticate);

// Simple middleware for admin permission check
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // For now, allow all authenticated users
  next();
};

// ==================================================
// ניהול רשויות (Tenants Management)
// ==================================================

// GET /api/admin/tenants - שליפת כל הרשויות
router.get('/tenants', requireAdmin, adminController.getAllTenants);

// POST /api/admin/tenants - יצירת רשות חדשה
router.post('/tenants', requireAdmin, adminController.createTenant);

// PUT /api/admin/tenants/:id - עדכון רשות
router.put('/tenants/:id', requireAdmin, adminController.updateTenant);

// DELETE /api/admin/tenants/:id - מחיקת רשות
router.delete('/tenants/:id', requireAdmin, adminController.deleteTenant);

// ==================================================
// ניהול מערכות (Systems Management)
// ==================================================

// GET /api/admin/systems - שליפת כל המערכות
router.get('/systems', requireAdmin, adminController.getAllSystems);

// GET /api/admin/tenants/:tenantId/systems - שליפת מערכות לרשות
router.get('/tenants/:tenantId/systems', requireAdmin, adminController.getTenantSystems);

// PUT /api/admin/tenants/:tenantId/systems/:systemId - עדכון מערכת לרשות
router.put('/tenants/:tenantId/systems/:systemId', requireAdmin, adminController.updateTenantSystem);

// GET /api/admin/systems/:systemId/pages - שליפת עמודים למערכת
router.get('/systems/:systemId/pages', requireAdmin, adminController.getSystemPages);

// ==================================================
// ניהול תפקידים (Roles Management)
// ==================================================

// GET /api/admin/tenants/:tenantId/roles - שליפת תפקידים לרשות
router.get('/tenants/:tenantId/roles', requireAdmin, adminController.getTenantRoles);

// POST /api/admin/roles - יצירת תפקיד חדש
router.post('/roles', requireAdmin, adminController.createRole);

// PUT /api/admin/roles/:id - עדכון תפקיד
router.put('/roles/:id', requireAdmin, adminController.updateRole);

// DELETE /api/admin/roles/:id - מחיקת תפקיד
router.delete('/roles/:id', requireAdmin, adminController.deleteRole);

// ==================================================
// ניהול משתמשים (Users Management)
// ==================================================

// GET /api/admin/tenants/:tenantId/users - שליפת משתמשים לרשות
router.get('/tenants/:tenantId/users', requireAdmin, adminController.getTenantUsers);

// GET /api/admin/users - שליפת משתמשים (עם query parameter tenantId)
router.get('/users', requireAdmin, adminController.getTenantUsers);

// POST /api/admin/users - יצירת משתמש חדש
router.post('/users', requireAdmin, adminController.createUser);

// PUT /api/admin/users/:userId/role - עדכון תפקיד משתמש
router.put('/users/:userId/role', requireAdmin, adminController.updateUserRole);

// ==================================================
// ניהול הרשאות (Permissions Management)
// ==================================================

// GET /api/admin/permissions - שליפת הרשאות
router.get('/permissions', requireAdmin, adminController.getPermissions);

// PUT /api/admin/permissions - עדכון הרשאות
router.put('/permissions', requireAdmin, adminController.updatePermissions);

// GET /api/admin/permissions/matrix - שליפת מטריצת הרשאות
router.get('/permissions/matrix', requireAdmin, adminController.getPermissionsMatrix);

// ==================================================
// ניהול הרשאות אישיות (User Permissions Management)
// ==================================================

// GET /api/admin/permissions/user - שליפת הרשאות אישיות למשתמש
router.get('/permissions/user', requireAdmin, getUserPermissions);

// POST /api/admin/permissions/user - שמירת הרשאות אישיות למשתמש
router.post('/permissions/user', requireAdmin, saveUserPermissions);

// ==================================================
// Audit Log
// ==================================================

// GET /api/admin/audit - שליפת לוג פעילות
router.get('/audit', requireAdmin, adminController.getAuditLog);

// ==================================================
// System Access Management
// ==================================================

// GET /api/admin/system-access - בדיקת גישה למערכת למשתמש
router.get('/system-access', requireAdmin, adminController.checkUserSystemAccess);

// User unlock management routes
router.get('/locked-users', adminController.getLockedUsers);
router.post('/unlock-user/:userId', adminController.unlockUser);
router.get('/unlock-history', adminController.getUnlockHistory);

// ==================================================
// ניהול סיסמאות (Password Management)
// ==================================================

// POST /api/admin/users/:userId/reset-password - איפוס סיסמא למשתמש
router.post('/users/:userId/reset-password', requireAdmin, adminController.resetUserPassword);

// POST /api/admin/users/:userId/generate-password - יצירת סיסמא אקראית
router.post('/users/:userId/generate-password', requireAdmin, adminController.generateRandomPassword);

// GET /api/admin/password-reset-history - היסטוריית איפוס סיסמאות
router.get('/password-reset-history', requireAdmin, adminController.getPasswordResetHistory);

// GET /api/admin/profile - פרטי המנהל הנוכחי
router.get('/profile', requireAdmin, adminController.getCurrentAdminProfile);

// ==================================================
// סטטיסטיקות דשבורד (Dashboard Statistics)
// ==================================================

// GET /api/admin/statistics - סטטיסטיקות מערכת מפורטות (זמנית ללא requireAdmin לבדיקה)
router.get('/statistics', getSystemStatistics);

// GET /api/admin/statistics/activity - פעילות אחרונה (זמנית ללא requireAdmin לבדיקה)
router.get('/statistics/activity', getRecentActivity);

// GET /api/admin/recent-activity - פעילות אחרונה (זמנית ללא requireAdmin לבדיקה)
router.get('/recent-activity', getRecentActivity);

// ==================================================
// ייצוא נתונים (Data Export)
// ==================================================

// GET /api/admin/export/user-permissions/excel - ייצוא הרשאות משתמשים ל-Excel
router.get('/export/user-permissions/excel', requireAdmin, exportUserPermissionsExcel);

// GET /api/admin/export/user-permissions/pdf - ייצוא הרשאות משתמשים ל-PDF
router.get('/export/user-permissions/pdf', requireAdmin, exportUserPermissionsPDF);

// GET /api/admin/export/overview - ייצוא סקירה כללית של המערכת
router.get('/export/overview', requireAdmin, exportSystemOverview);
// Route שמאפשר גישה עם טוקן ב-query string או ב-header
router.get('/export/overview-pdf', (req, res, next) => {
  // בדיקה אם יש טוקן ב-query string
  if (req.query['x-demo-token'] === 'DEMO_SECURE_TOKEN_2024') {
    return next();
  }
  // אחרת, השתמש ב-middleware הרגיל
  return requireAdmin(req, res, next);
}, exportSystemOverviewPDF);

export default router; 