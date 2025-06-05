import express from 'express';
import {
  getAllMilestones,
  getMilestonesById,
  createMilestones,
  updateMilestones,
  deleteMilestones
} from '../controllers/milestonesController.js';

const router = express.Router();

router.get('/', getAllMilestones);
router.get('/:id', getMilestonesById);
router.post('/', createMilestones);
router.put('/:id', updateMilestones);
router.delete('/:id', deleteMilestones);

export default router;
