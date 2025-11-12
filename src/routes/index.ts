import { Router } from 'express';

// Admin routes
import roleRoutes from './admin/role.routes';
import rolePermissionRoutes from './admin/rolePermission.routes';
import skillCategoryRoutes from './admin/skillCategory.routes';
import userRoutes from './admin/user.routes';

// Auth routes
import authRoutes from './auth/auth.routes';
import candidateAuthRoutes from './auth/candidateAuth.routes';
import employerAuthRoutes from './auth/employerAuth.routes';

// Profile routes
import profileRoutes from './profiles';

// Project routes
import projectRoutes from './projects/project.routes';
import projectRequestRoutes from './projects/projectRequest.routes';
import projectResourceRequirementRoutes from './projects/projectResourceRequirement.routes';

// Training routes
import batchEnrollmentRoutes from './training/batchEnrollment.routes';
import trainingBatchRoutes from './training/trainingBatch.routes';

// Employer routes
import employeeRegistrationRoutes from './employers/employeeRegistration.routes';
import employerRoutes from './employers';

// Utility routes
import healthRoutes from './utilities/health.routes';
import newsUpdateRoutes from './utilities/newsUpdate.routes';
import scraperWebsiteRoutes from './utilities/scraperWebsite.routes';
import socialMediaRoutes from './utilities/socialMedia.routes';
import socialMediaPostRoutes from './utilities/socialMediaPost.routes';

const router = Router();

// Health routes (no prefix needed - handled at app level)
router.use('/', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);
router.use('/auth/candidate', candidateAuthRoutes);
router.use('/auth/employer', employerAuthRoutes);

// Employee registration (public)
router.use('/employee', employeeRegistrationRoutes);

// API routes
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/role-permissions', rolePermissionRoutes);
router.use('/profiles', profileRoutes);
router.use('/skill-categories', skillCategoryRoutes);
router.use('/employers', employerRoutes);
router.use('/project-requests', projectRequestRoutes);
router.use('/training-batches', trainingBatchRoutes);
router.use('/batch-enrollments', batchEnrollmentRoutes);
router.use('/projects', projectRoutes);
router.use('/project-resource-requirements', projectResourceRequirementRoutes);
router.use('/news-updates', newsUpdateRoutes);
router.use('/scraper-websites', scraperWebsiteRoutes);
router.use('/social-media', socialMediaRoutes);
router.use('/social-media-posts', socialMediaPostRoutes);

export default router;
