import notificationService from '@/services/notification/notification.service';
import { Request, Response } from 'express';

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const profileId = (req.query.profileId as string) || req.user?.id;
      if (!profileId) {
        res.status(400).json({ success: false, message: 'Profile ID is required' });
        return;
      }
      const notifications = await notificationService.getNotificationsByRecipient(profileId, {
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
        unreadOnly: req.query.unreadOnly === 'true',
      });
      res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch notifications' });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notification = await notificationService.markAsRead(req.params.id);
      res
        .status(200)
        .json({ success: true, message: 'Notification marked as read', data: notification });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to mark notification as read' });
    }
  }

  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const profileId = (req.query.profileId as string) || req.user?.id;
      if (!profileId) {
        res.status(400).json({ success: false, message: 'Profile ID is required' });
        return;
      }
      const preferences = await notificationService.getPreferences(profileId);
      res.status(200).json({ success: true, data: preferences });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch preferences' });
    }
  }

  async updatePreference(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;
      if (!profileId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const preference = await notificationService.updatePreference(
        req.params.id,
        profileId,
        req.body
      );
      res.status(200).json({ success: true, message: 'Preference updated', data: preference });
    } catch (error: any) {
      const status =
        error.message === 'Notification preference not found'
          ? 404
          : error.message === 'Unauthorized'
            ? 403
            : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to update preference' });
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
