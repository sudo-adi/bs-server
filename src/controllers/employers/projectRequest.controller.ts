import projectRequestService from '@/services/employers/projectRequest.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Get all project requests (admin)
export const getAll = catchAsync(async (req: Request, res: Response) => {
  const { status, limit, offset } = req.query;

  const filters = {
    status: status as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectRequestService.getAll(filters);

  res.status(200).json({
    success: true,
    data: result.projectRequests,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get all project requests for a specific employer
export const getAllByEmployerId = catchAsync(async (req: Request, res: Response) => {
  const { employerId } = req.params;
  const { status, limit, offset } = req.query;

  const filters = {
    status: status as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectRequestService.getAllByEmployerId(employerId, filters);

  res.status(200).json({
    success: true,
    data: result.projectRequests,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get project request by ID
export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectRequest = await projectRequestService.getById(id);

  res.status(200).json({
    success: true,
    data: projectRequest,
  });
});

// Create new project request
export const create = catchAsync(async (req: Request, res: Response) => {
  const projectRequest = await projectRequestService.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Project request created successfully',
    data: projectRequest,
  });
});

// Update project request
export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectRequest = await projectRequestService.update(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Project request updated successfully',
    data: projectRequest,
  });
});

// Review project request (admin)
export const review = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectRequest = await projectRequestService.review(id, req.body);

  res.status(200).json({
    success: true,
    message: `Project request ${req.body.status}`,
    data: projectRequest,
  });
});

// Delete project request
export const deleteProjectRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await projectRequestService.delete(id);

  res.status(200).json({
    success: true,
    message: 'Project request deleted successfully',
  });
});
