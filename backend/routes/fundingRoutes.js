import express from 'express';
import {
  getAllFunding,
  getFundingById,
  createFunding,
  updateFunding,
  deleteFunding
} from '../controllers/fundingController.js';

const router = express.Router();

router.get('/', getAllFunding);
router.get('/:id', getFundingById);
router.post('/', createFunding);
router.put('/:id', updateFunding);
router.delete('/:id', deleteFunding);

export default router;
