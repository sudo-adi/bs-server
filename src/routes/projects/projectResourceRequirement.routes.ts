import express from 'express';
import * as projectResourceRequirementController from '@/controllers/projects/projectResourceRequirement.controller';

const router = express.Router();

router.post('/', projectResourceRequirementController.createRequirement);
router.post('/bulk', projectResourceRequirementController.bulkCreateRequirements);
router.get('/', projectResourceRequirementController.getAllRequirements);
router.get('/project/:projectId/allocation-status', projectResourceRequirementController.getSkillAllocationStatus);
router.get('/:id', projectResourceRequirementController.getRequirementById);
router.patch('/:id', projectResourceRequirementController.updateRequirement);
router.delete('/:id', projectResourceRequirementController.deleteRequirement);

export default router;
