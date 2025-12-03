/**
 * Candidate Routes Index
 * Central routing configuration for all candidate-related endpoints
 */

import { Router } from 'express';
import candidateAuthRoutes from './workerAuth.routes';

const router = Router();
router.use('/auth', candidateAuthRoutes);

export default router;
