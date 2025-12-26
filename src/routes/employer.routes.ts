import { employerController } from '@/controllers/employer';
import { statusHistoryController } from '@/controllers/utilities';
import { uploadEmployerLogo } from '@/middlewares/upload.middleware';
import { Router } from 'express';
import multer from 'multer';
// import { authMiddleware } from '@/middlewares/auth'; // Uncomment when auth middleware is ready

const router = Router();

// Multer configuration for CSV upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * Employer Routes
 * Base path: /api/employers
 */

// ==================== IMPORT/EXPORT (MUST be before /:id routes) ====================

// Download CSV template
router.get('/import/template', (req, res) => employerController.downloadTemplate(req, res));

// Import employers from CSV
router.post('/import', upload.single('file'), (req, res) =>
  employerController.importEmployers(req, res)
);

// Export employers to CSV
router.get('/export', (req, res) => employerController.exportEmployers(req, res));

// ==================== BASIC CRUD ====================

// Get all employers with filters
router.get('/', (req, res) => employerController.getAllEmployers(req, res));

// Create employer with nested project and authorized persons (MUST be before /:id routes)
router.post('/with-project', (req, res) => employerController.createEmployerWithProject(req, res));

// Update employer with authorized persons (unified API) - MUST be before /:id routes
router.put('/:id/with-authorized-persons', (req, res) =>
  employerController.updateEmployerWithAuthorizedPersons(req, res)
);

// Get employer by ID
router.get('/:id', (req, res) => employerController.getEmployerById(req, res));

// Create employer
router.post('/', (req, res) => employerController.createEmployer(req, res));

// Update employer
router.patch('/:id', (req, res) => employerController.updateEmployer(req, res));

// Soft delete employer
router.delete('/:id', (req, res) => employerController.deleteEmployer(req, res));

// Verify employer
router.post('/:id/verify', (req, res) => employerController.verifyEmployer(req, res));

// Reject employer
router.post('/:id/reject', (req, res) => employerController.rejectEmployer(req, res));

// ==================== AUTHORIZED PERSONS ====================

// Get authorized persons for an employer
router.get('/:id/authorized-persons', (req, res) =>
  employerController.getAuthorizedPersons(req, res)
);

// Create authorized person
router.post('/:id/authorized-persons', (req, res) =>
  employerController.createAuthorizedPerson(req, res)
);

// Update authorized person
router.patch('/:id/authorized-persons/:personId', (req, res) =>
  employerController.updateAuthorizedPerson(req, res)
);

// Delete authorized person
router.delete('/:id/authorized-persons/:personId', (req, res) =>
  employerController.deleteAuthorizedPerson(req, res)
);

// ==================== LOGO UPLOAD ====================

// Upload employer logo
router.post('/:id/logo', uploadEmployerLogo, (req, res) => employerController.uploadLogo(req, res));

// Delete employer logo
router.delete('/:id/logo', (req, res) => employerController.deleteLogo(req, res));

// ==================== PROJECT REQUESTS ====================

// Get project requests for an employer
router.get('/:id/project-requests', (req, res) => employerController.getProjectRequests(req, res));

// Create project request
router.post('/:id/project-requests', (req, res) =>
  employerController.createProjectRequest(req, res)
);

// Reject project request
router.post('/project-requests/:projectRequestId/reject', (req, res) =>
  employerController.rejectProjectRequest(req, res)
);

// ==================== STATUS HISTORY ====================

// Get employer status history
router.get('/:id/status-history', (req, res) =>
  statusHistoryController.getEmployerStatusHistory(req, res)
);

export default router;
