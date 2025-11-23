import {
  employerLogin,
  sendEmployerOTP,
  sendWorkerOTP,
  teamLogin,
  verifyWorkerOTP,
} from '@/controllers/workerDetails/auth.controller';
import express from 'express';

const router = express.Router();

// Worker authentication
router.post('/send-otp', sendWorkerOTP);
router.post('/verify-otp', verifyWorkerOTP);

// Employer authentication
router.post('/employer-login', employerLogin);
router.post('/employer-send-otp', sendEmployerOTP);

// BuildSewa team authentication
router.post('/team-login', teamLogin);

export default router;
