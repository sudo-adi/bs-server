import { Router } from 'express';
import multer from 'multer';
import { createSocialMediaPost } from '@/controllers/utilities/socialMedia.controller';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

/**
 * @route   POST /api/v1/social-media/create-post
 * @desc    Create and publish social media post
 * @access  Public (can add authentication middleware later)
 */
router.post('/create-post', upload.single('image'), createSocialMediaPost);

export default router;
