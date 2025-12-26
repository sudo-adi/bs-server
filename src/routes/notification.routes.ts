import { notificationController } from '@/controllers/notification';
import { Router } from 'express';

const router = Router();

/**
 * Notification Routes
 * Base path: /api/notifications
 */

router.get('/', (req, res) => notificationController.getNotifications(req, res));
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));
router.get('/preferences', (req, res) => notificationController.getPreferences(req, res));
router.patch('/preferences/:id', (req, res) => notificationController.updatePreference(req, res));

export default router;
