import { NotificationController } from '@/controllers/notifications/notification.controller';
import { authMiddleware } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/', notificationController.getUserNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', notificationController.markAsRead);

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.post('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/preferences', notificationController.getUserPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put('/preferences', notificationController.updateUserPreferences);

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification (admin only)
 * @access  Private (Admin)
 */
router.post('/test', notificationController.sendTestNotification);

export default router;
