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
  exportBudgetItemsPDF
} from '../controllers/reportsController.js';
import {
  exportFullTabarPDF,
  exportTabarBudgetPDF
} from '../controllers/reportsPdfController.js';

const router = express.Router();

// Budget Items routes (must be before other routes to avoid conflicts)
router.get('/budget-items', getBudgetItems);
router.post('/budget-items/export-pdf', exportBudgetItemsPDF);

// PDF Export routes from reportsPdfController
router.get('/full-tabar/export-pdf', exportFullTabarPDF);
router.get('/tabar-budget/export-pdf', exportTabarBudgetPDF);

// Execution reports routes (must come before generic /:id routes)
router.get('/execution', getExecutionReports);
router.get('/execution/:id', getExecutionReportById);
router.post('/execution', uploadReportFile.single('file'), createExecutionReport);
router.put('/execution/:id', updateExecutionReport);
router.delete('/execution/:id', deleteExecutionReport);

// Advanced Reports routes
router.get('/budget-execution', getBudgetExecutionReport);
router.get('/invoices', getInvoicesReport);
router.get('/ministry', getMinistryReport);
router.get('/cash-flow', getCashFlowReport);
router.post('/export', exportReportToExcel);

// Standard reports routes (these should be last)
router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
