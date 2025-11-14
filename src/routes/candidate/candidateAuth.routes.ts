import * as candidateAuthController from '@/controllers/candidate/candidateAuth.controller';
import { candidateAuth } from '@/middlewares/candidateAuth';
import { Router } from 'express';

const router = Router();

// Public routes
router.post('/send-otp', candidateAuthController.sendOTP);
router.post('/verify-otp', candidateAuthController.verifyOTP);

// Protected routes (require authentication)
router.get('/me', candidateAuth, candidateAuthController.getMe);

export default router;
