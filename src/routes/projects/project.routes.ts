import * as projectController from '@/controllers/projects/project.controller';
import { Router } from 'express';
import multer from 'multer';

const router = Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and images are allowed.'));
    }
  },
});

// ==================== Basic Project CRUD ====================

router.post('/', projectController.createProject);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', projectController.updateProject);
router.patch('/:id/approve', projectController.approveProject);
router.delete('/:id', projectController.deleteProject);
router.post('/from-request/:projectRequestId', projectController.createProjectFromRequest);

// ==================== Match Workers Workflow ====================

router.get('/:id/matched-profiles', projectController.getMatchedProfiles);
router.post('/:id/matched-profiles', projectController.saveMatchedProfiles);
router.post('/:id/share-with-employer', projectController.shareWithEmployer);
router.get('/:id/shared-profiles', projectController.getSharedProfiles);

// ==================== Matchable Workers & Auto-Match ====================

router.get('/:id/matchable-workers', projectController.getMatchableWorkers);
router.get(
  '/:id/matchable-workers/count-by-skill',
  projectController.getMatchableWorkersCountBySkill
);
router.post('/:id/auto-match-helpers', projectController.autoMatchHelpers);
router.get('/:id/auto-match-helpers/preview', projectController.getAutoMatchPreview);

// ==================== Project Status Lifecycle ====================

router.post('/:id/status/start', projectController.startProject);
router.post('/:id/status/complete', projectController.completeProject);
router.post('/:id/status/hold', upload.array('documents', 5), projectController.holdProject);
router.post('/:id/status/resume', projectController.resumeProject);
router.post('/:id/status/terminate', upload.array('documents', 5), projectController.terminateProject);
router.post('/:id/status/short-close', upload.array('documents', 5), projectController.shortCloseProject);

// Get status history and documents
router.get('/:id/status/history', projectController.getStatusHistory);
router.get('/:id/status/documents', projectController.getStatusDocuments);

export default router;
