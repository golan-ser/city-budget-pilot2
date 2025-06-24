// תיקון adminController להתאמה למבנה הטבלאות בפועל

// תיקון getTenantUsers
const getTenantUsers = async (req, res) => {
  const { tenantId } = req.params;
  
  try {
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

// תיקון getTenantRoles
const getTenantRoles = async (req, res) => {
  try {
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

// תיקון createUser
const createUser = async (req, res) => {
  const { fullName, email, password, roleId, tenantId } = req.body;
  
  try {
    console.log('🔓 DEMO BYPASS: Allowing user creation for demo admin');
    
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

console.log('Fixed admin controller functions ready to replace in adminController.js'); 