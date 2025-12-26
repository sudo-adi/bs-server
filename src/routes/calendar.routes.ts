import { calendarController } from '@/controllers';
import { Router } from 'express';

const router = Router();

/**
 * Calendar Routes
 * Base path: /api/calendar
 */

// Get all calendar events with filters
router.get('/events', (req, res) => calendarController.getEvents(req, res));

// Get calendar event by ID
router.get('/events/:id', (req, res) => calendarController.getEventById(req, res));

// Create a new calendar event
router.post('/events', (req, res) => calendarController.createEvent(req, res));

// Update a calendar event
router.patch('/events/:id', (req, res) => calendarController.updateEvent(req, res));

// Delete a calendar event (soft delete with constraints)
router.delete('/events/:id', (req, res) => calendarController.deleteEvent(req, res));

export default router;
