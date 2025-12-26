import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ENROLLMENT_STATUSES } from '@/constants/stages';
import {
  CalendarEventListQuery,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '@/dtos/calendar';
import { Prisma } from '@/generated/prisma';

export class CalendarService {
  async getEvents(query: CalendarEventListQuery) {
    const { profileId, startDate, endDate, eventType, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CalendarEventWhereInput = {};
    if (profileId) where.profileId = profileId;
    if (eventType) where.eventType = eventType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = startDate;
      if (endDate) where.startDate.lte = endDate;
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          profile: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    return {
      data: events,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEventById(id: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        profile: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!event) {
      throw new Error('Calendar event not found');
    }

    return event;
  }

  async getProfileCalendar(profileId: string, query: { startDate?: Date; endDate?: Date }) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId, deletedAt: null } });
    if (!profile) throw new Error('Profile not found');

    const where: Prisma.CalendarEventWhereInput = {
      profileId,
    };
    if (query.startDate || query.endDate) {
      where.startDate = {};
      if (query.startDate) where.startDate.gte = query.startDate;
      if (query.endDate) where.startDate.lte = query.endDate;
    }

    return prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Create a calendar event
   * Business Rule: Cannot create overlapping events for the same profile
   */
  async createEvent(data: CreateCalendarEventRequest, _createdByProfileId?: string) {
    // Validate profile exists
    const profile = await prisma.profile.findUnique({
      where: { id: data.profileId, deletedAt: null },
    });
    if (!profile) {
      throw new Error('Profile not found');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Validate dates
    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Business Rule: Check for overlapping events for the same profile
    const overlappingEvent = await prisma.calendarEvent.findFirst({
      where: {
        profileId: data.profileId,
        AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
      },
    });

    if (overlappingEvent) {
      throw new Error(
        `Profile has overlapping calendar event during this period: ` +
          `${overlappingEvent.eventType} ` +
          `(${overlappingEvent.startDate?.toISOString().split('T')[0]} - ${overlappingEvent.endDate?.toISOString().split('T')[0]})`
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        profileId: data.profileId,
        eventType: data.eventType,
        startDate,
        endDate,
        referenceTable: data.referenceTable,
        referenceId: data.referenceId,
        status: data.status || 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        profile: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    logger.info('Calendar event created', {
      id: event.id,
      profileId: data.profileId,
      eventType: data.eventType,
    });

    return event;
  }

  /**
   * Update a calendar event
   */
  async updateEvent(id: string, data: UpdateCalendarEventRequest) {
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new Error('Calendar event not found');
    }

    const startDate = data.startDate ? new Date(data.startDate) : existingEvent.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existingEvent.endDate;

    // Validate dates if both are provided
    if (startDate && endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Check for overlapping events (excluding this event)
    if (startDate && endDate && existingEvent.profileId) {
      const overlappingEvent = await prisma.calendarEvent.findFirst({
        where: {
          id: { not: id },
          profileId: existingEvent.profileId,
          AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
        },
      });

      if (overlappingEvent) {
        throw new Error(
          `Profile has overlapping calendar event during this period: ` +
            `${overlappingEvent.eventType}`
        );
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        eventType: data.eventType,
        startDate,
        endDate,
        status: data.status,
        updatedAt: new Date(),
      },
      include: {
        profile: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    logger.info('Calendar event updated', { id });

    return event;
  }

  /**
   * Delete a calendar event
   * Business Rules:
   * - Cannot delete event linked to active project deployment
   * - Cannot delete event linked to active training enrollment
   */
  async deleteEvent(id: string, _deletedByProfileId: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new Error('Calendar event not found');
    }

    // Business Rule: Cannot delete event linked to active project deployment
    if (event.referenceTable === 'ProjectWorkerAssignment' && event.referenceId) {
      const assignment = await prisma.projectWorkerAssignment.findUnique({
        where: { id: event.referenceId },
        include: {
          project: { select: { stage: true, name: true } },
        },
      });

      if (assignment && !assignment.removedAt) {
        const activeStatuses = ['ONSITE', 'PLANNING', 'ON_HOLD'];
        if (assignment.project && activeStatuses.includes(assignment.project.stage || '')) {
          throw new Error(
            `Cannot delete event linked to active project deployment: ${assignment.project.name}`
          );
        }
      }
    }

    // Business Rule: Cannot delete event linked to active training enrollment
    if (event.referenceTable === 'TrainingBatchEnrollment' && event.referenceId) {
      const enrollment = await prisma.trainingBatchEnrollment.findUnique({
        where: { id: event.referenceId },
        include: {
          batch: { select: { name: true, code: true } },
        },
      });

      if (enrollment && enrollment.status === ENROLLMENT_STATUSES.ENROLLED) {
        throw new Error(
          `Cannot delete event linked to active training enrollment: ${enrollment.batch?.name || enrollment.batch?.code}`
        );
      }
    }

    // Hard delete the event since CalendarEvent doesn't have deletedAt
    await prisma.calendarEvent.delete({
      where: { id },
    });

    logger.info('Calendar event deleted', { id });
  }

  /**
   * Check if a profile has any events in a given time range
   */
  async hasEventsInRange(
    profileId: string,
    startDate: Date,
    endDate: Date,
    excludeEventId?: string
  ) {
    const where: Prisma.CalendarEventWhereInput = {
      profileId,
      AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
    };

    if (excludeEventId) {
      where.id = { not: excludeEventId };
    }

    const count = await prisma.calendarEvent.count({ where });
    return count > 0;
  }
}

export const calendarService = new CalendarService();
export default calendarService;
