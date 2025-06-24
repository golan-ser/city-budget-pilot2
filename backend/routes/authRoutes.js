import express from 'express';
import { login, logout, getProfile, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// התחברות
router.post('/login', login);

// התנתקות
router.post('/logout', logout);

// קבלת פרופיל המשתמש הנוכחי
router.get('/profile', authenticate, getProfile);

// יצירת משתמש חדש
router.post('/register', register);

export default router; 