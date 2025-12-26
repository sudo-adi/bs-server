import logger from '../../config/logger';
import prisma from '../../config/prisma';
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  NotificationData,
  NotificationStatus,
  NotificationType,
} from '../../types/notifications';
// import nodemailer from 'nodemailer';

class NotificationService {
  // Uncomment this when ready to use SMTP
  // private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize SMTP transporter (commented for now)
    // this.transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASSWORD,
    //   },
    // });
  }

  /**
   * Replace template variables with actual values
   * Example: "Hello {{firstName}}" with {firstName: "John"} becomes "Hello John"
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(variables[key] ?? ''));
    });
    return result;
  }

  /**
   * Send notification (saves to database and logs to console)
   * In the future, this will also send emails via SMTP
   */
  async sendNotification(data: NotificationData): Promise<any> {
    try {
      // Get the default template for this notification type
      const template = DEFAULT_NOTIFICATION_TEMPLATES[data.type];

      // Prepare the notification data
      const title = data.customTitle || template.title;
      const message = data.customMessage || template.message;
      const subject = data.customSubject || template.subject || title;

      // Replace variables in message if metadata is provided
      const finalMessage = data.metadata ? this.replaceVariables(message, data.metadata) : message;
      const finalSubject = data.metadata ? this.replaceVariables(subject, data.metadata) : subject;

      // Save notification to database
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title,
          message: finalMessage,
          recipientProfileId: data.recipientProfileId || null,
          senderProfileId: data.senderProfileId || null,
          metadata: data.metadata || {},
          status: NotificationStatus.PENDING,
        },
      });

      // Log to console (instead of sending email for now)
      console.log('\n========================================');
      console.log('📧 NOTIFICATION SENT');
      console.log('========================================');
      console.log('Notification ID:', notification.id);
      console.log('Type:', notification.type);
      console.log('Title:', notification.title);
      console.log('Subject:', finalSubject);
      console.log('Message:', notification.message);
      console.log('Recipient Profile ID:', notification.recipientProfileId || 'N/A');
      console.log('Sender Profile ID:', notification.senderProfileId || 'N/A');
      console.log('Metadata:', JSON.stringify(notification.metadata, null, 2));
      console.log('Created At:', notification.createdAt);
      console.log('========================================\n');

      // Update notification status to SENT
      const updatedNotification = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });

      logger.info(`Notification sent successfully: ${notification.id}`, {
        type: data.type,
        recipientProfileId: data.recipientProfileId,
      });

      return updatedNotification;

      // Uncomment this when ready to use SMTP
      // if (recipientEmail) {
      //   await this.sendEmail({
      //     to: recipientEmail,
      //     subject: finalSubject,
      //     text: finalMessage,
      //     html: this.generateHtmlEmail(title, finalMessage),
      //   });
      // }
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
      });

      // Update notification status to FAILED if it was created
      // Note: This might fail if the notification wasn't created yet
      try {
        if (error instanceof Error) {
          await prisma.notification.updateMany({
            where: {
              type: data.type,
              recipientProfileId: data.recipientProfileId,
              status: NotificationStatus.PENDING,
            },
            data: {
              status: NotificationStatus.FAILED,
              errorMessage: error.message,
              retryCount: { increment: 1 },
            },
          });
        }
      } catch (updateError) {
        logger.error('Failed to update notification status', { updateError });
      }

      throw error;
    }
  }

  /**
   * Send email via SMTP (commented for now)
   */
  // private async sendEmail(config: EmailConfig): Promise<void> {
  //   try {
  //     const info = await this.transporter.sendMail({
  //       from: process.env.SMTP_FROM || '"BS System" <noreply@bssystem.com>',
  //       to: config.to,
  //       subject: config.subject,
  //       text: config.text,
  //       html: config.html || config.text,
  //     });
  //
  //     logger.info('Email sent successfully', { messageId: info.messageId });
  //   } catch (error) {
  //     logger.error('Failed to send email', {
  //       error: error instanceof Error ? error.message : 'Unknown error',
  //     });
  //     throw error;
  //   }
  // }

  // /**
  //  * Generate HTML email template (for future use)
  //  */
  // private _generateHtmlEmail(title: string, message: string): string {
  //   return `
  //     <!DOCTYPE html>
  //     <html>
  //       <head>
  //         <meta charset="utf-8">
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //         <style>
  //           body {
  //             font-family: Arial, sans-serif;
  //             line-height: 1.6;
  //             color: #333;
  //             max-width: 600px;
  //             margin: 0 auto;
  //             padding: 20px;
  //           }
  //           .header {
  //             background-color: #007bff;
  //             color: white;
  //             padding: 20px;
  //             text-align: center;
  //             border-radius: 5px 5px 0 0;
  //           }
  //           .content {
  //             background-color: #f9f9f9;
  //             padding: 20px;
  //             border-radius: 0 0 5px 5px;
  //           }
  //           .footer {
  //             text-align: center;
  //             margin-top: 20px;
  //             font-size: 12px;
  //             color: #777;
  //           }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="header">
  //           <h2>${title}</h2>
  //         </div>
  //         <div class="content">
  //           <p>${message}</p>
  //         </div>
  //         <div class="footer">
  //           <p>This is an automated message from BS System. Please do not reply to this email.</p>
  //         </div>
  //       </body>
  //     </html>
  //   `;
  // }

  /**
   * Get all notifications for a user
   */
  async getNotificationsByRecipient(
    recipientProfileId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<any[]> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientProfileId,
          ...(options?.unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });

      return notifications;
    } catch (error) {
      logger.error('Failed to fetch notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientProfileId,
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<any> {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });

      logger.info(`Notification marked as read: ${notificationId}`);
      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId,
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(recipientProfileId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          recipientProfileId,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      logger.info(`All notifications marked as read for user: ${recipientProfileId}`);
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientProfileId,
      });
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Failed to delete notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId,
      });
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getPreferences(profileId: string): Promise<any[]> {
    try {
      return await prisma.notificationPreference.findMany({
        where: { profileId },
        include: {
          channels: { include: { channel: true } },
        },
      });
    } catch (error) {
      logger.error('Failed to fetch notification preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        profileId,
      });
      throw error;
    }
  }

  /**
   * Update notification preference
   */
  async updatePreference(
    preferenceId: string,
    profileId: string,
    data: { isEnabled?: boolean }
  ): Promise<any> {
    try {
      const pref = await prisma.notificationPreference.findUnique({ where: { id: preferenceId } });
      if (!pref) throw new Error('Notification preference not found');
      if (pref.profileId !== profileId) throw new Error('Unauthorized');

      return await prisma.notificationPreference.update({
        where: { id: preferenceId },
        data,
        include: {
          channels: { include: { channel: true } },
        },
      });
    } catch (error) {
      logger.error('Failed to update notification preference', {
        error: error instanceof Error ? error.message : 'Unknown error',
        preferenceId,
      });
      throw error;
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(maxRetries: number = 3): Promise<void> {
    try {
      const failedNotifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.FAILED,
          retryCount: { lt: maxRetries },
        },
        take: 10, // Process 10 at a time
      });

      for (const notification of failedNotifications) {
        try {
          await this.sendNotification({
            type: notification.type as NotificationType,
            recipientProfileId: notification.recipientProfileId || undefined,
            senderProfileId: notification.senderProfileId || undefined,
            metadata: notification.metadata as Record<string, any>,
            customTitle: notification.title || undefined,
            customMessage: notification.message || undefined,
          });
        } catch (error) {
          logger.error(`Failed to retry notification ${notification.id}`, { error });
        }
      }

      logger.info(`Retried ${failedNotifications.length} failed notifications`);
    } catch (error) {
      logger.error('Failed to retry notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export singleton instance
export default new NotificationService();
