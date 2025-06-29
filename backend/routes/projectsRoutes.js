import express from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  exportProjectPDF,
  getProjectAnalytics,
  createProjectFromTabar,
  getProjectMilestones
} from '../controllers/projectsController.js';
import {
  getProjectDocuments,
  createProjectDocument,
  upload
} from '../controllers/documentsController.js';
// 🔐 SECURITY: Import authentication middleware
import auth from '../middleware/auth.js';

const router = express.Router();

// 🔐 SECURITY: All routes require authentication
// Basic project routes
router.get('/', auth, getAllProjects);
router.get('/:id', auth, getProjectById);
router.post('/', auth, createProject);
router.post('/from-tabar', auth, createProjectFromTabar);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);

// Analytics route
router.get('/:id/analytics', auth, getProjectAnalytics);

// PDF Export route
router.get('/:id/export-pdf', auth, exportProjectPDF);

// Milestones route for projects
router.get('/:id/milestones', auth, getProjectMilestones);

// Document routes for projects
router.get('/:id/documents', auth, getProjectDocuments);
router.post('/:id/documents', auth, upload.single('file'), createProjectDocument);

export default router;
