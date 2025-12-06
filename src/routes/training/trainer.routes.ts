import { Router } from 'express';
import * as trainerController from '@/controllers/training/trainer.controller';

const router = Router();

/**
 * Trainer routes - Read-only
 * For creating/updating/deleting trainer details, use the profiles CRUD endpoints
 * Trainers are profiles with "Trainer" skill
 */

router.get('/', trainerController.getAllTrainers);
router.get('/:id', trainerController.getTrainerById);
router.get('/:id/batches', trainerController.getTrainerBatches);

export default router;
