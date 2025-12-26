import { certificateController } from '@/controllers/certificate';
import { trainingBatchController } from '@/controllers/training';
import { Router } from 'express';

const router = Router();

/**
 * Training Batch Routes
 * Base path: /api/training-batches
 */

// Batch CRUD
router.get('/', (req, res) => trainingBatchController.getAllBatches(req, res));
router.get('/:id', (req, res) => trainingBatchController.getBatchById(req, res));
router.post('/', (req, res) => trainingBatchController.createBatch(req, res));
router.patch('/:id', (req, res) => trainingBatchController.updateBatch(req, res));
router.delete('/:id', (req, res) => trainingBatchController.deleteBatch(req, res));

// Batch Actions
router.post('/:id/start', (req, res) => trainingBatchController.startBatch(req, res));
router.post('/:id/complete', (req, res) => trainingBatchController.completeBatch(req, res));

// Eligible Profiles for Enrollment
router.get('/:id/eligible-profiles', (req, res) =>
  trainingBatchController.getEligibleProfiles(req, res)
);

// Enrollments
router.get('/:id/enrollments', (req, res) => trainingBatchController.getEnrollments(req, res));
router.post('/:id/enrollments', (req, res) => trainingBatchController.createEnrollment(req, res));
router.post('/:id/enrollments/bulk', (req, res) => trainingBatchController.bulkEnrollment(req, res));
router.patch('/enrollments/:enrollmentId', (req, res) =>
  trainingBatchController.updateEnrollment(req, res)
);
router.post('/enrollments/:enrollmentId/complete', (req, res) =>
  trainingBatchController.completeEnrollment(req, res)
);
router.post('/enrollments/:enrollmentId/drop', (req, res) =>
  trainingBatchController.dropEnrollment(req, res)
);
router.delete('/enrollments/:enrollmentId', (req, res) =>
  trainingBatchController.removeEnrollment(req, res)
);

// Trainers
router.get('/:id/trainers', (req, res) => trainingBatchController.getTrainers(req, res));
router.post('/:id/trainers', (req, res) => trainingBatchController.assignTrainer(req, res));
router.delete('/:id/trainers/:trainerId', (req, res) =>
  trainingBatchController.removeTrainer(req, res)
);

// Certificates
router.get('/:batchId/certificates', (req, res) =>
  certificateController.getBatchCertificates(req, res)
);
router.post('/:batchId/certificates/generate', (req, res) =>
  certificateController.generateBatchCertificates(req, res)
);
router.post('/:batchId/certificates/distribute', (req, res) =>
  certificateController.distributeCertificates(req, res)
);

// Training History (by profile)
router.get('/profiles/:profileId/history', (req, res) =>
  trainingBatchController.getProfileTrainingHistory(req, res)
);

export default router;
