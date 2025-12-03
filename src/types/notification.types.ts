// Notification Types
export enum NotificationType {
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',

  // Candidate/Profile Management
  CANDIDATE_CREATED = 'candidate_created',
  CANDIDATE_STATUS_CHANGED = 'candidate_status_changed',
  CANDIDATE_APPROVED = 'candidate_approved',
  CANDIDATE_REJECTED = 'candidate_rejected',
  CANDIDATE_BLACKLISTED = 'candidate_blacklisted',
  CANDIDATE_UNBLACKLISTED = 'candidate_unblacklisted',

  // Training
  TRAINING_BATCH_CREATED = 'training_batch_created',
  TRAINING_ENROLLMENT = 'training_enrollment',
  TRAINING_ENROLLMENT_APPROVED = 'training_enrollment_approved',
  TRAINING_ENROLLMENT_REJECTED = 'training_enrollment_rejected',
  TRAINING_STARTED = 'training_started',
  TRAINING_COMPLETED = 'training_completed',

  // Project Management
  PROJECT_CREATED = 'project_created',
  PROJECT_ASSIGNED = 'project_assigned',
  PROJECT_UNASSIGNED = 'project_unassigned',
  PROJECT_STATUS_CHANGED = 'project_status_changed',

  // Employer
  EMPLOYER_REGISTERED = 'employer_registered',
  EMPLOYER_VERIFIED = 'employer_verified',
  EMPLOYER_REJECTED = 'employer_rejected',

  // System
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SYSTEM_MAINTENANCE = 'system_maintenance',

  // Documents
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export enum NotificationChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
}

// Notification Interfaces
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  recipientUserId?: string;
  recipientEmail?: string;
  senderUserId?: string;
  metadata?: Record<string, any>;
  channels?: NotificationChannel[];
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
}

export interface NotificationTemplate {
  type: NotificationType;
  name: string;
  description?: string;
  subjectTemplate: string;
  bodyTemplate: string;
  variables?: string[];
  defaultChannels?: NotificationChannel[];
}

export interface NotificationPreference {
  userId: string;
  notificationType: NotificationType;
  enabledChannels: NotificationChannel[];
  isEnabled: boolean;
}

export interface SendNotificationOptions {
  skipPreferences?: boolean;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
  retryOnFailure?: boolean;
}

export interface NotificationFilter {
  userId?: string;
  userEmail?: string; // Added to support querying by email
  type?: NotificationType | NotificationType[];
  status?: NotificationStatus;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Template variable replacement
export interface TemplateVariables {
  [key: string]: string | number | boolean | Date;
}
