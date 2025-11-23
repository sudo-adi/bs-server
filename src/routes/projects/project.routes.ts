import * as projectController from '@/controllers/projects/project.controller';
import * as projectStatusController from '@/controllers/projects/projectStatus.controller';
import { Router } from 'express';

const router = Router();

// ==================== Basic Project CRUD ====================
router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', projectController.updateProject);
router.patch('/:id/approve', projectController.approveProject); // Approve or reject project
router.delete('/:id', projectController.deleteProject);

// Create project from project request (approve and convert request to project)
router.post('/from-request/:projectRequestId', projectController.createProjectFromRequest);

// ==================== Match Workers Workflow ====================
router.get('/:id/matched-profiles', projectController.getMatchedProfiles); // Skill matching
router.post('/:id/matched-profiles', projectController.saveMatchedProfiles);
router.post('/:id/share-with-employer', projectController.shareWithEmployer);
router.get('/:id/shared-profiles', projectController.getSharedProfiles);

// ==================== Project Status Lifecycle ====================

// Generic status transition
router.post('/:id/status/transition', projectStatusController.transitionStatus);

// Specific status transitions
router.post('/:id/status/hold', projectStatusController.holdProject);
router.post('/:id/status/resume', projectStatusController.resumeProject);
router.post('/:id/status/start', projectStatusController.startProject);
router.post('/:id/status/complete', projectStatusController.completeProject);
router.post('/:id/status/short-close', projectStatusController.shortCloseProject);
router.post('/:id/status/terminate', projectStatusController.terminateProject);

// Status history and documents
router.get('/:id/status/history', projectStatusController.getStatusHistory);
router.get('/:id/status/documents', projectStatusController.getStatusDocuments);

// Note: These must be defined separately to avoid :id conflict
router.get('/status/history/:historyId', projectStatusController.getStatusHistoryById);
router.get(
  '/status/history/:historyId/documents',
  projectStatusController.getDocumentsByHistoryId
);

export default router;
