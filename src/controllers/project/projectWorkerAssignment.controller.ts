// @ts-nocheck
import { AppError } from '@/middlewares/errorHandler';
import { projectService } from '@/services/project';
import {
  BulkCreateAssignmentsDto,
  CreateProjectWorkerAssignmentDto,
  ProjectWorkerAssignmentFilters,
  RemoveAssignmentDto,
} from '@/types';
import { Request, Response } from 'express';

/**
 * Create a single worker assignment
 * POST /api/v1/project-worker-assignments
 */
export const createAssignment = async (req: Request, res: Response) => {
  const dto: CreateProjectWorkerAssignmentDto = req.body;

  // Validate required fields
  if (!dto.projectId || !dto.profileId || !dto.skillCategoryId || !dto.assigned_by_user_id) {
    throw new AppError('Missing required fields', 400);
  }

  const assignment = await projectService.assignWorkerToProject(
    dto.projectId,
    { profileId: dto.profileId },
    dto.assigned_by_user_id
  );

  res.status(201).json({
    success: true,
    data: assignment,
    message: 'Worker assigned to project successfully',
  });
};

/**
 * Bulk create worker assignments
 * POST /api/v1/projects/:id/workers/bulk
 */
export const bulkCreateAssignments = async (req: Request, res: Response) => {
  // Support both route param and body for projectId
  const projectId = req.params.id || req.body.projectId;
  const dto: BulkCreateAssignmentsDto = req.body;

  // Validate required fields
  if (
    !projectId ||
    !dto.assigned_by_user_id ||
    !dto.assignments ||
    dto.assignments.length === 0
  ) {
    throw new AppError('Missing required fields or empty assignments array', 400);
  }

  const result = await projectService.bulkAssignWorkersToProject(
    projectId,
    dto.assignments.map((a: any) => ({
      profileId: a.profileId,
      skillCategoryId: a.skillCategoryId,
    })),
    dto.assigned_by_user_id
  );

  res.status(201).json({
    success: true,
    data: result,
    message: `Bulk assignment completed. ${result.success} succeeded, ${result.failed} failed.`,
  });
};

/**
 * Get all assignments with filters
 * GET /api/v1/project-worker-assignments
 */
export const getAllAssignments = async (req: Request, res: Response) => {
  const filters: ProjectWorkerAssignmentFilters = {
    projectId: req.query.projectId as string,
    profileId: req.query.profileId as string,
    skillCategoryId: req.query.skillCategoryId as string,
    status: req.query.status as 'active' | 'removed' | 'all',
    from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
    to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await projectService.getAllAssignments(filters);

  res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

/**
 * Get assignment by ID
 * GET /api/v1/project-worker-assignments/:id
 */
export const getAssignmentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const assignment = await projectService.getAssignmentById(id);

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  res.status(200).json({
    success: true,
    data: assignment,
  });
};

/**
 * Get all assignments for a project
 * GET /api/v1/projects/:projectId/assignments
 */
export const getProjectAssignments = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const includeRemoved = req.query.include_removed === 'true';

  const assignments = await projectService.getProjectAssignments(projectId, includeRemoved);

  res.status(200).json({
    success: true,
    data: assignments,
  });
};

/**
 * Get all assignments for a worker
 * GET /api/v1/profiles/:profileId/assignments
 */
export const getWorkerAssignments = async (req: Request, res: Response) => {
  const { profileId } = req.params;
  const includeRemoved = req.query.include_removed === 'true';

  const assignments = await projectService.getWorkerAssignments(profileId, includeRemoved);

  res.status(200).json({
    success: true,
    data: assignments,
  });
};

/**
 * Get assignment statistics for a project
 * GET /api/v1/projects/:projectId/assignment-stats
 */
export const getProjectAssignmentStats = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const stats = await projectService.getProjectAssignmentStats(projectId);

  res.status(200).json({
    success: true,
    data: stats,
  });
};

/**
 * Remove a worker from a project
 * DELETE /api/v1/project-worker-assignments/:id
 */
export const removeAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const dto: RemoveAssignmentDto = req.body;

  // Validate required fields
  if (!dto.removed_by_user_id) {
    throw new AppError('removed_by_user_id is required', 400);
  }

  // Get assignment to find projectId
  const assignment = await projectService.getAssignmentById(id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }
  const result = await projectService.removeWorkerFromProject(
    assignment.projectId,
    id,
    { reason: dto.removal_reason },
    dto.removed_by_user_id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

/**
 * Bulk remove workers
 * POST /api/v1/project-worker-assignments/bulk-remove
 */
export const bulkRemoveAssignments = async (req: Request, res: Response) => {
  const { assignment_ids, removed_by_user_id, removal_reason } = req.body;

  if (!assignment_ids || assignment_ids.length === 0 || !removed_by_user_id) {
    throw new AppError('assignment_ids and removed_by_user_id are required', 400);
  }

  // Get first assignment to find projectId
  const firstAssignment = await projectService.getAssignmentById(assignment_ids[0]);
  if (!firstAssignment) {
    throw new AppError('Assignment not found', 404);
  }
  const result = await projectService.bulkRemoveWorkersFromProject(
    firstAssignment.projectId,
    assignment_ids,
    removal_reason || 'Bulk removal',
    removed_by_user_id
  );

  res.status(200).json({
    success: true,
    data: result,
    message: `Bulk removal completed. ${result.success} succeeded, ${result.failed} failed.`,
  });
};

/**
 * Validate worker assignment
 * POST /api/v1/project-worker-assignments/validate
 */
export const validateAssignment = async (req: Request, res: Response) => {
  const { profileId, projectId } = req.body;

  if (!profileId || !projectId) {
    throw new AppError('profileId and projectId are required', 400);
  }

  const validation = await projectService.validateWorkerAssignment(profileId, projectId);

  res.status(200).json({
    success: true,
    data: validation,
  });
};
