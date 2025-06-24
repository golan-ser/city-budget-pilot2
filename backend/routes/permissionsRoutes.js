import express from 'express';
import {
  getAllPermissions,
  getPermissionsById,
  createPermissions,
  updatePermissions,
  deletePermissions,
  // 🔐 RBAC: New permission management functions
  getCurrentUserPermissions,
  getAllRoles,
  getAllPages,
  getPermissionsByRole,
  updateRolePermissions,
  createRole,
  checkSpecificPermission
} from '../controllers/permissionsController.js';
// 🔐 SECURITY: Import authentication middleware
import auth from '../middleware/auth.js';

const router = express.Router();

// 🔐 RBAC: New permission management routes
router.get('/current-user', auth, getCurrentUserPermissions);
router.get('/roles', auth, getAllRoles);
router.get('/pages', auth, getAllPages);
router.get('/roles/:roleId', auth, getPermissionsByRole);
router.put('/roles/:roleId', auth, updateRolePermissions);
router.post('/roles', auth, createRole);
router.get('/check/:pageId/:action', auth, checkSpecificPermission);

// 🔐 SECURITY: Original routes with authentication
router.get('/', auth, getAllPermissions);
router.get('/:id', auth, getPermissionsById);
router.post('/', auth, createPermissions);
router.put('/:id', auth, updatePermissions);
router.delete('/:id', auth, deletePermissions);

export default router;
