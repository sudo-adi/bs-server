import prisma from '@/config/prisma';
import { NotificationType, TemplateVariables } from '@/types/notification.types';

export class NotificationTemplateService {
  /**
   * Replace variables in template string
   * Supports both simple {{variable}} and conditional {{#variable}}...{{/variable}} syntax
   */
  private replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;

    // First, handle conditional blocks {{#key}}...{{/key}}
    Object.entries(variables).forEach(([key, value]) => {
      // Handle conditional blocks - show content if value is truthy
      const conditionalRegex = new RegExp(
        `\\{\\{#\\s*${key}\\s*\\}\\}([\\s\\S]*?)\\{\\{\\/\\s*${key}\\s*\\}\\}`,
        'g'
      );
      result = result.replace(conditionalRegex, (match, content) => {
        // Show content if value is truthy (not empty, not false, not 0)
        return value && value !== 'false' && value !== '0' && value !== '' ? content : '';
      });
    });

    // Then, replace simple variables {{key}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });

    // Clean up any remaining unmatched conditional blocks
    result = result.replace(/\{\{#\s*\w+\s*\}\}[\s\S]*?\{\{\/\s*\w+\s*\}\}/g, '');

    return result;
  }

  /**
   * Get template by type
   */
  async getTemplate(type: NotificationType) {
    const template = await prisma.notification_templates.findUnique({
      where: { type },
    });

    return template;
  }

  /**
   * Get or create default template
   */
  async getOrCreateTemplate(type: NotificationType) {
    let template = await this.getTemplate(type);

    if (!template) {
      template = await this.createDefaultTemplate(type);
    }

    return template;
  }

  /**
   * Render template with variables
   */
  async renderTemplate(
    type: NotificationType,
    variables: TemplateVariables
  ): Promise<{ subject: string; body: string }> {
    const template = await this.getOrCreateTemplate(type);

    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    const subject = this.replaceVariables(template.subject_template, variables);
    const body = this.replaceVariables(template.body_template, variables);

    return { subject, body };
  }

  /**
   * Create default template for a notification type
   */
  private async createDefaultTemplate(type: NotificationType) {
    const defaultTemplates = this.getDefaultTemplates();
    const templateData = defaultTemplates[type];

    if (!templateData) {
      throw new Error(`No default template defined for type: ${type}`);
    }

    return await prisma.notification_templates.create({
      data: {
        type,
        name: templateData.name,
        description: templateData.description,
        subject_template: templateData.subjectTemplate,
        body_template: templateData.bodyTemplate,
        variables: templateData.variables,
        default_channels: templateData.defaultChannels || ['email', 'in_app'],
      },
    });
  }

  /**
   * Default templates configuration
   */
  private getDefaultTemplates(): Record<string, any> {
    return {
      [NotificationType.USER_CREATED]: {
        name: 'User Account Created',
        description: 'Sent when a new user account is created',
        subjectTemplate: 'Welcome to BuildSewa - Account Created',
        bodyTemplate: `
          <h2>Welcome {{userName}}!</h2>
          <p>Your account has been successfully created.</p>
          <p><strong>Username:</strong> {{username}}</p>
          <p><strong>Email:</strong> {{email}}</p>
          <p>You can now log in to the system using your credentials.</p>
        `,
        variables: ['userName', 'username', 'email'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.CANDIDATE_STATUS_CHANGED]: {
        name: 'Candidate Status Changed',
        description: 'Sent when a candidate status is updated',
        subjectTemplate: 'Your Application Status Has Been Updated',
        bodyTemplate: `
          <h2>Status Update</h2>
          <p>Dear {{candidateName}},</p>
          <p>Your application status has been updated to: <strong>{{newStatus}}</strong></p>
          <p><strong>Candidate Code:</strong> {{candidateCode}}</p>
          ${`{{#hasNotes}}`}<p><strong>Notes:</strong> {{notes}}</p>${`{{/hasNotes}}`}
          <p>For more information, please contact our support team.</p>
        `,
        variables: ['candidateName', 'candidateCode', 'newStatus', 'oldStatus', 'notes'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.CANDIDATE_APPROVED]: {
        name: 'Candidate Approved',
        description: 'Sent when a candidate is approved',
        subjectTemplate: 'Congratulations! Your Application Has Been Approved',
        bodyTemplate: `
          <h2>Congratulations {{candidateName}}!</h2>
          <p>We are pleased to inform you that your application has been approved.</p>
          <p><strong>Candidate Code:</strong> {{candidateCode}}</p>
          <p>Next steps will be communicated to you shortly.</p>
        `,
        variables: ['candidateName', 'candidateCode'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.CANDIDATE_REJECTED]: {
        name: 'Candidate Rejected',
        description: 'Sent when a candidate is rejected',
        subjectTemplate: 'Application Status Update',
        bodyTemplate: `
          <h2>Application Status Update</h2>
          <p>Dear {{candidateName}},</p>
          <p>Thank you for your interest. After careful review, we regret to inform you that we are unable to proceed with your application at this time.</p>
          <p><strong>Candidate Code:</strong> {{candidateCode}}</p>
          ${`{{#hasReason}}`}<p><strong>Reason:</strong> {{reason}}</p>${`{{/hasReason}}`}
          <p>We encourage you to apply again in the future.</p>
        `,
        variables: ['candidateName', 'candidateCode', 'reason'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.TRAINING_ENROLLMENT]: {
        name: 'Training Enrollment',
        description: 'Sent when enrolled in a training batch',
        subjectTemplate: 'Training Enrollment Confirmation - {{batchName}}',
        bodyTemplate: `
          <h2>Training Enrollment Confirmation</h2>
          <p>Dear {{candidateName}},</p>
          <p>You have been successfully enrolled in the training program.</p>
          <p><strong>Batch:</strong> {{batchName}}</p>
          <p><strong>Program:</strong> {{programName}}</p>
          <p><strong>Start Date:</strong> {{startDate}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p>Please ensure your attendance on the start date.</p>
        `,
        variables: ['candidateName', 'batchName', 'programName', 'startDate', 'location'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.PROJECT_ASSIGNED]: {
        name: 'Project Assignment',
        description: 'Sent when assigned to a project',
        subjectTemplate: 'New Project Assignment - {{projectName}}',
        bodyTemplate: `
          <h2>New Project Assignment</h2>
          <p>Dear {{workerName}},</p>
          <p>You have been assigned to a new project.</p>
          <p><strong>Project:</strong> {{projectName}}</p>
          <p><strong>Client:</strong> {{clientName}}</p>
          <p><strong>Start Date:</strong> {{startDate}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p>Please report as scheduled.</p>
        `,
        variables: ['workerName', 'projectName', 'clientName', 'startDate', 'location'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.EMPLOYER_VERIFIED]: {
        name: 'Employer Verified',
        description: 'Sent when employer is verified',
        subjectTemplate: 'Your Employer Account Has Been Verified',
        bodyTemplate: `
          <h2>Account Verification Successful</h2>
          <p>Dear {{companyName}},</p>
          <p>Your employer account has been successfully verified.</p>
          <p>You can now post project requirements and access our worker database.</p>
          <p><strong>Company Code:</strong> {{companyCode}}</p>
        `,
        variables: ['companyName', 'companyCode'],
        defaultChannels: ['email', 'in_app'],
      },
      [NotificationType.SYSTEM_ANNOUNCEMENT]: {
        name: 'System Announcement',
        description: 'General system announcements',
        subjectTemplate: '{{title}}',
        bodyTemplate: `
          <h2>{{title}}</h2>
          <p>{{message}}</p>
        `,
        variables: ['title', 'message'],
        defaultChannels: ['email', 'in_app'],
      },
    };
  }

  /**
   * Seed default templates
   */
  async seedDefaultTemplates() {
    const templates = this.getDefaultTemplates();
    const results = [];

    for (const [type, templateData] of Object.entries(templates)) {
      const existing = await prisma.notification_templates.findUnique({
        where: { type },
      });

      if (!existing) {
        const created = await prisma.notification_templates.create({
          data: {
            type,
            name: templateData.name,
            description: templateData.description,
            subject_template: templateData.subjectTemplate,
            body_template: templateData.bodyTemplate,
            variables: templateData.variables,
            default_channels: templateData.defaultChannels || ['email', 'in_app'],
          },
        });
        results.push(created);
      }
    }

    return results;
  }
}
