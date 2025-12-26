import trainingBatchController from '@/controllers/training/trainingBatch.controller';
import { Router } from 'express';

const router = Router();

/**
 * Enrollment Routes
 * Base path: /api/enrollments
 */

router.patch('/:id', (req, res) => trainingBatchController.updateEnrollment(req, res));
router.patch('/:id/complete', (req, res) => trainingBatchController.completeEnrollment(req, res));
router.patch('/:id/drop', (req, res) => trainingBatchController.dropEnrollment(req, res));

export default router;
