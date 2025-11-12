import * as roleController from '@/controllers/admin/role.controller';
import { Router } from 'express';

const router = Router();

// Role management routes
router.get('/', roleController.getAllRoles);
router.post('/', roleController.createRole);
router.get('/:id', roleController.getRoleById);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);
router.get('/:id/users', roleController.getRoleUsers);

// Permission routes
router.post('/check-permission', roleController.checkPermission);
router.get('/permissions/me', roleController.getUserPermissions);

export default router;
