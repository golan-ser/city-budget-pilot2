import express from 'express';
import {
  getAllPermissions,
  getPermissionsById,
  createPermissions,
  updatePermissions,
  deletePermissions
} from '../controllers/permissionsController.js';

const router = express.Router();

router.get('/', getAllPermissions);
router.get('/:id', getPermissionsById);
router.post('/', createPermissions);
router.put('/:id', updatePermissions);
router.delete('/:id', deletePermissions);

export default router;
