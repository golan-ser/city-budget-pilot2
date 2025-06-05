import express from 'express';
import {
  getAllDocuments,
  getDocumentsById,
  createDocuments,
  updateDocuments,
  deleteDocuments
} from '../controllers/documentsController.js';

const router = express.Router();

router.get('/', getAllDocuments);
router.get('/:id', getDocumentsById);
router.post('/', createDocuments);
router.put('/:id', updateDocuments);
router.delete('/:id', deleteDocuments);

export default router;
