import { Router } from 'express';
import { rolePermissionController } from '../../controllers/admin/rolePermission.controller';
import { authMiddleware } from '../../middlewares/auth';
import { requireSuperAdmin } from '../../middlewares/permissions';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Role management routes (super admin only)
router.get('/roles', requireSuperAdmin, rolePermissionController.getAllRoles);
router.get('/roles/active', rolePermissionController.getActiveRoles);
router.get('/roles/:id', requireSuperAdmin, rolePermissionController.getRoleById);
router.post('/roles', requireSuperAdmin, rolePermissionController.createRole);
router.put('/roles/:id', requireSuperAdmin, rolePermissionController.updateRole);
router.delete('/roles/:id', requireSuperAdmin, rolePermissionController.deleteRole);

// User-role assignment routes (super admin only)
router.post(
  '/users/:userId/assign-role',
  requireSuperAdmin,
  rolePermissionController.assignRoleToUser
);
router.delete(
  '/users/:userId/remove-role',
  requireSuperAdmin,
  rolePermissionController.removeRoleFromUser
);
router.get('/roles/:roleId/users', requireSuperAdmin, rolePermissionController.getUsersByRole);

// Permission check routes
router.get('/users/:userId/permissions', rolePermissionController.getUserPermissions);
router.post('/users/:userId/check-permission', rolePermissionController.checkPermission);

export default router;
