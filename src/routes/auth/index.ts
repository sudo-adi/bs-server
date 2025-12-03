/**
 * Authentication Routes Index
 * Central routing configuration for all authentication endpoints
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import candidateAuthRoutes from './candidateAuth.routes';
import employerAuthRoutes from './employerAuth.routes';

const router = Router();

/**
 * Auth Routes Structure:
 *
 * /api/auth
 *   - General auth (login, getCurrentUser)
 *
 * /api/auth/candidate
 *   - Candidate-specific authentication
 *
 * /api/auth/employer
 *   - Employer-specific authentication
 */

router.use('/', authRoutes);
router.use('/candidate', candidateAuthRoutes);
router.use('/employer', employerAuthRoutes);

export default router;
