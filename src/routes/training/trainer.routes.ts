import { Router } from 'express';
import * as trainerController from '@/controllers/training/trainer.controller';

const router = Router();

/**
 * Trainer routes
 * - For basic profile info (name, email, phone), use the profiles CRUD endpoints
 * - For trainer-specific fields (specialization, certifications, bio), use PUT /:id
 * - Trainers are automatically populated from profiles with "Trainer" as primary skill
 */

router.get('/', trainerController.getAllTrainers);
router.get('/:id', trainerController.getTrainerById);
router.get('/:id/batches', trainerController.getTrainerBatches);
router.put('/:id', trainerController.updateTrainer);

export default router;
