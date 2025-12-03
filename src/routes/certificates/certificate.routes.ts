import certificateController from '@/controllers/certificates/certificate.controller';
import { authMiddleware } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();

// All certificate routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/certificates/issue
 * @desc    Issue certificate(s) to one or more profiles
 * @access  Admin, Employer
 */
router.post('/issue', certificateController.issueCertificates);

/**
 * @route   POST /api/v1/certificates/batch/:batchId
 * @desc    Issue certificates to all completed enrollments in a training batch
 * @access  Admin
 */
router.post('/batch/:batchId', certificateController.issueBatchCertificates);

/**
 * @route   GET /api/v1/certificates
 * @desc    Get certificates with filters
 * @access  Admin, Employer
 */
router.get('/', certificateController.getCertificates);

/**
 * @route   GET /api/v1/certificates/profile/:profileId
 * @desc    Get all certificates for a profile
 * @access  Admin, Employer
 */
router.get('/profile/:profileId', certificateController.getProfileCertificates);

/**
 * @route   GET /api/v1/certificates/:certificateId
 * @desc    Get certificate by ID
 * @access  Admin, Employer
 */
router.get('/:certificateId', certificateController.getCertificateById);

export default router;
