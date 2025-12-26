import { certificateController } from '@/controllers/certificate';
import { Router } from 'express';

const router = Router();

/**
 * Certificate Routes
 * Base path: /api/v1/certificates
 */

// Get all certificates for a profile
router.get('/profile/:profileId', (req, res) =>
  certificateController.getProfileCertificates(req, res)
);

// Get certificate by ID
router.get('/:certificateId', (req, res) => certificateController.getCertificateById(req, res));

// Get certificate download URL
router.get('/:certificateId/download', (req, res) =>
  certificateController.getCertificateDownloadUrl(req, res)
);

// Delete certificate
router.delete('/:certificateId', (req, res) => certificateController.deleteCertificate(req, res));

export default router;
