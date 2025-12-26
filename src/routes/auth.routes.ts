import authController from '@/controllers/auth/auth.controller';
import { Router } from 'express';

const router = Router();

/**
 * Unified Auth Routes
 * Base: /api/auth
 *
 * Supports:
 * - Workers (blue, white, trainer): OTP or password
 * - Employers: OTP or password
 * - Admins: password only
 */

// Check if phone exists (public - for registration validation)
router.get('/check-phone', (req, res) => authController.checkPhoneExists(req, res));

// Send OTP (for login/signup/reset)
router.post('/otp', (req, res) => authController.sendOtp(req, res));

// Signup (worker or employer)
router.post('/signup', (req, res) => authController.signup(req, res));

// Login (worker, employer, or admin)
router.post('/login', (req, res) => authController.login(req, res));

// Logout
router.post('/logout', (req, res) => authController.logout(req, res));

// Password reset
router.post('/reset-password/initiate', (req, res) => authController.initiateReset(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

// Change password (authenticated)
router.post('/change-password', (req, res) => authController.changePassword(req, res));

// Get current user (authenticated)
router.get('/me', (req, res) => authController.me(req, res));

export default router;
