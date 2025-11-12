import * as employeeRegistrationController from '@/controllers/employers/employeeRegistration.controller';
import { Router } from 'express';

const router = Router();

// Public routes (no auth required)
router.post('/register', employeeRegistrationController.registerEmployee);
router.get('/status/:mobile_number', employeeRegistrationController.checkRegistrationStatus);

export default router;
