import * as employerAuthController from '@/controllers/auth/employerAuth.controller';
import { Router } from 'express';

const router = Router();

router.post('/register', employerAuthController.register);
router.post('/login', employerAuthController.login);
router.get('/me', employerAuthController.getCurrentEmployer);

export default router;
