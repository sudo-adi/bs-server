import { Router } from 'express';
import { healthCheck, readinessCheck } from '@/controllers/utilities/health.controller';

const router = Router();

router.get('/health', healthCheck);
router.get('/ready', readinessCheck);

export default router;
