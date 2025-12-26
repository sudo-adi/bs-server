import { CalendarEvent } from '@/generated/prisma';

/**
 * DTO for calendar event list item
 */
export interface CalendarEventListDto {
  id: string;
  profileId: string | null;
  eventType: string | null;
  title: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string | null;
  createdAt: Date | null;
}

/**
 * DTO for calendar event detail
 */
export type CalendarEventDetailDto = Omit<CalendarEvent, 'deletedAt' | 'deletedByProfileId'> & {
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

/**
 * Request body for creating a calendar event
 */

export interface CreateCalendarEventRequest {
  profileId: string;
  eventType: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  referenceTable?: string;
  referenceId?: string;
  status?: string;
}

/**
 * Request body for updating a calendar event
 */

export interface UpdateCalendarEventRequest {
  eventType?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * Query parameters for listing calendar events
 */
export interface CalendarEventListQuery {
  page?: number;
  limit?: number;
  profileId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

/**
 * Calendar event types
 */
export const CALENDAR_EVENT_TYPES = {
  TRAINING: 'training',
  PROJECT: 'project',
  INTERVIEW: 'interview',
  MEETING: 'meeting',
  OTHER: 'other',
} as const;

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[keyof typeof CALENDAR_EVENT_TYPES];
