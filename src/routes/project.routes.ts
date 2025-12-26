import projectController from '@/controllers/project/project.controller';
import * as projectCsvImportController from '@/controllers/project/projectCsvImport.controller';
import projectDocumentController from '@/controllers/project/projectDocument.controller';
import * as projectWorkerAssignmentController from '@/controllers/project/projectWorkerAssignment.controller';
import statusHistoryController from '@/controllers/utilities/statusHistory.controller';
import uploadController from '@/controllers/storage/upload.controller';
import projectCron from '@/jobs/projectCron';
import { authMiddleware, internalOnly } from '@/middlewares/auth';
import { Router } from 'express';
import multer from 'multer';

// Multer configuration for CSV upload
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Multer configuration for document uploads (status changes)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, Excel, and image files are allowed'));
    }
  },
});

const router = Router();

// ===== Import/Export (MUST be before /:id routes) =====
router.get('/import/template', projectCsvImportController.downloadProjectTemplate);
router.post('/import', csvUpload.single('file'), projectCsvImportController.importProjects);
router.get('/export', projectCsvImportController.exportProjects);

// ===== CRUD =====
router.get('/', (req, res) => projectController.getAllProjects(req, res));
router.get('/:id', (req, res) => projectController.getProjectById(req, res));
router.post('/', (req, res) => projectController.createProject(req, res));
router.post('/from-request/:projectRequestId', (req, res) =>
  projectController.createProjectFromRequest(req, res)
);
router.patch('/:id', (req, res) => projectController.updateProject(req, res));
router.delete('/:id', (req, res) => projectController.deleteProject(req, res));

// ===== Stage Transitions =====
// TODO: Re-enable authMiddleware after testing
router.patch('/:id/stage', (req, res) => projectController.updateProjectStage(req, res));
router.post('/:id/stage/start-planning', /* authMiddleware, */ (req, res) =>
  projectController.startPlanning(req, res)
);
router.post(
  '/:id/stage/share',
  /* authMiddleware, */
  documentUpload.array('documents', 5),
  (req, res) => projectController.shareProject(req, res)
);
router.post(
  '/:id/stage/start',
  /* authMiddleware, */
  documentUpload.array('documents', 5),
  (req, res) => projectController.startProject(req, res)
);
router.post(
  '/:id/stage/hold',
  /* authMiddleware, */
  documentUpload.array('documents', 5),
  (req, res) => projectController.holdProject(req, res)
);
router.post(
  '/:id/stage/resume',
  /* authMiddleware, */
  documentUpload.array('documents', 5),
  (req, res) => projectController.resumeProject(req, res)
);
router.post('/:id/stage/complete', /* authMiddleware, */ (req, res) =>
  projectController.completeProject(req, res)
);
router.post(
  '/:id/stage/short-close',
  /* authMiddleware, */
  documentUpload.array('documents', 5),
  (req, res) => projectController.shortCloseProject(req, res)
);
router.post(
  '/:id/stage/terminate',
  /* authMiddleware, */
  documentUpload.array('documents', 5),
  (req, res) => projectController.terminateProject(req, res)
);
router.post('/:id/stage/cancel', /* authMiddleware, */ (req, res) =>
  projectController.cancelProject(req, res)
);

// ===== Status Transitions with File Upload Support =====
// These routes support multipart/form-data with document uploads
router.patch('/:id/status', (req, res) => projectController.updateProjectStage(req, res));
router.post(
  '/:id/status/hold',
  documentUpload.array('documents', 5),
  (req, res) => projectController.holdProject(req, res)
);
router.post('/:id/status/resume', (req, res) => projectController.resumeProject(req, res));
router.post(
  '/:id/status/share',
  documentUpload.array('documents', 5),
  (req, res) => projectController.shareProject(req, res)
);
router.post('/:id/status/start', (req, res) => projectController.startProject(req, res));
router.post('/:id/status/complete', (req, res) => projectController.completeProject(req, res));
router.post(
  '/:id/status/short-close',
  documentUpload.array('documents', 5),
  (req, res) => projectController.shortCloseProject(req, res)
);
router.post(
  '/:id/status/terminate',
  documentUpload.array('documents', 5),
  (req, res) => projectController.terminateProject(req, res)
);
router.post('/:id/status/cancel', (req, res) => projectController.cancelProject(req, res));

// ===== Status History =====
router.get('/:id/status-history', (req, res) =>
  statusHistoryController.getProjectStatusHistory(req, res)
);

// ===== Worker Availability =====
router.get('/workers/unavailable', (req, res) => projectController.getUnavailableWorkers(req, res));
router.get('/workers/:profileId/availability', (req, res) =>
  projectController.checkWorkerAvailability(req, res)
);
router.get('/:id/eligible-workers', (req, res) =>
  projectController.getEligibleWorkersForProject(req, res)
);
router.get('/:id/available-workers', (req, res) => projectController.getAvailableWorkers(req, res));

// ===== Matched Profiles =====
router.get('/:id/matched-profiles', (req, res) => projectController.getMatchedProfiles(req, res));
router.post('/:id/matched-profiles', (req, res) => projectController.saveMatchedProfiles(req, res));

// ===== Worker Assignments =====
router.post('/:id/workers', authMiddleware, (req, res) => projectController.assignWorker(req, res));
router.post('/:id/workers/bulk', authMiddleware, (req, res) =>
  projectWorkerAssignmentController.bulkCreateAssignments(req, res)
);
router.delete('/:id/workers/:assignmentId', authMiddleware, (req, res) =>
  projectController.removeWorker(req, res)
);
router.post('/:id/workers/:assignmentId/remove', authMiddleware, (req, res) =>
  projectController.removeWorker(req, res)
);

// ===== Documents =====
router.get('/:id/documents', (req, res) => projectDocumentController.getDocuments(req, res));
router.post('/:id/documents', (req, res) => projectDocumentController.createDocument(req, res));
router.post('/:id/documents/upload', (req, res) =>
  uploadController.uploadProjectDocument(req, res)
);
router.patch('/:id/documents/:docId', (req, res) =>
  projectDocumentController.updateDocument(req, res)
);
router.delete('/:id/documents/:docId', (req, res) =>
  projectDocumentController.deleteDocument(req, res)
);

// ===== Cron (Internal) =====
router.post('/cron/trigger', authMiddleware, internalOnly, async (req, res) => {
  try {
    const results = await projectCron.triggerManual();
    res.status(200).json({ success: true, message: 'Project cron job executed', data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Cron job failed' });
  }
});

export default router;
