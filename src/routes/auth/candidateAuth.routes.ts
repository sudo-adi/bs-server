import * as candidateAuthController from '@/controllers/auth/candidateAuth.controller';
import { Router } from 'express';

const router = Router();

router.post('/send-otp', candidateAuthController.sendOTP);
router.post('/verify-otp', candidateAuthController.verifyOTP);
router.get('/me', candidateAuthController.getCurrentCandidate);

export default router;
