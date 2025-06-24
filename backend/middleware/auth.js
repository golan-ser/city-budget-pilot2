import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { checkRoutePermission } from './rbac.js';

// Demo token for initial testing
const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';
const JWT_SECRET = process.env.JWT_SECRET || 'temp-secret-change-in-production';

// Middleware לבדיקת אימות
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const demoToken = req.headers['x-demo-token'];
    
    // בדיקת Demo Token (זמני לפיתוח)
    if (demoToken === DEMO_TOKEN) {
      req.user = {
        id: 1,
        user_id: 1,
        tenant_id: 1,
        role: 'demo',
        role_name: 'admin',
        email: 'demo@demo.com',
        full_name: 'Demo User',
        status: 'active'
      };
      
      console.log('🔓 DEMO TOKEN ACCEPTED: User authenticated with demo token');
      
      // 🔐 RBAC: בדיקת הרשאות לפי route (גם עבור demo user)
      return checkRoutePermission(req, res, next);
    }
    
    // בדיקת JWT Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // בדיקה שהטוקן עדיין תקף במסד הנתונים
        const sessionQuery = `
          SELECT us.*, u.full_name, u.role, u.status as user_status, t.status as tenant_status
          FROM user_sessions us
          JOIN users u ON us.user_id = u.user_id
          JOIN tenants t ON us.tenant_id = t.tenant_id
          WHERE us.token = $1 AND us.expires_at > NOW()
        `;
        
        const sessionResult = await db.query(sessionQuery, [token]);
        
        if (sessionResult.rows.length === 0) {
          return res.status(401).json({ error: 'Token expired or invalid' });
        }
        
        const session = sessionResult.rows[0];
        
        if (session.user_status !== 'active' || session.tenant_status !== 'active') {
          return res.status(401).json({ error: 'User or tenant is inactive' });
        }
        
        req.user = {
          user_id: session.user_id,
          tenant_id: session.tenant_id,
          role: session.role,
          full_name: session.full_name
        };
        
        // 🔐 RBAC: בדיקת הרשאות לפי route
        return checkRoutePermission(req, res, next);
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
    
    return res.status(401).json({ error: 'Authorization required' });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware לבדיקת הרשאות
export const authorize = (requiredRole = null) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (requiredRole && req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// פונקציה ליצירת hash של סיסמא
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// פונקציה לבדיקת סיסמא
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// פונקציה ליצירת JWT token
export const generateToken = (user, tenant_id) => {
  return jwt.sign(
    { 
      user_id: user.user_id, 
      tenant_id: tenant_id,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// פונקציה לשמירת session במסד הנתונים
export const createSession = async (user_id, tenant_id, token) => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // תוקף ל-24 שעות
  
  const query = `
    INSERT INTO user_sessions (user_id, tenant_id, token, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING session_id
  `;
  
  const result = await db.query(query, [user_id, tenant_id, token, expiresAt]);
  return result.rows[0];
};

// פונקציה למחיקת session
export const deleteSession = async (token) => {
  const query = 'DELETE FROM user_sessions WHERE token = $1';
  await db.query(query, [token]);
};

// Default export for middleware
export default authenticate; 