import express from 'express';
import {
  getAllReports,
  getReportsById,
  createReports,
  updateReports,
  deleteReports
} from '../controllers/reportsController.js';

const router = express.Router();

router.get('/', getAllReports);
router.get('/:id', getReportsById);
router.post('/', createReports);
router.put('/:id', updateReports);
router.delete('/:id', deleteReports);

export default router;
