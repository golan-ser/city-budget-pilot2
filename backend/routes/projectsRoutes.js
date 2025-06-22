import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  exportProjectPDF,
  getProjectAnalytics,
  createProjectFromTabar
} from '../controllers/projectsController.js';
import {
  getProjectDocuments,
  createProjectDocument,
  upload
} from '../controllers/documentsController.js';

const router = express.Router();

// Basic project routes
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.post('/from-tabar', createProjectFromTabar);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Analytics route
router.get('/:id/analytics', getProjectAnalytics);

// PDF Export route
router.get('/:id/export-pdf', exportProjectPDF);

// Document routes for projects
router.get('/:id/documents', getProjectDocuments);
router.post('/:id/documents', upload.single('file'), createProjectDocument);

export default router;
