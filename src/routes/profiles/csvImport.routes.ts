import * as csvImportController from '@/controllers/profiles/csvImport.controller';
import { Router } from 'express';
import multer from 'multer';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files only
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// CSV Import routes
router.post('/candidates', upload.single('file'), csvImportController.importCandidates);
router.post('/workers', upload.single('file'), csvImportController.importWorkers);

// Template download routes
router.get('/templates/candidates', csvImportController.downloadCandidateTemplate);
router.get('/templates/workers', csvImportController.downloadWorkerTemplate);

export default router;
