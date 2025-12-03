import * as candidateAuthController from '@/controllers/worker/workerAuth.controller';
import { candidateAuth } from '@/middlewares/candidateAuth';
import { Router } from 'express';

const router = Router();

// ==================== Public Authentication Routes ====================

router.post('/send-otp', candidateAuthController.sendOTP);
router.post('/verify-otp', candidateAuthController.verifyOTP);

// ==================== Protected Routes ====================

router.get('/me', candidateAuth, candidateAuthController.getMe);

export default router;
