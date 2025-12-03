import * as projectCsvImportController from '@/controllers/projects/projectCsvImport.controller';
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
router.post('/', upload.single('file'), projectCsvImportController.importProjects);

// Template download route
router.get('/template', projectCsvImportController.downloadProjectTemplate);

// Export projects to CSV
router.get('/export', projectCsvImportController.exportProjects);

export default router;
