/**
 * Project Routes Index
 * Central routing configuration for all project-related endpoints
 */

import { Router } from 'express';
import assignmentRoutes from './assignment.routes';
import projectRoutes from './project.routes';
import projectRequestRoutes from './projectRequest.routes';
import projectResourceRequirementRoutes from './projectResourceRequirement.routes';
import projectCsvImportRoutes from './projectCsvImport.routes';

const router = Router();

/**
 * Project Routes Structure:
 *
 * /api/projects
 *   - Main project CRUD operations
 *   - Project status management
 *   - Worker matching and sharing
 *
 * /api/project-requests
 *   - Project request management
 *
 * /api/project-resource-requirements
 *   - Project resource requirement management
 *
 * /api/assignments
 *   - Project assignment and deployment operations
 */

router.use('/projects', projectRoutes);
router.use('/projects/csv', projectCsvImportRoutes);
router.use('/project-requests', projectRequestRoutes);
router.use('/project-resource-requirements', projectResourceRequirementRoutes);
router.use('/project-worker-assignments', assignmentRoutes);

export default router;
