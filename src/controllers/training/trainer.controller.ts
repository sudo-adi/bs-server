import logger from '@/config/logger';
import {
  TrainerListQuery,
  TrainerLookupQuery,
  trainerService,
} from '@/services/training/trainer.service';
import { Request, Response } from 'express';

class TrainerController {
  /**
   * Get all trainers with availability
   * GET /trainers
   */
  async getAllTrainers(req: Request, res: Response): Promise<void> {
    try {
      const query: TrainerListQuery = {
        available: req.query.available === 'true',
        shift: req.query.shift as 'shift_1' | 'shift_2' | undefined,
        search: req.query.search as string | undefined,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await trainerService.getAllTrainers(query);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error fetching trainers', { error });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch trainers',
      });
    }
  }

  /**
   * Lookup trainers for a batch timeline - returns available and unavailable separately
   * GET /trainers/lookup
   * Query params: startDate, endDate, shift?, search?, page?, limit?
   */
  async lookupTrainersForBatch(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, shift, search, page, limit } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const query: TrainerLookupQuery = {
        batchStartDate: new Date(startDate as string),
        batchEndDate: new Date(endDate as string),
        shift: shift as 'shift_1' | 'shift_2' | undefined,
        search: search as string | undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const result = await trainerService.getTrainersForBatch(query);

      res.json({
        success: true,
        available: result.available,
        unavailable: result.unavailable,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error looking up trainers for batch', { error });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to lookup trainers',
      });
    }
  }

  /**
   * Get a single trainer by ID
   * GET /trainers/:id
   */
  async getTrainerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const trainer = await trainerService.getTrainerById(id);

      if (!trainer) {
        res.status(404).json({
          success: false,
          message: 'Trainer not found',
        });
        return;
      }

      res.json({
        success: true,
        data: trainer,
      });
    } catch (error) {
      logger.error('Error fetching trainer', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch trainer',
      });
    }
  }

  /**
   * Get batches assigned to a trainer
   * GET /trainers/:id/batches
   */
  async getTrainerBatches(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const status = req.query.status as string | undefined;

      const batches = await trainerService.getTrainerBatches(id, status);

      res.json({
        success: true,
        data: batches,
      });
    } catch (error) {
      logger.error('Error fetching trainer batches', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch trainer batches',
      });
    }
  }

  /**
   * Create a new trainer
   * POST /trainers
   */
  async createTrainer(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, dateOfBirth, gender } = req.body;

      if (!name || !phone) {
        res.status(400).json({
          success: false,
          message: 'Name and phone are required',
        });
        return;
      }

      const trainer = await trainerService.createTrainer({
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
      });

      res.status(201).json({
        success: true,
        message: 'Trainer created successfully',
        data: trainer,
      });
    } catch (error) {
      logger.error('Error creating trainer', { error });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create trainer',
      });
    }
  }

  /**
   * Update a trainer
   * PATCH /trainers/:id
   */
  async updateTrainer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone, isActive, dateOfBirth, gender } = req.body;

      const trainer = await trainerService.updateTrainer(id, {
        name,
        email,
        phone,
        isActive,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
      });

      if (!trainer) {
        res.status(404).json({
          success: false,
          message: 'Trainer not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Trainer updated successfully',
        data: trainer,
      });
    } catch (error) {
      logger.error('Error updating trainer', { error, id: req.params.id });
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update trainer',
      });
    }
  }
}

export const trainerController = new TrainerController();
export default trainerController;
