import { Router } from 'express';
import * as projectRequestController from '@/controllers/employers/projectRequest.controller';

const router = Router();

// Admin routes - view all project requests
router.get('/', projectRequestController.getAll);

// Get project requests by employer
router.get('/employer/:employerId', projectRequestController.getAllByEmployerId);

// CRUD operations
router.get('/:id', projectRequestController.getById);
router.post('/', projectRequestController.create);
router.patch('/:id', projectRequestController.update);
router.post('/:id/review', projectRequestController.review);
router.delete('/:id', projectRequestController.deleteProjectRequest);

export default router;
