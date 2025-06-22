import { Router } from 'express';
import {
  getDashboardKPIs,
  getProjectStatusStats,
  getSmartAlerts,
  getTrendData,
  getRecentReports,
  getAdvancedAnalytics,
  getDashboardData,
  exportDashboardPDF
} from '../controllers/dashboardController.js';

const router = Router();

// נתיב לכל נתוני הדשבורד במכה אחת
router.get('/data', getDashboardData);

// נתיבים נפרדים לכל רכיב
router.get('/kpis', getDashboardKPIs);
router.get('/project-status', getProjectStatusStats);
router.get('/alerts', getSmartAlerts);
router.get('/trends', getTrendData);
router.get('/recent-reports', getRecentReports);

// נתיב חדש לאנליטיקה מתקדמת עם הטבלאות החדשות
router.get('/advanced-analytics', getAdvancedAnalytics);

// PDF Export
router.get('/export-pdf', exportDashboardPDF);

export default router; 