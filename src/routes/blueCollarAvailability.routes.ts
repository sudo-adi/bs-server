/**
 * Blue Collar Availability Routes
 * Routes for checking availability of blue collar profiles
 */

import { blueCollarAvailabilityController } from '@/controllers/blueCollarAvailability/blueCollarAvailability.controller';
import { Router } from 'express';

const router = Router();

/**
 * GET /blue-collar/availability
 * Get all profiles with their availability status for a date range
 *
 * Query params:
 * - startDate (required): ISO date string
 * - endDate (required): ISO date string
 * - purpose: 'project' | 'training' | 'all'
 * - availabilityStatus: 'available' | 'unavailable' | 'all'
 * - skillCategoryIds: comma-separated UUIDs
 * - gender: string
 * - minAge: number
 * - maxAge: number
 * - stages: comma-separated stage values
 * - districts: comma-separated district names
 * - states: comma-separated state names
 * - search: string
 * - sortBy: 'name' | 'code' | 'age'
 * - sortOrder: 'asc' | 'desc'
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - excludeProjectId: UUID
 * - excludeBatchId: UUID
 */
router.get('/', (req, res) => blueCollarAvailabilityController.getProfilesWithAvailability(req, res));

/**
 * GET /blue-collar/availability/check/:profileId
 * Check availability for a single profile
 *
 * Params:
 * - profileId: Profile UUID
 *
 * Query params:
 * - startDate (required): ISO date string
 * - endDate (required): ISO date string
 * - excludeProjectId: UUID
 * - excludeBatchId: UUID
 */
router.get('/check/:profileId', (req, res) =>
  blueCollarAvailabilityController.checkProfileAvailability(req, res)
);

/**
 * GET /blue-collar/availability/project/:projectId
 * Get profiles available for a specific project
 * Uses project's start and end dates automatically
 *
 * Params:
 * - projectId: Project UUID
 *
 * Query params: (same as main endpoint except startDate/endDate)
 */
router.get('/project/:projectId', (req, res) =>
  blueCollarAvailabilityController.getAvailableForProject(req, res)
);

/**
 * GET /blue-collar/availability/training/:batchId
 * Get profiles available for a specific training batch
 * Uses batch's start and end dates automatically
 *
 * Params:
 * - batchId: Training batch UUID
 *
 * Query params: (same as main endpoint except startDate/endDate)
 */
router.get('/training/:batchId', (req, res) =>
  blueCollarAvailabilityController.getAvailableForTraining(req, res)
);

export default router;
