import express from 'express';
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getProjectDocuments,
  createProjectDocument,
  updateProjectDocument,
  deleteProjectDocument,
  getProjectDocumentStats,
  upload
} from '../controllers/documentsController.js';

const router = express.Router();

// נתיבים כלליים (תאימות לאחור)
router.get('/', getAllDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.post('/', upload.single('file'), createDocument);
router.put('/:id', upload.single('file'), updateDocument);
router.delete('/:id', deleteDocument);

// נתיבים למודול המסמכים המתקדם
router.get('/project/:projectId', getProjectDocuments);
router.get('/project/:projectId/stats', getProjectDocumentStats);
router.post('/project/:projectId', upload.single('file'), createProjectDocument);
router.put('/project/:projectId/:documentId', upload.single('file'), updateProjectDocument);
router.delete('/project/:projectId/:documentId', deleteProjectDocument);

export default router;
