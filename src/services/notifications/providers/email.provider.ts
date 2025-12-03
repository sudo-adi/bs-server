import { EmailData } from '@/types/notification.types';
import nodemailer, { Transporter } from 'nodemailer';

export class EmailProvider {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.SMTP_FROM_EMAIL || 'noreply@buildsewa.com';

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: emailData.from || this.defaultFrom,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        replyTo: emailData.replyTo,
        attachments: emailData.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP server is ready to send emails');
      return true;
    } catch (error) {
      console.error('SMTP server verification failed:', error);
      return false;
    }
  }

  generateHtmlTemplate(title: string, message: string, metadata?: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #20781C 0%, #2d9c26 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .footer {
              background: #f5f5f5;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #20781C;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .metadata {
              background: #f9f9f9;
              padding: 15px;
              border-left: 4px solid #20781C;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            ${
              metadata && Object.keys(metadata).length > 0
                ? `
              <div class="metadata">
                <h3>Details:</h3>
                ${Object.entries(metadata)
                  .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                  .join('')}
              </div>
            `
                : ''
            }
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BuildSewa. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
  }
}
