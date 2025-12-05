import * as profileController from '@/controllers/profiles/profile.controller';
import {
  createProfileSchema,
  paginationSchema,
  updateProfileSchema,
  uuidParamSchema,
  validate,
} from '@/middlewares';
import { Router } from 'express';
import multer from 'multer';

const router = Router();

// Configure multer for profile picture uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
  fileFilter: (req, file, cb) => {
    // Accept only image formats
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'));
    }
  },
});

router.post(
  '/',
  upload.single('profile_picture'),
  validate(createProfileSchema),
  profileController.createProfile
);
router.get('/', validate(paginationSchema, 'query'), profileController.getAllProfiles);
router.get('/check-mobile', profileController.checkMobileNumber);
router.get('/:id', validate(uuidParamSchema, 'params'), profileController.getProfile);
router.patch(
  '/:id',
  upload.single('profile_picture'),
  validate(uuidParamSchema, 'params'),
  validate(updateProfileSchema),
  profileController.updateProfile
);
router.delete('/:id', validate(uuidParamSchema, 'params'), profileController.deleteProfile);
router.post('/:id/stage', profileController.changeStage);

// Bulk operations
router.post('/bulk/approve', profileController.bulkApprove);
router.post('/bulk/soft-delete', profileController.bulkSoftDelete);
router.post('/bulk/hard-delete', profileController.bulkHardDelete);

export default router;
