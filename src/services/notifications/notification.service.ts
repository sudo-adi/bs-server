import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  NotificationChannel,
  NotificationFilter,
  NotificationPayload,
  NotificationStatus,
  NotificationType,
  SendNotificationOptions,
  TemplateVariables,
} from '@/types/notification.types';
import { NotificationTemplateService } from './notificationTemplate.service';
import { EmailProvider } from './providers/email.provider';

export class NotificationService {
  private emailProvider: EmailProvider;
  private templateService: NotificationTemplateService;

  constructor() {
    this.emailProvider = new EmailProvider();
    this.templateService = new NotificationTemplateService();
  }

  /**
   * Send a notification
   */
  async sendNotification(
    payload: NotificationPayload,
    options?: SendNotificationOptions
  ): Promise<any> {
    try {
      // Validate that we have at least one recipient identifier
      if (!payload.recipientUserId && !payload.recipientEmail) {
        console.warn(
          `Skipping notification ${payload.type} - no recipient specified (userId: ${payload.recipientUserId}, email: ${payload.recipientEmail})`
        );
        return null;
      }

      // Check user preferences if not skipped
      let channels = payload.channels || [NotificationChannel.EMAIL, NotificationChannel.IN_APP];

      if (!options?.skipPreferences && payload.recipientUserId) {
        channels = await this.getEnabledChannels(payload.recipientUserId, payload.type);
      }

      // Create notification record
      const notification = await prisma.notifications.create({
        data: {
          type: payload.type,
          title: payload.title,
          message: payload.message,
          recipient_user_id: payload.recipientUserId,
          recipient_email: payload.recipientEmail,
          sender_user_id: payload.senderUserId,
          metadata: payload.metadata || {},
          channels,
          status: NotificationStatus.PENDING,
        },
      });

      // Send through enabled channels
      const sendPromises = channels.map(async (channel) => {
        switch (channel) {
          case NotificationChannel.EMAIL:
            return this.sendEmailNotification(notification);
          case NotificationChannel.IN_APP:
            // In-app notifications are already created in DB
            return Promise.resolve();
          case NotificationChannel.SMS:
            // TODO: Implement SMS provider
            console.log('SMS notifications not yet implemented');
            return Promise.resolve();
          default:
            return Promise.resolve();
        }
      });

      await Promise.allSettled(sendPromises);

      // Update status to sent
      await prisma.notifications.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sent_at: new Date(),
        },
      });

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw new AppError('Failed to send notification', 500);
    }
  }

  /**
   * Send notification using template
   */
  async sendNotificationFromTemplate(
    type: NotificationType,
    recipientUserId: string | undefined,
    recipientEmail: string | undefined,
    variables: TemplateVariables,
    options?: SendNotificationOptions
  ): Promise<any> {
    try {
      // Validate that we have at least one recipient identifier
      if (!recipientUserId && !recipientEmail) {
        console.warn(
          `Skipping notification ${type} - no recipient specified (userId: ${recipientUserId}, email: ${recipientEmail})`
        );
        return null;
      }

      // Render template
      const { subject, body } = await this.templateService.renderTemplate(type, variables);

      // Get template default channels
      const template = await this.templateService.getTemplate(type);
      const channels = template?.default_channels || ['email', 'in_app'];

      // Send notification
      return await this.sendNotification(
        {
          type,
          title: subject,
          message: body,
          recipientUserId,
          recipientEmail,
          metadata: variables,
          channels: channels as NotificationChannel[],
        },
        options
      );
    } catch (error) {
      console.error('Failed to send templated notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      const recipientEmail = notification.recipient_email;

      if (!recipientEmail) {
        // Try to get email from user
        if (notification.recipient_user_id) {
          const user = await prisma.users.findUnique({
            where: { id: notification.recipient_user_id },
            select: { email: true },
          });

          if (!user?.email) {
            throw new Error('No recipient email found');
          }

          await this.emailProvider.sendEmail({
            to: user.email,
            subject: notification.title,
            html: this.emailProvider.generateHtmlTemplate(
              notification.title,
              notification.message,
              notification.metadata
            ),
            text: notification.message,
          });
        }
      } else {
        await this.emailProvider.sendEmail({
          to: recipientEmail,
          subject: notification.title,
          html: this.emailProvider.generateHtmlTemplate(
            notification.title,
            notification.message,
            notification.metadata
          ),
          text: notification.message,
        });
      }
    } catch (error) {
      console.error('Failed to send email:', error);

      // Update notification with error
      await prisma.notifications.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Get user's enabled notification channels
   */
  private async getEnabledChannels(
    userId: string,
    notificationType: NotificationType
  ): Promise<NotificationChannel[]> {
    const preference = await prisma.notification_preferences.findUnique({
      where: {
        user_id_notification_type: {
          user_id: userId,
          notification_type: notificationType,
        },
      },
    });

    if (!preference || !preference.is_enabled) {
      return []; // User disabled this notification type
    }

    return preference.enabled_channels as NotificationChannel[];
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(filters: NotificationFilter) {
    const where: any = {};

    // Query by userId OR userEmail OR system-wide notifications (NULL recipient)
    // System-wide notifications are shown to all admins
    if (filters.userId || filters.userEmail) {
      const userConditions: any[] = [];

      if (filters.userId) {
        userConditions.push({ recipient_user_id: filters.userId });
      }

      if (filters.userEmail) {
        userConditions.push({ recipient_email: filters.userEmail });
      }

      // Also include system-wide notifications (both recipient_user_id and recipient_email are NULL)
      userConditions.push({
        AND: [{ recipient_user_id: null }, { recipient_email: null }],
      });

      // Use OR condition to match userId, email, or system-wide
      if (userConditions.length > 0) {
        where.OR = userConditions;
      }
    }

    if (filters.type) {
      where.type = Array.isArray(filters.type) ? { in: filters.type } : filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isRead !== undefined) {
      where.read_at = filters.isRead ? { not: null } : null;
    }

    if (filters.startDate || filters.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.notifications.count({ where }),
    ]);

    return {
      notifications,
      total,
      unreadCount: await this.getUnreadCount(filters.userId, filters.userEmail),
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId?: string, userEmail?: string): Promise<number> {
    const where: any = {
      read_at: null,
    };

    // Query by userId OR userEmail
    if (userId || userEmail) {
      const userConditions: any[] = [];

      if (userId) {
        userConditions.push({ recipient_user_id: userId });
      }

      if (userEmail) {
        userConditions.push({ recipient_email: userEmail });
      }

      if (userConditions.length > 0) {
        where.OR = userConditions;
      }
    }

    return await prisma.notifications.count({ where });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await prisma.notifications.findFirst({
      where: {
        id: notificationId,
        recipient_user_id: userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    return await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        read_at: new Date(),
        status: NotificationStatus.READ,
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<any> {
    return await prisma.notifications.updateMany({
      where: {
        recipient_user_id: userId,
        read_at: null,
      },
      data: {
        read_at: new Date(),
        status: NotificationStatus.READ,
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notifications.findFirst({
      where: {
        id: notificationId,
        recipient_user_id: userId,
      },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    await prisma.notifications.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Get or create user preferences
   */
  async getUserPreferences(userId: string, notificationType?: NotificationType) {
    const where: any = { user_id: userId };

    if (notificationType) {
      where.notification_type = notificationType;
    }

    return await prisma.notification_preferences.findMany({
      where,
      orderBy: { notification_type: 'asc' },
    });
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    notificationType: NotificationType,
    enabledChannels: NotificationChannel[],
    isEnabled: boolean
  ) {
    return await prisma.notification_preferences.upsert({
      where: {
        user_id_notification_type: {
          user_id: userId,
          notification_type: notificationType,
        },
      },
      update: {
        enabled_channels: enabledChannels,
        is_enabled: isEnabled,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        notification_type: notificationType,
        enabled_channels: enabledChannels,
        is_enabled: isEnabled,
      },
    });
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxRetries = 3): Promise<number> {
    const failedNotifications = await prisma.notifications.findMany({
      where: {
        status: NotificationStatus.FAILED,
        retry_count: { lt: maxRetries },
      },
      take: 100,
    });

    let retriedCount = 0;

    for (const notification of failedNotifications) {
      try {
        await this.sendEmailNotification(notification);
        retriedCount++;
      } catch (error) {
        console.error(`Failed to retry notification ${notification.id}:`, error);
      }
    }

    return retriedCount;
  }
}
