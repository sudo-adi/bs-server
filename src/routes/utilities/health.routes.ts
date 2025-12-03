import { healthCheck, readinessCheck } from '@/controllers/utilities/health.controller';
import { Router } from 'express';

const router = Router();

router.get('/health', healthCheck);
router.get('/ready', readinessCheck);

export default router;
