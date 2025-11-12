import { Router } from 'express';
import * as assignmentController from '@/controllers/projects/projectAssignment.controller';

const router = Router();

router.post('/', assignmentController.createAssignment);
router.post('/bulk', assignmentController.bulkDeployProfiles); // CRITICAL: Bulk deploy
router.post('/deploy-project', assignmentController.deployProjectToEmployer); // Deploy project to employer
router.get('/', assignmentController.getAllAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.patch('/:id', assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);
router.post('/:id/activate', assignmentController.activateAssignment);
router.post('/:id/complete', assignmentController.completeAssignment);
router.post('/:id/cancel', assignmentController.cancelAssignment);

export default router;
