/**
 * Training Routes Index
 * Central routing configuration for all training-related endpoints
 */

import { Router } from 'express';
import trainingBatchRoutes from './trainingBatch.routes';
import batchEnrollmentRoutes from './batchEnrollment.routes';
import trainerRoutes from './trainer.routes';
import trainerCsvImportRoutes from './trainerCsvImport.routes';

const router = Router();

/**
 * Training Routes Structure:
 *
 * /api/trainers
 *   - Trainer management
 *
 * /api/trainers/csv
 *   - CSV import and export operations
 *
 * /api/training-batches
 *   - Training batch management
 *
 * /api/batch-enrollments
 *   - Batch enrollment management
 */

router.use('/trainers', trainerRoutes);
router.use('/trainers/csv', trainerCsvImportRoutes);
router.use('/training-batches', trainingBatchRoutes);
router.use('/batch-enrollments', batchEnrollmentRoutes);

export default router;
