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
  uploadReportFile
} from '../controllers/reportsController.js';
import {
  exportBudgetItemsPDF,
  exportFullTabarPDF,
  exportTabarBudgetPDF
} from '../controllers/reportsPdfController.js';

const router = express.Router();

// PDF Export routes
router.get('/budget-items/export-pdf', exportBudgetItemsPDF);
router.get('/full-tabar/export-pdf', exportFullTabarPDF);
router.get('/tabar-budget/export-pdf', exportTabarBudgetPDF);

// Execution reports routes (must come before generic /:id routes)
router.get('/execution', getExecutionReports);
router.get('/execution/:id', getExecutionReportById);
router.post('/execution', uploadReportFile.single('file'), createExecutionReport);
router.put('/execution/:id', updateExecutionReport);
router.delete('/execution/:id', deleteExecutionReport);

// Standard reports routes
router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
