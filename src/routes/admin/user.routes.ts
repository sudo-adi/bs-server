import * as userController from '@/controllers/admin/user.controller';
import { Router } from 'express';

const router = Router();

router.post('/', userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.post('/:id/change-password', userController.changePassword);
router.put('/:id/activate', userController.activateUser);
router.put('/:id/deactivate', userController.deactivateUser);
router.delete('/:id', userController.deleteUser);

export default router;
