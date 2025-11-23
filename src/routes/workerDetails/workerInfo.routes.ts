import {
  getMyWorkerInfo,
  getWorkerInfoByUUID,
} from '@/controllers/workerDetails/workerInfo.controller';
import { authMiddleware } from '@/middlewares/auth';
import express from 'express';

const router = express.Router();

// Protected routes - require authentication
router.use(authMiddleware);

// Get worker info by UUID (role-based access)
router.get('/info/:uuid', getWorkerInfoByUUID);

// Get current user's worker info (workers only)
router.get('/me', getMyWorkerInfo);

export default router;
