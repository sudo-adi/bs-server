import { blogController } from '@/controllers';
import { Router } from 'express';

const router = Router();
router.get('/', (req, res) => blogController.getAll(req, res));
router.get('/:id', (req, res) => blogController.getById(req, res));
router.post('/', (req, res) => blogController.create(req, res));
router.patch('/:id', (req, res) => blogController.update(req, res));
router.delete('/:id', (req, res) => blogController.delete(req, res));

export default router;
