import { CreateCalendarEventRequest, UpdateCalendarEventRequest } from '@/dtos/calendar';
import { calendarService } from '@/services/calendar/calendar.service';
import { Request, Response } from 'express';

export class CalendarController {
  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        profileId: req.query.profileId as string,
        eventType: req.query.eventType as string,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const result = await calendarService.getEvents(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch calendar events' });
    }
  }

  async getEventById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const event = await calendarService.getEventById(id);
      res.status(200).json({ success: true, data: event });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch calendar event' });
    }
  }

  async getProfileCalendar(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const events = await calendarService.getProfileCalendar(req.params.id, query);
      res.status(200).json({ success: true, data: events });
    } catch (error: any) {
      const status = error.message === 'Profile not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch profile calendar' });
    }
  }

  async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateCalendarEventRequest = req.body;

      if (!data.profileId || !data.eventType || !data.startDate || !data.endDate) {
        res.status(400).json({
          success: false,
          message: 'profileId, eventType, startDate, and endDate are required',
        });
        return;
      }

      const event = await calendarService.createEvent(data, req.user?.id);

      res.status(201).json({
        success: true,
        message: 'Calendar event created successfully',
        data: event,
      });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('overlapping')
          ? 400
          : error.message.includes('End date')
            ? 400
            : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to create calendar event',
      });
    }
  }

  async updateEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCalendarEventRequest = req.body;

      const event = await calendarService.updateEvent(id, data);

      res.status(200).json({
        success: true,
        message: 'Calendar event updated successfully',
        data: event,
      });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('overlapping')
          ? 400
          : error.message.includes('End date')
            ? 400
            : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to update calendar event',
      });
    }
  }

  async deleteEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await calendarService.deleteEvent(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Calendar event deleted successfully',
      });
    } catch (error: any) {
      const status = error.message.includes('not found')
        ? 404
        : error.message.includes('Cannot delete')
          ? 400
          : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete calendar event',
      });
    }
  }
}

export const calendarController = new CalendarController();
export default calendarController;
