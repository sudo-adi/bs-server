import { Router } from 'express';
import * as batchEnrollmentController from '@/controllers/training/batchEnrollment.controller';

const router = Router();

router.post('/', batchEnrollmentController.createEnrollment);
router.post('/bulk', batchEnrollmentController.bulkEnrollProfiles); // CRITICAL: Bulk enroll
router.post('/bulk/complete', batchEnrollmentController.bulkMarkCompleted); // Bulk mark as completed
router.post('/bulk/drop', batchEnrollmentController.bulkMarkDropped); // Bulk mark as dropped
router.get('/', batchEnrollmentController.getAllEnrollments);
router.get('/:id', batchEnrollmentController.getEnrollmentById);
router.patch('/:id', batchEnrollmentController.updateEnrollment);
router.delete('/:id', batchEnrollmentController.deleteEnrollment);

export default router;
