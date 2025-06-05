import express from 'express';
import {
  getAllProjects,
  getProjectsById,
  createProjects,
  updateProjects,
  deleteProjects
} from '../controllers/projectsController.js';

const router = express.Router();

router.get('/', getAllProjects);
router.get('/:id', getProjectsById);
router.post('/', createProjects);
router.put('/:id', updateProjects);
router.delete('/:id', deleteProjects);

export default router;
