import * as projectController from '@/controllers/projects/project.controller';
import { Router } from 'express';

const router = Router();

router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.get('/:id/matched-profiles', projectController.getMatchedProfiles); // Skill matching
router.patch('/:id', projectController.updateProject);
router.patch('/:id/approve', projectController.approveProject); // Approve or reject project
router.delete('/:id', projectController.deleteProject);

// New routes for enhanced match workers workflow
router.post('/:id/matched-profiles', projectController.saveMatchedProfiles);
router.post('/:id/share-with-employer', projectController.shareWithEmployer);
router.get('/:id/shared-profiles', projectController.getSharedProfiles);

export default router;
