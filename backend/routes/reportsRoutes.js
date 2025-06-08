import express from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport
} from '../controllers/reportsController.js';

const router = express.Router();

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
