import certificateController from '@/controllers/certificate/certificate.controller';
import profileController from '@/controllers/profile/profile.controller';
import profileImportExportController from '@/controllers/profile/profileImportExport.controller';
import uploadController from '@/controllers/storage/upload.controller';
import { authMiddleware } from '@/middlewares/auth';
import { Router } from 'express';
import multer from 'multer';

// Multer configs
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ===== CRUD =====
router.get('/', (req, res) => profileController.getAllProfiles(req, res));
router.get('/check-mobile', (req, res) => profileController.checkMobileExists(req, res));
router.get('/:id', (req, res) => profileController.getProfileById(req, res));
router.post('/', (req, res) => profileController.createProfile(req, res));
router.patch('/:id', photoUpload.single('profile_picture'), (req, res) =>
  profileController.updateProfile(req, res)
);
router.delete('/:id', (req, res) => profileController.deleteProfile(req, res));

// ===== Worker Stage & Assignments =====
router.get('/:id/next-stage', (req, res) => profileController.getNextStage(req, res));
router.get('/:id/upcoming-assignments', (req, res) => profileController.getUpcomingAssignments(req, res));

// ===== Stage Transitions =====
router.patch('/:id/approve-candidate', (req, res) => profileController.approveCandidate(req, res));
router.patch('/:id/reject-candidate', (req, res) => profileController.rejectCandidate(req, res));
router.patch('/:id/convert-to-worker', (req, res) => profileController.convertToWorker(req, res));
router.patch('/:id/deactivate', (req, res) => profileController.deactivateProfile(req, res));
router.patch('/:id/reactivate', (req, res) => profileController.reactivateProfile(req, res));

// ===== Bulk Operations =====
router.post('/bulk/approve', (req, res) => profileController.bulkApprove(req, res));
router.post('/bulk/soft-delete', (req, res) => profileController.bulkSoftDelete(req, res));
router.post('/bulk/hard-delete', (req, res) => profileController.bulkHardDelete(req, res));

// ===== Import/Export =====
router.get('/export/candidates', (req, res) =>
  profileImportExportController.exportCandidates(req, res)
);
router.get('/export/workers', (req, res) => profileImportExportController.exportWorkers(req, res));
router.get('/export/staff', (req, res) => profileImportExportController.exportStaff(req, res));
router.post('/import/candidates', csvUpload.single('file'), (req, res) =>
  profileImportExportController.importCandidates(req, res)
);
router.get('/import/templates/candidates', (req, res) =>
  profileImportExportController.downloadCandidateTemplate(req, res)
);
router.get('/import/samples/candidates', (req, res) =>
  profileImportExportController.downloadCandidateSample(req, res)
);

// ===== Photo =====
router.post('/:id/photo', (req, res) => uploadController.uploadProfilePhoto(req, res));
router.delete('/:id/photo', (req, res) => uploadController.deleteProfilePhoto(req, res));

// ===== Documents =====
router.post('/:id/documents/upload', (req, res) => uploadController.uploadDocument(req, res));

// ===== Certificates =====
router.get('/:profileId/certificates', (req, res) =>
  certificateController.getProfileCertificates(req, res)
);
router.post('/:id/certificates/training', (req, res) =>
  uploadController.uploadTrainingCertificate(req, res)
);
router.post('/:id/certificates/skill', (req, res) =>
  uploadController.uploadSkillCertificate(req, res)
);

export default router;
