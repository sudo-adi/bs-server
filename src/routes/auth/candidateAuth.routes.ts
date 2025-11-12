import * as candidateAuthController from '@/controllers/auth/candidateAuth.controller';
import { Router } from 'express';

const router = Router();

// Public routes
router.post('/send-otp', candidateAuthController.sendOTP);
router.post('/verify-otp', candidateAuthController.verifyOTP);

// Get current candidate (no auth required)
router.get('/me', candidateAuthController.getCurrentCandidate);

export default router;
