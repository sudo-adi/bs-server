import projectService from '@/services/projects/project.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create project with requirements
export const createProject = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.body);

  res.status(201).json({
    success: true,
    message: 'Project created successfully with requirements',
    data: project,
  });
});

// Get all projects with filters
export const getAllProjects = catchAsync(async (req: Request, res: Response) => {
  const { employer_id, status, is_active, search, limit, offset } = req.query;

  const filters = {
    employer_id: employer_id as string,
    status: status as string,
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    search: search as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectService.getAllProjects(filters);

  res.status(200).json({
    success: true,
    data: result.projects,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get project by ID with details
export const getProjectById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeDetails = req.query.include_details !== 'false'; // Default true

  const project = await projectService.getProjectById(id, includeDetails);

  res.status(200).json({
    success: true,
    data: project,
  });
});

// Get matched profiles for project (skill matching)
export const getMatchedProfiles = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const matchedProfiles = await projectService.getMatchedProfiles(id);

  res.status(200).json({
    success: true,
    message: 'Matched profiles retrieved successfully',
    data: matchedProfiles,
  });
});

// Update project (including requirements and is_active)
export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const project = await projectService.updateProject(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: project,
  });
});

// Approve or reject project (changes status from 'pending' to 'preparing' or stays 'pending' with rejection)
export const approveProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { approved_by_user_id, approve, approval_notes, rejection_reason } = req.body;

  const project = await projectService.approveProject(id, {
    approved_by_user_id,
    approve, // true = approve, false = reject
    approval_notes,
    rejection_reason,
  });

  res.status(200).json({
    success: true,
    message: approve ? 'Project approved and moved to preparing status' : 'Project rejected',
    data: project,
  });
});

// Delete project
export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const deletedByUserId = (req as any).userId; // Get from auth middleware if available
  await projectService.deleteProject(id, deletedByUserId);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});

// Save matched profiles for project
export const saveMatchedProfiles = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const { matched_profiles } = req.body;

  const result = await projectService.saveMatchedProfiles(projectId, matched_profiles);

  res.status(200).json({
    success: true,
    message: 'Matched profiles saved successfully',
    data: result,
  });
});

// Share matched profiles with employer
export const shareWithEmployer = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId;

  const result = await projectService.shareMatchedProfilesWithEmployer(projectId, userId);

  res.status(200).json({
    success: true,
    message: 'Profiles shared with employer successfully',
    data: result,
  });
});

// Get shared profiles for a project (for employer view)
export const getSharedProfiles = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;

  const profiles = await projectService.getSharedProfiles(projectId);

  res.status(200).json({
    success: true,
    data: profiles,
  });
});

// Create project from project request (approve project request)
export const createProjectFromRequest = catchAsync(async (req: Request, res: Response) => {
  const projectRequestId = req.params.projectRequestId;

  // Try to get userId from auth middleware first, then from request body
  const userId = (req as any).user?.id || req.body.userId;

  if (!userId) {
    throw new Error('User ID not found in request. Please ensure you are authenticated.');
  }

  const project = await projectService.createProjectFromRequest(projectRequestId, userId);

  res.status(201).json({
    success: true,
    message: 'Project created successfully from project request',
    data: project,
  });
});
