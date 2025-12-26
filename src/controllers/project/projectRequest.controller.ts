// @ts-nocheck
import { projectRequestService } from '@/services/project';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create employer project request
export const createProjectRequest = catchAsync(async (req: Request, res: Response) => {
  const requirement = await projectRequestService.createRequirement(req.body);

  res.status(201).json({
    success: true,
    message: 'Employer project request created successfully',
    data: requirement,
  });
});

// Get all project requests with filters
export const getAllProjectRequests = catchAsync(async (req: Request, res: Response) => {
  const { employerId, status, limit, offset } = req.query;

  const filters = {
    employerId: employerId as string | undefined,
    status: status as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectRequestService.getAllRequirements(filters);

  res.status(200).json({
    success: true,
    data: result.requirements,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get project request by ID
export const getProjectRequestById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeDetails = req.query.include_details === 'true';

  const requirement = await projectRequestService.getRequirementById(id, includeDetails);

  res.status(200).json({
    success: true,
    data: requirement,
  });
});

// Update project request
export const updateProjectRequest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const requirement = await projectRequestService.updateRequirement(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Employer project request updated successfully',
    data: requirement,
  });
});

// Delete project request
export const deleteProjectRequest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await projectRequestService.deleteRequirement(id);

  res.status(200).json({
    success: true,
    message: 'Employer project request deleted successfully',
  });
});

// Mark requirement as reviewed
export const markAsReviewed = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { reviewed_by_user_id } = req.body;

  const requirement = await projectRequestService.markAsReviewed(id, reviewed_by_user_id);

  res.status(200).json({
    success: true,
    message: 'Requirement marked as reviewed',
    data: requirement,
  });
});

// Link requirement to created project
export const linkToProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { projectId } = req.body;

  const requirement = await projectRequestService.linkToProject(id, projectId);

  res.status(200).json({
    success: true,
    message: 'Requirement linked to project successfully',
    data: requirement,
  });
});

// Approve project request
export const approveRequest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { reviewed_by_user_id } = req.body;

  const requirement = await projectRequestService.approveRequest(id, reviewed_by_user_id as string);

  res.status(200).json({
    success: true,
    message: 'Project request approved successfully',
    data: requirement,
  });
});

// Reject project request
export const rejectRequest = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { reviewed_by_user_id, rejection_reason } = req.body;

  const requirement = await projectRequestService.rejectRequest(
    id,
    reviewed_by_user_id as string,
    rejection_reason
  );

  res.status(200).json({
    success: true,
    message: 'Project request rejected',
    data: requirement,
  });
});

// Convert approved project request to project
// TODO: Implement convertToProject in service
// export const convertToProject = catchAsync(async (req: Request, res: Response) => {
//   const id = req.params.id;
//   const { created_by_user_id } = req.body;

//   const project = await projectRequestService.convertToProject(id, created_by_user_id as string);

//   res.status(201).json({
//     success: true,
//     message: 'Project created from request successfully',
//     data: project,
//   });
// });
