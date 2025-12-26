/**
 * Employer Portal Routes
 * Base path: /api/employer-portal
 *
 * These routes are specifically for employer-facing functionality.
 * All routes require employer authentication.
 */

import { employerPortalController } from '@/controllers/employerPortal';
import { authMiddleware, employerOnly } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(employerOnly);

// ============================================================================
// Employer Info
// ============================================================================

/**
 * GET /api/employer-portal/me
 * Get current employer's info including authorized persons
 */
router.get('/me', (req, res) => employerPortalController.getMe(req, res));

// ============================================================================
// Project Requests
// ============================================================================

/**
 * GET /api/employer-portal/project-requests
 * Get list of project requests submitted by the employer
 * Query params: status, page, limit
 */
router.get('/project-requests', (req, res) =>
  employerPortalController.getProjectRequests(req, res)
);

/**
 * POST /api/employer-portal/project-requests
 * Submit a new project request
 */
router.post('/project-requests', (req, res) =>
  employerPortalController.createProjectRequest(req, res)
);

/**
 * GET /api/employer-portal/project-requests/:id
 * Get details of a specific project request
 */
router.get('/project-requests/:id', (req, res) =>
  employerPortalController.getProjectRequestById(req, res)
);

// ============================================================================
// Projects
// ============================================================================

/**
 * GET /api/employer-portal/projects
 * Get list of employer's approved projects
 * Query params: stage, page, limit
 */
router.get('/projects', (req, res) => employerPortalController.getProjects(req, res));

/**
 * GET /api/employer-portal/projects/:id
 * Get details of a specific project
 * - If project is in 'planning' stage: returns only stage info
 * - If project is 'shared' or beyond: returns full details including workers
 */
router.get('/projects/:id', (req, res) => employerPortalController.getProjectById(req, res));

export default router;
