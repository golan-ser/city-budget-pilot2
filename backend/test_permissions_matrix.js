import db from './db.js';

async function testPermissionsMatrix() {
  try {
    console.log('Testing permissions matrix...');
    
    // Test roles query
    console.log('\n1. Testing roles query:');
    const rolesResult = await db.query(`
      SELECT role_id, name as role_name, description 
      FROM roles 
      ORDER BY role_id, name
    `);
    console.log('Roles found:', rolesResult.rows.length);
    console.log('Roles:', rolesResult.rows);
    
    // Test system_pages query
    console.log('\n2. Testing system_pages query:');
    const pagesResult = await db.query(`
      SELECT page_id, name as page_name, description
      FROM system_pages 
      ORDER BY name
    `);
    console.log('Pages found:', pagesResult.rows.length);
    console.log('Pages:', pagesResult.rows);
    
    // Test permissions query
    console.log('\n3. Testing permissions query:');
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
    `, [1]);
    console.log('Permissions found:', permissionsResult.rows.length);
    console.log('Permissions:', permissionsResult.rows);
    
    // Build matrix
    const matrix = {
      roles: rolesResult.rows,
      pages: pagesResult.rows,
      permissions: {}
    };
    
    permissionsResult.rows.forEach(permission => {
      const key = `${permission.role_id}-${permission.page_id}`;
      matrix.permissions[key] = permission;
    });
    
    console.log('\n4. Final matrix:');
    console.log('Matrix keys:', Object.keys(matrix.permissions));
    console.log('Matrix structure:', {
      roles: matrix.roles.length,
      pages: matrix.pages.length,
      permissions: Object.keys(matrix.permissions).length
    });
    
  } catch (error) {
    console.error('Error testing permissions matrix:', error);
  } finally {
    process.exit(0);
  }
}

testPermissionsMatrix(); 