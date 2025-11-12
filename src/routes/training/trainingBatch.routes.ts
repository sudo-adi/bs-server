import { Router } from 'express';
import * as trainingBatchController from '@/controllers/training/trainingBatch.controller';

const router = Router();

router.post('/', trainingBatchController.createBatch);
router.get('/', trainingBatchController.getAllBatches);
router.get('/:id', trainingBatchController.getBatchById);
router.patch('/:id', trainingBatchController.updateBatch);
router.delete('/:id', trainingBatchController.deleteBatch);

export default router;
