// תיקונים נדרשים לadminController.js

// 1. תיקון getPermissionsMatrix - הסרת can_admin והוספת can_export
// const permissionsResult = await db.query(`
//   SELECT 
//     p.permission_id,
//     p.role_id,
//     p.page_id,
//     p.can_view,
//     p.can_edit,
//     p.can_create,
//     p.can_delete,
//     p.can_export,
//     p.permission_level
//   FROM permissions p
//   WHERE p.tenant_id = $1 OR p.tenant_id IS NULL
// `, [tenantId || 1]);

// 2. תיקון checkUserSystemAccess - שינוי user_id ל-id
// const query = `
//   SELECT 
//     u.id as user_id,
//     u.full_name,
//     u.tenant_id,
//     t.name as tenant_name,
//     ts.system_id,
//     s.name as system_name,
//     ts.is_active as has_access
//   FROM users u
//   JOIN tenants t ON u.tenant_id = t.tenant_id
//   LEFT JOIN tenant_systems ts ON t.tenant_id = ts.tenant_id AND ts.system_id = $2
//   LEFT JOIN systems s ON ts.system_id = s.system_id
//   WHERE u.id = $1
// `;

console.log('Fix file created'); 