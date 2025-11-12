import * as employerController from '@/controllers/employers/employer.controller';
import { Router } from 'express';

const router = Router();

// Admin routes for managing employers
router.post('/', employerController.createEmployer);
router.get('/', employerController.getAllEmployers);
router.get('/:id', employerController.getEmployerById);
router.post('/:id/verify', employerController.verifyEmployer);
router.patch('/:id', employerController.updateEmployer);
router.delete('/:id', employerController.deleteEmployer);

export default router;
