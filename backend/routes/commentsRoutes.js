import express from 'express';
import {
  getAllComments,
  getCommentById,
  createComment, // 👈 שים לב לשם הזה
  updateComment,
  deleteComment
} from '../controllers/commentsController.js';

const router = express.Router();

router.get('/', getAllComments);
router.get('/:id', getCommentById);
router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;
