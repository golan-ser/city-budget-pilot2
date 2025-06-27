import express from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getExecutionReports,
  getExecutionReportById,
  createExecutionReport,
  updateExecutionReport,
  deleteExecutionReport,
  uploadReportFile,
  getBudgetExecutionReport,
  getInvoicesReport,
  getMinistryReport,
  getCashFlowReport,
  exportReportToExcel,
  getBudgetItems,
  exportBudgetItemsPDF,
  getReportsDashboard
} from '../controllers/reportsController.js';
import {
  exportFullTabarPDF,
  exportTabarBudgetPDF
} from '../controllers/reportsPdfController.js';
// 🔐 SECURITY: Import authentication middleware
import auth from '../middleware/auth.js';

const router = express.Router();

// 🔐 SECURITY: All routes require authentication
// Dashboard route - reports overview (must be before /:id route)
router.get('/reports-dashboard', auth, getReportsDashboard);

// Budget Items routes (must be before other routes to avoid conflicts)
router.get('/budget-items', auth, getBudgetItems);
router.post('/budget-items/export-pdf', auth, exportBudgetItemsPDF);

// PDF Export routes from reportsPdfController
router.get('/full-tabar/export-pdf', auth, exportFullTabarPDF);
router.get('/tabar-budget/export-pdf', auth, exportTabarBudgetPDF);

// Execution reports routes (must come before generic /:id routes)
router.get('/execution', auth, getExecutionReports);
router.get('/execution/:id', auth, getExecutionReportById);
router.post('/execution', auth, uploadReportFile.single('file'), createExecutionReport);
router.put('/execution/:id', auth, updateExecutionReport);
router.delete('/execution/:id', auth, deleteExecutionReport);

// Advanced Reports routes
router.get('/budget-execution', auth, getBudgetExecutionReport);
router.get('/invoices', auth, getInvoicesReport);
router.get('/ministry', auth, getMinistryReport);
router.get('/cash-flow', auth, getCashFlowReport);
router.post('/export', auth, exportReportToExcel);

// Standard reports routes (these should be last)
router.get('/', auth, getReports);
router.get('/:id', auth, getReportById);
router.post('/', auth, createReport);
router.put('/:id', auth, updateReport);
router.delete('/:id', auth, deleteReport);

export default router;
