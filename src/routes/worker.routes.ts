import { workerSelfController } from '@/controllers/worker';
import { authMiddleware, blueCollarOnly } from '@/middlewares/auth';
import { Router } from 'express';
import multer from 'multer';

// Multer config for profile photo
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Multer config for documents
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Multer config for identity documents (multiple files)
const identityUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
}).fields([
  { name: 'aadhaarDocument', maxCount: 1 },
  { name: 'panDocument', maxCount: 1 },
  { name: 'esicDocument', maxCount: 1 },
  { name: 'uanDocument', maxCount: 1 },
  { name: 'pfDocument', maxCount: 1 },
  { name: 'healthInsuranceDocument', maxCount: 1 },
]);

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Apply blue-collar only middleware to all routes
router.use(blueCollarOnly);

// =============================================================================
// PROFILE ROUTES
// =============================================================================

/**
 * GET /api/worker/me
 * Get worker's own profile
 */
router.get('/me', (req, res) => workerSelfController.getProfile(req, res));

/**
 * PATCH /api/worker/me
 * Update worker's own profile (limited fields)
 * Supports profile photo upload via multipart/form-data
 */
router.patch('/me', photoUpload.single('profilePhoto'), (req, res) =>
  workerSelfController.updateProfile(req, res)
);

// =============================================================================
// IDENTITY ROUTES
// =============================================================================

/**
 * PATCH /api/worker/me/identity
 * Update identity info with document uploads
 * Supports multiple document uploads via multipart/form-data
 */
router.patch('/me/identity', identityUpload, (req, res) =>
  workerSelfController.updateIdentity(req, res)
);

// =============================================================================
// DOCUMENT ROUTES
// =============================================================================

/**
 * GET /api/worker/me/documents
 * Get all documents for worker
 */
router.get('/me/documents', (req, res) => workerSelfController.getDocuments(req, res));

/**
 * POST /api/worker/me/documents
 * Upload a document
 */
router.post('/me/documents', documentUpload.single('file'), (req, res) =>
  workerSelfController.uploadDocument(req, res)
);

/**
 * DELETE /api/worker/me/documents/:id
 * Delete a document
 */
router.delete('/me/documents/:id', (req, res) => workerSelfController.deleteDocument(req, res));

// =============================================================================
// PROJECT ROUTES
// =============================================================================

/**
 * GET /api/worker/me/projects
 * Get worker's assigned projects
 * Query params: status=active|completed|all
 */
router.get('/me/projects', (req, res) => workerSelfController.getProjects(req, res));

// =============================================================================
// TRAINING ROUTES
// =============================================================================

/**
 * GET /api/worker/me/trainings
 * Get worker's training enrollments
 * Query params: status=enrolled|completed|dropped|all
 */
router.get('/me/trainings', (req, res) => workerSelfController.getTrainings(req, res));

export default router;
