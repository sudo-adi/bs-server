export enum NotificationType {
  CANDIDATE_SIGNUP = 'CANDIDATE_SIGNUP',
  PROFILE_CREATED = 'PROFILE_CREATED',
  PROFILE_APPROVED = 'PROFILE_APPROVED',
  PROFILE_REJECTED = 'PROFILE_REJECTED',
  PROJECT_ASSIGNED = 'PROJECT_ASSIGNED',
  TRAINING_ENROLLED = 'TRAINING_ENROLLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SCRAPER_COMPLETED = 'SCRAPER_COMPLETED',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  subject?: string;
}

export const DEFAULT_NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.CANDIDATE_SIGNUP]: {
    type: NotificationType.CANDIDATE_SIGNUP,
    title: 'New Candidate Signup',
    subject: 'Welcome to BS System - Candidate Registration Received',
    message:
      'Hello {{firstName}} {{lastName}}, thank you for registering with BS System. Your candidate signup has been received successfully from {{state}}, {{villageOrCity}}. We will process your application and get back to you soon.',
  },
  [NotificationType.PROFILE_CREATED]: {
    type: NotificationType.PROFILE_CREATED,
    title: 'Profile Created Successfully',
    subject: 'Your Profile Has Been Created',
    message:
      'Your profile has been created successfully. You can now access all the features of BS System.',
  },
  [NotificationType.PROFILE_APPROVED]: {
    type: NotificationType.PROFILE_APPROVED,
    title: 'Profile Approved',
    subject: 'Congratulations! Your Profile Has Been Approved',
    message:
      'Your profile has been reviewed and approved. You can now access all available opportunities.',
  },
  [NotificationType.PROFILE_REJECTED]: {
    type: NotificationType.PROFILE_REJECTED,
    title: 'Profile Status Update',
    subject: 'Profile Application Status Update',
    message:
      'We regret to inform you that your profile application requires additional information. Please contact support for details.',
  },
  [NotificationType.PROJECT_ASSIGNED]: {
    type: NotificationType.PROJECT_ASSIGNED,
    title: 'New Project Assignment',
    subject: 'You Have Been Assigned to a New Project',
    message: 'You have been assigned to a new project. Please check your dashboard for details.',
  },
  [NotificationType.TRAINING_ENROLLED]: {
    type: NotificationType.TRAINING_ENROLLED,
    title: 'Training Enrollment Confirmed',
    subject: 'Successfully Enrolled in Training Program',
    message:
      'You have been successfully enrolled in the training program. Training details will be shared with you shortly.',
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    type: NotificationType.PAYMENT_RECEIVED,
    title: 'Payment Received',
    subject: 'Payment Confirmation',
    message:
      'Your payment of ₹{{amount}} has been received successfully. Transaction ID: {{transactionId}}',
  },
  [NotificationType.DOCUMENT_UPLOADED]: {
    type: NotificationType.DOCUMENT_UPLOADED,
    title: 'Document Uploaded',
    subject: 'Document Upload Confirmation',
    message: 'Your document {{documentName}} has been uploaded successfully and is under review.',
  },
  [NotificationType.SYSTEM_ALERT]: {
    type: NotificationType.SYSTEM_ALERT,
    title: 'System Alert',
    subject: 'Important System Notification',
    message: 'This is an important system notification. Please check your dashboard for details.',
  },
  [NotificationType.SCRAPER_COMPLETED]: {
    type: NotificationType.SCRAPER_COMPLETED,
    title: 'News Scraper {{status}}',
    subject: 'News Scraper Run {{status}}',
    message:
      'Scraper run {{status}}. Scraped {{articlesScraped}} articles, found {{projectsFound}} projects, inserted {{projectsInserted}} new projects. Duration: {{duration}}s.',
  },
};

export interface NotificationData {
  type: NotificationType;
  recipientProfileId?: string;
  senderProfileId?: string;
  metadata?: Record<string, any>;
  customTitle?: string;
  customMessage?: string;
  customSubject?: string;
}

export interface EmailConfig {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
