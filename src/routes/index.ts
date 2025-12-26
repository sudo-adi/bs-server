import uploadController from '@/controllers/storage/upload.controller';
import { Router } from 'express';
import authRoutes from './auth.routes';
import batchEnrollmentRoutes from './batchEnrollment.routes';
import blueCollarAvailabilityRoutes from './blueCollarAvailability.routes';
import certificateRoutes from './certificate.routes';
import employerRoutes from './employer.routes';
import employerPortalRoutes from './employerPortal.routes';
import lookupRoutes from './lookup.routes';
import profileRoutes from './profile.routes';
import projectRoutes from './project.routes';
import roleRoutes from './role.routes';
import notificationRoutes from './notification.routes';
import scraperRoutes from './scraper.routes';
import trainerRoutes from './trainer.routes';
import trainingBatchRoutes from './trainingBatch.routes';
import workerRoutes from './worker.routes';

const router = Router();

// Auth & Users
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);

// Core Resources
router.use('/profiles', profileRoutes);
router.use('/employers', employerRoutes);
router.use('/employer-portal', employerPortalRoutes);
router.use('/projects', projectRoutes);

// Training
router.use('/training-batches', trainingBatchRoutes);
router.use('/batch-enrollments', batchEnrollmentRoutes);
router.use('/trainers', trainerRoutes);
router.use('/certificates', certificateRoutes);

// Blue Collar Availability
router.use('/blue-collar/availability', blueCollarAvailabilityRoutes);

// Worker Self-Service (Blue Collar)
router.use('/worker', workerRoutes);

// Lookup / Master Data
router.use('/', lookupRoutes); // categories, languages, qualification-types
router.use('/scraper', scraperRoutes);

// Notifications
router.use('/notifications', notificationRoutes);

// Storage & Documents
router.post('/documents/signed-url', (req, res) => uploadController.getDocumentSignedUrl(req, res));
router.get('/storage/status', (req, res) => uploadController.getStorageStatus(req, res));

// Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
