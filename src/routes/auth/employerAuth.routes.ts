import * as employerAuthController from '@/controllers/auth/employerAuth.controller';
import { Router } from 'express';

const router = Router();

// Public routes
router.post('/register', employerAuthController.register);
router.post('/login', employerAuthController.login);

// Get current employer (no auth required)
router.get('/me', employerAuthController.getCurrentEmployer);

export default router;
