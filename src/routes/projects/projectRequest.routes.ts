import express from 'express';
import * as projectRequestController from '@/controllers/projects/projectRequest.controller';

const router = express.Router();

router.post('/', projectRequestController.createRequirement);
router.get('/', projectRequestController.getAllRequirements);
router.get('/:id', projectRequestController.getRequirementById);
router.patch('/:id', projectRequestController.updateRequirement);
router.delete('/:id', projectRequestController.deleteRequirement);
router.post('/:id/mark-reviewed', projectRequestController.markAsReviewed);
router.post('/:id/approve', projectRequestController.approveRequest);
router.post('/:id/reject', projectRequestController.rejectRequest);
router.post('/:id/link-project', projectRequestController.linkToProject);

export default router;
