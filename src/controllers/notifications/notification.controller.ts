import { AppError } from '@/middlewares/errorHandler';
import { NotificationService } from '@/services/notifications/notification.service';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@/types/notification.types';
import { NextFunction, Request, Response } from 'express';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get user's notifications
   */
  getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!userId && !userEmail) {
        throw new AppError('User not authenticated', 401);
      }

      const { type, status, isRead, startDate, endDate, limit = 50, offset = 0 } = req.query;

      const result = await this.notificationService.getUserNotifications({
        userId,
        userEmail,
        type: type as NotificationType,
        status: status as NotificationStatus,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get unread count
   */
  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const count = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark notification as read
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const notification = await this.notificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark all notifications as read
   */
  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete notification
   */
  deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await this.notificationService.deleteNotification(id, userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user preferences
   */
  getUserPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { type } = req.query;

      const preferences = await this.notificationService.getUserPreferences(
        userId,
        type as NotificationType
      );

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user preferences
   */
  updateUserPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { notificationType, enabledChannels, isEnabled } = req.body;

      if (!notificationType) {
        throw new AppError('Notification type is required', 400);
      }

      const preference = await this.notificationService.updateUserPreferences(
        userId,
        notificationType as NotificationType,
        enabledChannels as NotificationChannel[],
        isEnabled ?? true
      );

      res.status(200).json({
        success: true,
        data: preference,
        message: 'Preferences updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send test notification (admin only)
   */
  sendTestNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recipientUserId, recipientEmail, type, title, message } = req.body;

      if (!recipientUserId && !recipientEmail) {
        throw new AppError('Either recipientUserId or recipientEmail is required', 400);
      }

      const notification = await this.notificationService.sendNotification({
        type: type || NotificationType.SYSTEM_ANNOUNCEMENT,
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        recipientUserId,
        recipientEmail,
        // Don't set sender for test notifications to avoid FK constraint issues
      });

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Test notification sent successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
