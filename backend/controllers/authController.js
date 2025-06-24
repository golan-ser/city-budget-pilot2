import db from '../db.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  createSession, 
  deleteSession 
} from '../middleware/auth.js';

// קבועים למערכת הנעילה
const MAX_FAILED_ATTEMPTS = 3;

// פונקציה לרישום ניסיון התחברות כושל
const recordFailedAttempt = async (userId, ipAddress, userAgent) => {
  try {
    // עדכון מספר הניסיונות הכושלים
    const updateResult = await db.query(`
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked = CASE 
            WHEN failed_login_attempts + 1 >= $1 THEN TRUE 
            ELSE locked 
          END,
          locked_at = CASE 
            WHEN failed_login_attempts + 1 >= $1 THEN NOW() 
            ELSE locked_at 
          END
      WHERE id = $2
      RETURNING failed_login_attempts, locked
    `, [MAX_FAILED_ATTEMPTS, userId]);

    const user = updateResult.rows[0];
    
    // רישום באודיט לוג
    await db.query(`
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES ($1, 'failed_login', 'user', $1, $2, $3)
    `, [
      userId, 
      user.locked ? `Account locked after ${user.failed_login_attempts} failed attempts` : `Failed login attempt ${user.failed_login_attempts}`,
      ipAddress
    ]);

    return user;
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    throw error;
  }
};

// פונקציה לאיפוס ניסיונות כושלים אחרי התחברות מוצלחת
const resetFailedAttempts = async (userId) => {
  try {
    await db.query(`
      UPDATE users 
      SET failed_login_attempts = 0,
          locked = FALSE,
          locked_at = NULL
      WHERE id = $1
    `, [userId]);
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
    throw error;
  }
};

// התחברות
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    // שליפת המשתמש עם פרטי הרשות
    const userQuery = `
      SELECT u.*, t.name as tenant_name, t.status as tenant_status, r.name as role_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.tenant_id
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = $1 AND u.status = 'active'
    `;
    
    const userResult = await db.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'שם משתמש או סיסמא שגויים' 
      });
    }
    
    const user = userResult.rows[0];
    
    // בדיקה אם החשבון נעול
    if (user.locked) {
      const hoursLocked = Math.floor((new Date() - new Date(user.locked_at)) / (1000 * 60 * 60));
      return res.status(423).json({ 
        success: false, 
        error: `החשבון נעול עקב ${user.failed_login_attempts} ניסיונות התחברות כושלים. החשבון נעול כבר ${hoursLocked} שעות. לשחרור החשבון פנה למנהל המערכת.`,
        locked: true,
        lockedAt: user.locked_at,
        failedAttempts: user.failed_login_attempts
      });
    }
    
    // בדיקת סטטוס הרשות
    if (user.tenant_status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        error: 'הרשות אינה פעילה במערכת' 
      });
    }
    
    // בדיקת סיסמא
    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      // רישום ניסיון כושל
      const updatedUser = await recordFailedAttempt(user.id, ipAddress, userAgent);
      
      const remainingAttempts = MAX_FAILED_ATTEMPTS - updatedUser.failed_login_attempts;
      
      if (updatedUser.locked) {
        return res.status(423).json({ 
          success: false, 
          error: `החשבון נעול עקב ${updatedUser.failed_login_attempts} ניסיונות התחברות כושלים. לשחרור החשבון פנה למנהל המערכת.`,
          locked: true,
          failedAttempts: updatedUser.failed_login_attempts
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          error: `שם משתמש או סיסמא שגויים. נותרו ${remainingAttempts} ניסיונות לפני נעילת החשבון.`,
          remainingAttempts
        });
      }
    }
    
    // התחברות מוצלחת - איפוס ניסיונות כושלים
    await resetFailedAttempts(user.id);
    
    // יצירת JWT token
    const token = generateToken(user, user.tenant_id);
    
    // שמירת session במסד הנתונים
    await createSession(user.id, user.tenant_id, token);
    
    // עדכון last_login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // רישום התחברות מוצלחת באודיט לוג
    await db.query(`
      INSERT INTO audit_log (user_id, tenant_id, action, resource_type, resource_id, details, ip_address)
      VALUES ($1, $2, 'login', 'user', $1, 'Successful login', $3)
    `, [user.id, user.tenant_id, ipAddress]);
    
    // החזרת פרטי המשתמש (ללא password_hash)
    const userResponse = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_name: user.role_name,
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name
    };
    
    res.json({
      success: true,
      message: 'התחברות מוצלחת',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'שגיאה בהתחברות למערכת' 
    });
  }
};

// התנתקות
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await deleteSession(token);
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
};

// בדיקת סטטוס המשתמש הנוכחי
export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // שליפת פרטי המשתמש המעודכנים
    const userQuery = `
      SELECT u.user_id, u.full_name, u.email, u.role, u.last_login,
             t.tenant_id, t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.tenant_id
      WHERE u.user_id = $1 AND u.status = 'active'
    `;
    
    const userResult = await db.query(userQuery, [req.user.user_id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: userResult.rows[0]
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get profile' 
    });
  }
};

// יצירת משתמש חדש (לעתיד)
export const register = async (req, res) => {
  try {
    const { full_name, email, password, tenant_id } = req.body;
    
    // בדיקות validation
    if (!full_name || !email || !password || !tenant_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    // בדיקה שהמייל לא קיים
    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    
    // יצירת hash לסיסמא
    const password_hash = await hashPassword(password);
    
    // הכנסת המשתמש החדש
    const insertQuery = `
      INSERT INTO users (full_name, email, password_hash, tenant_id, role)
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING user_id, full_name, email, role, tenant_id
    `;
    
    const result = await db.query(insertQuery, [
      full_name, email, password_hash, tenant_id
    ]);
    
    const newUser = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed' 
    });
  }
}; 