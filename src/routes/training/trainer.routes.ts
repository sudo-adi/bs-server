import { Router } from 'express';
import * as trainerController from '@/controllers/training/trainer.controller';

const router = Router();

router.post('/', trainerController.createTrainer);
router.get('/', trainerController.getAllTrainers);
router.get('/:id', trainerController.getTrainerById);
router.get('/:id/batches', trainerController.getTrainerBatches);
router.patch('/:id', trainerController.updateTrainer);
router.delete('/:id', trainerController.deleteTrainer);

export default router;
