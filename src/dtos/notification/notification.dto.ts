/**
 * Notification DTOs
 */

// ==================== REQUEST ====================

export interface CreateNotificationDto {
  profileId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: string[];
}

export interface UpdateNotificationDto {
  isRead?: boolean;
  readAt?: Date | string;
}

export interface MarkNotificationsReadDto {
  notificationIds: string[];
}

// ==================== RESPONSE ====================

export interface NotificationResponse {
  id: string;
  profileId: string | null;
  type: string | null;
  title: string | null;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean | null;
  readAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NotificationCountResponse {
  total: number;
  unread: number;
}

// ==================== QUERY ====================

export interface NotificationListQuery {
  profileId?: string;
  type?: string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

// ==================== TEMPLATE ====================

export interface CreateNotificationTemplateDto {
  name: string;
  type: string;
  subject?: string;
  body: string;
  variables?: string[];
}

export interface UpdateNotificationTemplateDto {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface NotificationTemplateResponse {
  id: string;
  name: string | null;
  type: string | null;
  subject: string | null;
  body: string | null;
  variables: string[] | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// ==================== PREFERENCE ====================

export interface UpdateNotificationPreferenceDto {
  profileId: string;
  notificationType: string;
  channels: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
}

export interface NotificationPreferenceResponse {
  id: string;
  profileId: string | null;
  notificationType: string | null;
  emailEnabled: boolean | null;
  smsEnabled: boolean | null;
  pushEnabled: boolean | null;
  inAppEnabled: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
