import { Router } from 'express';
import {
  getDashboardKPIs,
  getProjectStatusStats,
  getBudgetByMinistry,
  getSmartAlerts,
  getTrendData,
  getRecentReports,
  getAdvancedAnalytics,
  getDashboardData,
  getEnhancedDashboard,
  exportDashboardPDF
} from '../controllers/dashboardController.js';

const router = Router();

// נתיב לדשבורד משופר חדש
router.get('/enhanced', getEnhancedDashboard);

// נתיב לכל נתוני הדשבורד במכה אחת
router.get('/data', getDashboardData);

// נתיבים נפרדים לכל רכיב
router.get('/kpis', getDashboardKPIs);
router.get('/project-status', getProjectStatusStats);
router.get('/budget-by-ministry', getBudgetByMinistry);
router.get('/alerts', getSmartAlerts);
router.get('/trends', getTrendData);
router.get('/recent-reports', getRecentReports);

// נתיב חדש לאנליטיקה מתקדמת עם הטבלאות החדשות
router.get('/advanced-analytics', getAdvancedAnalytics);

// PDF Export
router.get('/export-pdf', exportDashboardPDF);
router.post('/export-pdf', exportDashboardPDF);

export default router; 