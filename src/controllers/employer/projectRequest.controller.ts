import {
  createProjectRequest,
  deleteProjectRequest as deleteRequest,
  getAllProjectRequests,
  getProjectRequestById,
  getProjectRequests,
  reviewProjectRequest,
  updateProjectRequest,
} from '@/services/employer/project-request';
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

  const result = await getAllProjectRequests(filters);

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

  const projectRequests = await getProjectRequests(employerId);

  res.status(200).json({
    success: true,
    data: projectRequests,
  });
});

// Get project request by ID
export const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectRequest = await getProjectRequestById(id);

  res.status(200).json({
    success: true,
    data: projectRequest,
  });
});

// Create new project request
export const create = catchAsync(async (req: Request, res: Response) => {
  const { employerId, ...data } = req.body;
  const projectRequest = await createProjectRequest(employerId, data);

  res.status(201).json({
    success: true,
    message: 'Project request created successfully',
    data: projectRequest,
  });
});

// Update project request
export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectRequest = await updateProjectRequest(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Project request updated successfully',
    data: projectRequest,
  });
});

// Review project request (admin)
export const review = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectRequest = await reviewProjectRequest(id, req.body);

  res.status(200).json({
    success: true,
    message: `Project request ${req.body.status}`,
    data: projectRequest,
  });
});

// Delete project request
export const deleteProjectRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteRequest(id);

  res.status(200).json({
    success: true,
    message: 'Project request deleted successfully',
  });
});
