import * as employerDashboardController from '@/controllers/employers/employerDashboard.controller';
import { Router } from 'express';

const router = Router();

// Employer dashboard routes
// GET /api/v1/employer-dashboard/:employerId - Get dashboard overview
router.get('/:employerId', employerDashboardController.getDashboardOverview);

// GET /api/v1/employer-dashboard/:employerId/projects - Get all projects list
router.get('/:employerId/projects', employerDashboardController.getEmployerProjects);

// GET /api/v1/employer-dashboard/:employerId/projects/:projectId - Get project details
router.get('/:employerId/projects/:projectId', employerDashboardController.getProjectDetails);

export default router;
