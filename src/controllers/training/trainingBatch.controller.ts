import trainingBatchService from '@/services/training/trainingBatch/trainingBatch.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create training batch
export const createBatch = catchAsync(async (req: Request, res: Response) => {
  const batch = await trainingBatchService.createBatch(req.body);

  res.status(201).json({
    success: true,
    message: 'Training batch created successfully',
    data: batch,
  });
});

// Get all batches with filters
export const getAllBatches = catchAsync(async (req: Request, res: Response) => {
  const { status, search, limit, offset } = req.query;

  const filters = {
    status: status as string,
    search: search as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await trainingBatchService.getAllBatches(filters);

  res.status(200).json({
    success: true,
    data: result.batches,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get batch by ID
export const getBatchById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeEnrollments = req.query.include_enrollments === 'true';

  const batch = await trainingBatchService.getBatchById(id, includeEnrollments);

  res.status(200).json({
    success: true,
    data: batch,
  });
});

// Update batch (including status changes)
export const updateBatch = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const batch = await trainingBatchService.updateBatch(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Training batch updated successfully',
    data: batch,
  });
});

// Delete batch
export const deleteBatch = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await trainingBatchService.deleteBatch(id);

  res.status(200).json({
    success: true,
    message: 'Training batch deleted successfully',
  });
});
