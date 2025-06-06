import express from 'express';
import {
  getAllMilestones,
  getMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/milestonesController.js';

const router = express.Router();

router.get('/', getAllMilestones);
router.get('/:id', getMilestoneById);
router.post('/', createMilestone);
router.put('/:id', updateMilestone);
router.delete('/:id', deleteMilestone);

export default router;
