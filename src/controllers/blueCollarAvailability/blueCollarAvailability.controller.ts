/**
 * Blue Collar Availability Controller
 * Handles availability checking for blue collar profiles
 */

import {
  BlueCollarAvailabilityQuery,
  CheckProfileAvailabilityQuery,
  parseAvailabilityQuery,
} from '@/dtos/blueCollarAvailability/blueCollarAvailability.dto';
import { blueCollarAvailabilityService } from '@/services/blueCollarAvailability';
import { Request, Response } from 'express';

export class BlueCollarAvailabilityController {
  /**
   * GET /blue-collar/availability
   * Get all profiles with their availability status
   */
  async getProfilesWithAvailability(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query as unknown as BlueCollarAvailabilityQuery;

      // Validate required fields
      if (!query.startDate || !query.endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      // Validate dates
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
        });
        return;
      }

      if (startDate > endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate must be before or equal to endDate',
        });
        return;
      }

      // Parse and validate query params
      const filters = parseAvailabilityQuery(query);

      // Get availability data
      const result = await blueCollarAvailabilityService.getProfilesWithAvailability(filters);

      res.status(200).json({
        success: true,
        data: {
          available: result.available,
          unavailable: result.unavailable,
          summary: result.summary,
        },
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error in getProfilesWithAvailability:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch availability data',
      });
    }
  }

  /**
   * GET /blue-collar/availability/check/:profileId
   * Check availability for a single profile
   */
  async checkProfileAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const query = req.query as unknown as Omit<CheckProfileAvailabilityQuery, 'profileId'>;

      // Validate required fields
      if (!query.startDate || !query.endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      // Validate dates
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)',
        });
        return;
      }

      if (startDate > endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate must be before or equal to endDate',
        });
        return;
      }

      // Check availability
      const result = await blueCollarAvailabilityService.checkAvailability(
        profileId,
        startDate,
        endDate,
        {
          excludeProjectId: query.excludeProjectId,
          excludeBatchId: query.excludeBatchId,
        }
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error in checkProfileAvailability:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check availability',
      });
    }
  }

  /**
   * GET /blue-collar/availability/project/:projectId
   * Get profiles available for a specific project
   */
  async getAvailableForProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const query = req.query as unknown as BlueCollarAvailabilityQuery;

      // Parse query params (dates will come from project)
      const filters = {
        availabilityStatus: query.availabilityStatus as 'available' | 'unavailable' | 'all' | undefined,
        skillCategoryIds: query.skillCategoryIds
          ? Array.isArray(query.skillCategoryIds)
            ? query.skillCategoryIds
            : String(query.skillCategoryIds).split(',')
          : undefined,
        gender: query.gender,
        minAge: query.minAge ? parseInt(String(query.minAge)) : undefined,
        maxAge: query.maxAge ? parseInt(String(query.maxAge)) : undefined,
        stages: query.stages
          ? Array.isArray(query.stages)
            ? query.stages
            : String(query.stages).split(',')
          : undefined,
        districts: query.districts
          ? Array.isArray(query.districts)
            ? query.districts
            : String(query.districts).split(',')
          : undefined,
        states: query.states
          ? Array.isArray(query.states)
            ? query.states
            : String(query.states).split(',')
          : undefined,
        search: query.search,
        sortBy: query.sortBy as 'name' | 'code' | 'age' | undefined,
        sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
        page: query.page ? parseInt(String(query.page)) : 1,
        limit: Math.min(query.limit ? parseInt(String(query.limit)) : 20, 100),
      };

      const result = await blueCollarAvailabilityService.getAvailableForProject(projectId, filters);

      res.status(200).json({
        success: true,
        data: {
          available: result.available,
          unavailable: result.unavailable,
          summary: result.summary,
        },
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error in getAvailableForProject:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch availability for project',
      });
    }
  }

  /**
   * GET /blue-collar/availability/training/:batchId
   * Get profiles available for a specific training batch
   */
  async getAvailableForTraining(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const query = req.query as unknown as BlueCollarAvailabilityQuery;

      // Parse query params (dates will come from batch)
      const filters = {
        availabilityStatus: query.availabilityStatus as 'available' | 'unavailable' | 'all' | undefined,
        skillCategoryIds: query.skillCategoryIds
          ? Array.isArray(query.skillCategoryIds)
            ? query.skillCategoryIds
            : String(query.skillCategoryIds).split(',')
          : undefined,
        gender: query.gender,
        minAge: query.minAge ? parseInt(String(query.minAge)) : undefined,
        maxAge: query.maxAge ? parseInt(String(query.maxAge)) : undefined,
        stages: query.stages
          ? Array.isArray(query.stages)
            ? query.stages
            : String(query.stages).split(',')
          : undefined,
        districts: query.districts
          ? Array.isArray(query.districts)
            ? query.districts
            : String(query.districts).split(',')
          : undefined,
        states: query.states
          ? Array.isArray(query.states)
            ? query.states
            : String(query.states).split(',')
          : undefined,
        search: query.search,
        sortBy: query.sortBy as 'name' | 'code' | 'age' | undefined,
        sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
        page: query.page ? parseInt(String(query.page)) : 1,
        limit: Math.min(query.limit ? parseInt(String(query.limit)) : 20, 100),
      };

      const result = await blueCollarAvailabilityService.getAvailableForTraining(batchId, filters);

      res.status(200).json({
        success: true,
        data: {
          available: result.available,
          unavailable: result.unavailable,
          summary: result.summary,
        },
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error in getAvailableForTraining:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch availability for training batch',
      });
    }
  }
}

export const blueCollarAvailabilityController = new BlueCollarAvailabilityController();
