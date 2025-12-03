import { Request, Response } from 'express';
import projectWorkerAssignmentService from '@/services/projects/projectWorkerAssignment/projectWorkerAssignment.service';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateProjectWorkerAssignmentDto,
  BulkCreateAssignmentsDto,
  RemoveAssignmentDto,
  ProjectWorkerAssignmentFilters,
} from '@/types';

/**
 * Create a single worker assignment
 * POST /api/v1/project-worker-assignments
 */
export const createAssignment = async (req: Request, res: Response) => {
  const dto: CreateProjectWorkerAssignmentDto = req.body;

  // Validate required fields
  if (!dto.project_id || !dto.profile_id || !dto.skill_category_id || !dto.assigned_by_user_id) {
    throw new AppError('Missing required fields', 400);
  }

  const assignment = await projectWorkerAssignmentService.createAssignment(dto);

  res.status(201).json({
    success: true,
    data: assignment,
    message: 'Worker assigned to project successfully',
  });
};

/**
 * Bulk create worker assignments
 * POST /api/v1/project-worker-assignments/bulk
 */
export const bulkCreateAssignments = async (req: Request, res: Response) => {
  const dto: BulkCreateAssignmentsDto = req.body;

  // Validate required fields
  if (!dto.project_id || !dto.assigned_by_user_id || !dto.assignments || dto.assignments.length === 0) {
    throw new AppError('Missing required fields or empty assignments array', 400);
  }

  const result = await projectWorkerAssignmentService.bulkCreateAssignments(dto);

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
    project_id: req.query.project_id as string,
    profile_id: req.query.profile_id as string,
    skill_category_id: req.query.skill_category_id as string,
    status: req.query.status as 'active' | 'removed' | 'all',
    from_date: req.query.from_date ? new Date(req.query.from_date as string) : undefined,
    to_date: req.query.to_date ? new Date(req.query.to_date as string) : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
  };

  const result = await projectWorkerAssignmentService.getAllAssignments(filters);

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

  const assignment = await projectWorkerAssignmentService.getAssignmentById(id);

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

  const assignments = await projectWorkerAssignmentService.getProjectAssignments(
    projectId,
    includeRemoved
  );

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

  const assignments = await projectWorkerAssignmentService.getWorkerAssignments(
    profileId,
    includeRemoved
  );

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

  const stats = await projectWorkerAssignmentService.getProjectAssignmentStats(projectId);

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

  const result = await projectWorkerAssignmentService.removeAssignment(id, dto);

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

  const result = await projectWorkerAssignmentService.bulkRemoveAssignments(assignment_ids, {
    removed_by_user_id,
    removal_reason,
  });

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
  const { profile_id, project_id } = req.body;

  if (!profile_id || !project_id) {
    throw new AppError('profile_id and project_id are required', 400);
  }

  const validation = await projectWorkerAssignmentService.validateAssignment(profile_id, project_id);

  res.status(200).json({
    success: true,
    data: validation,
  });
};
