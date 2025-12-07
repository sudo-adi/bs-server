import trainerService from '@/services/training/trainer/trainer.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import { UpdateTrainerDto } from '@/types/domain/training/trainer.dto';

/**
 * Trainer controllers
 * NOTE: Basic profile details (name, email, phone, etc.) are managed through profiles CRUD
 * This controller handles:
 * - Querying trainers (read operations)
 * - Updating trainer-specific fields (specialization, certifications, bio, etc.)
 */

// Get all trainers with filters
export const getAllTrainers = catchAsync(async (req: Request, res: Response) => {
  const { is_active, search, limit, offset } = req.query;

  const filters = {
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    search: search as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await trainerService.getAllTrainers(filters);

  res.status(200).json({
    success: true,
    data: result.trainers,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get trainer by ID
export const getTrainerById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeBatches = req.query.include_batches === 'true';

  const trainer = await trainerService.getTrainerById(id, includeBatches);

  res.status(200).json({
    success: true,
    data: trainer,
  });
});

// Get batches for a specific trainer
export const getTrainerBatches = catchAsync(async (req: Request, res: Response) => {
  const trainerId = req.params.id;
  const batches = await trainerService.getTrainerBatches(trainerId);

  res.status(200).json({
    success: true,
    data: batches,
  });
});

// Update trainer-specific fields (specialization, certifications, bio, etc.)
export const updateTrainer = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const data: UpdateTrainerDto = req.body;

  const trainer = await trainerService.updateTrainer(id, data);

  res.status(200).json({
    success: true,
    data: trainer,
    message: 'Trainer updated successfully',
  });
});
