import trainerService from '@/services/training/trainer/trainer.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create trainer
export const createTrainer = catchAsync(async (req: Request, res: Response) => {
  const trainer = await trainerService.createTrainer(req.body);

  res.status(201).json({
    success: true,
    message: 'Trainer created successfully',
    data: trainer,
  });
});

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

// Update trainer
export const updateTrainer = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const trainer = await trainerService.updateTrainer(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Trainer updated successfully',
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

// Delete trainer
export const deleteTrainer = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await trainerService.deleteTrainer(id);

  res.status(200).json({
    success: true,
    message: 'Trainer deleted successfully',
  });
});
