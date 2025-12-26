import { uploadController } from '@/controllers/storage';
import { Router } from 'express';

const router = Router();

/**
 * Storage Routes
 * Base path: /api/v1/storage
 */

// Get storage status (S3 or local)
router.get('/status', (req, res) => uploadController.getStorageStatus(req, res));

export default router;
