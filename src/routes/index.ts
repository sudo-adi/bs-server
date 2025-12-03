import { Router } from 'express';

// Feature module routes
import adminRoutes from './admin';
import authRoutes from './auth';
import blogRoutes from './blog';
import certificateRoutes from './certificates';
import employerRoutes from './employers';
import { notificationRoutes } from './notifications';
import profileRoutes from './profiles';
import projectRoutes from './projects';
import trainingRoutes from './training';
import utilityRoutes from './utilities';
import candidateRoutes from './worker';
import workerDetailsRoutes from './workerDetails';

// Standalone worker routes (not grouped in worker/index.ts)
import employerDashboardRoutes from './employers/employerDashboard.routes';
import workerPortalRoutes from './worker/workerPortal.routes';
import workerRegistrationRoutes from './worker/workerRegistration.routes';

const router = Router();

/**
 * Main API Routes
 *
 * All routes are organized by feature module for better maintainability.
 * Each module's index.ts handles its own sub-routing internally.
 */

// Utility routes (includes health checks)
router.use('/', utilityRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Candidate routes
router.use('/candidate', candidateRoutes);

// Profile routes
router.use('/profiles', profileRoutes);

// Admin routes (users, roles, permissions, skill categories)
router.use('/', adminRoutes);

// Employer routes
router.use('/employers', employerRoutes);
router.use('/employer-dashboard', employerDashboardRoutes);

// Worker routes
router.use('/worker', workerRegistrationRoutes);
router.use('/worker', workerPortalRoutes);

// Project routes (projects, requests, resource requirements)
router.use('/', projectRoutes);

// Training routes (batches, enrollments)
router.use('/', trainingRoutes);

// Worker details routes
router.use('/workerdetails', workerDetailsRoutes);

// Blog routes
router.use('/blogs', blogRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Certificate routes
router.use('/certificates', certificateRoutes);

export default router;
