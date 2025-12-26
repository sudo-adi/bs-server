import { Router } from 'express';
import roleController from '@/controllers/role/role.controller';
import { authMiddleware, internalOnly } from '@/middlewares/auth';

const router = Router();

/**
 * Role Routes
 * Base path: /api/roles
 * Protected: Internal staff only
 */

// Role CRUD
router.get('/', authMiddleware, internalOnly, (req, res) => roleController.getAllRoles(req, res));
router.get('/:id', authMiddleware, internalOnly, (req, res) => roleController.getRoleById(req, res));
router.post('/', authMiddleware, internalOnly, (req, res) => roleController.createRole(req, res));
router.patch('/:id', authMiddleware, internalOnly, (req, res) => roleController.updateRole(req, res));
router.delete('/:id', authMiddleware, internalOnly, (req, res) => roleController.deleteRole(req, res));

// Permissions
router.post('/:id/permissions', authMiddleware, internalOnly, (req, res) => roleController.addPermission(req, res));
router.patch('/:id/permissions/:permissionId', authMiddleware, internalOnly, (req, res) => roleController.updatePermission(req, res));
router.delete('/:id/permissions/:permissionId', authMiddleware, internalOnly, (req, res) => roleController.deletePermission(req, res));

export default router;
