import {
  getWorkerDashboard,
  getWorkerProfile,
  getWorkerProjects,
  getWorkerTraining,
  workerLogin,
} from '@/controllers/employers/employeePortal.controller';
import { authenticateWorker } from '@/middlewares/workerAuth.middleware';
import { Router } from 'express';

const router = Router();

/**
 * Worker Portal Routes
 * Base path: /api/v1/worker
 */

// Public route
router.post('/login', workerLogin);

// Protected routes (require authentication)
router.get('/dashboard', authenticateWorker, getWorkerDashboard);
router.get('/profile', authenticateWorker, getWorkerProfile);
router.get('/training', authenticateWorker, getWorkerTraining);
router.get('/projects', authenticateWorker, getWorkerProjects);

export default router;
