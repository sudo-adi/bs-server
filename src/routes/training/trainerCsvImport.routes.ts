import * as trainerCsvImportController from '@/controllers/training/trainerCsvImport.controller';
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
router.post('/', upload.single('file'), trainerCsvImportController.importTrainers);

// Template download route
router.get('/template', trainerCsvImportController.downloadTrainerTemplate);

// Export trainers to CSV
router.get('/export', trainerCsvImportController.exportTrainers);

export default router;
