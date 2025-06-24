// Fixed getPermissionsMatrix function

// שליפת מטריצת הרשאות
export const getPermissionsMatrix = async (req, res) => {
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
      SELECT page_id, page_name, page_path, description
      FROM system_pages 
      WHERE system_id = $1 AND is_active = true
      ORDER BY sort_order, page_name
    `, [systemId || 1]);
    
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
        p.can_admin
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