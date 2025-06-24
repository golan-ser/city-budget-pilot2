// Fixed lock functions for adminController.js

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
        COALESCE(t.name, 'Unknown') as tenant_name,
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