/**
 * Employer Routes Index
 * Central routing configuration for all employer-related endpoints
 */

import { Router } from 'express';
import employerRoutes from './employer.routes';
import employerAuthorizedPersonRoutes from './employerAuthorizedPerson.routes';
import projectRequestRoutes from './projectRequest.routes';

const router = Router();

/**
 * Employer Routes Structure:
 *
 * /api/employers
 *   - Main employer CRUD operations (admin only)
 *
 * /api/employers/authorized-persons
 *   - Manage employer authorized persons
 *
 * /api/employers/project-requests
 *   - Manage employer project requests
 */

router.use('/', employerRoutes);
router.use('/authorized-persons', employerAuthorizedPersonRoutes);
router.use('/project-requests', projectRequestRoutes);

export default router;
