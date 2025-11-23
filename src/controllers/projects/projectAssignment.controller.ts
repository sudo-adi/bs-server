import { projectAssignmentService } from '@/services/projects';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create single assignment
export const createAssignment = catchAsync(async (req: Request, res: Response) => {
  const assignment = await projectAssignmentService.createAssignment(req.body);

  res.status(201).json({
    success: true,
    message: 'Profile deployed successfully. Stage changed to deployed.',
    data: assignment,
  });
});

// Bulk deploy multiple profiles (CRITICAL for workflow)
export const bulkDeployProfiles = catchAsync(async (req: Request, res: Response) => {
  const { project_id, profile_ids, assignment_date, expected_end_date, assigned_by_user_id } =
    req.body;

  if (!project_id || !profile_ids || !Array.isArray(profile_ids) || profile_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'project_id and profile_ids array are required',
    });
  }

  // Create assignments for all profiles
  const assignments = [];
  const errors = [];

  for (const profile_id of profile_ids) {
    try {
      const assignment = await projectAssignmentService.createAssignment({
        project_id,
        profile_id,
        assignment_date,
        expected_end_date,
        assigned_by_user_id,
      });
      assignments.push(assignment);
    } catch (error: any) {
      errors.push({
        profile_id,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${assignments.length} profiles deployed successfully. ${errors.length} failed.`,
    data: {
      deployed: assignments,
      failed: errors,
      summary: {
        total: profile_ids.length,
        success: assignments.length,
        failed: errors.length,
      },
    },
  });
});

// Get all assignments with filters
export const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
  const { project_id, profile_id, limit, offset, include_details } = req.query;

  const filters = {
    project_id: project_id as string | undefined,
    profile_id: profile_id as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    include_details: include_details === 'true',
  };

  const result = await projectAssignmentService.getAllAssignments(filters);

  res.status(200).json({
    success: true,
    data: result.assignments,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get assignment by ID
export const getAssignmentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeDetails = req.query.include_details === 'true';

  const assignment = await projectAssignmentService.getAssignmentById(id, includeDetails);

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// Update assignment (including status to complete)
export const updateAssignment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const assignment = await projectAssignmentService.updateAssignment(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Assignment updated successfully',
    data: assignment,
  });
});

// Delete assignment
export const deleteAssignment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await projectAssignmentService.deleteAssignment(id);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});

// Deploy project to employer (change status from preparing to deployed)
export const deployProjectToEmployer = catchAsync(async (req: Request, res: Response) => {
  const { project_id, assignment_date } = req.body;

  if (!project_id || !assignment_date) {
    return res.status(400).json({
      success: false,
      message: 'project_id and assignment_date are required',
    });
  }
});

// Activate assignment (when project starts)
export const activateAssignment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const assignment = await projectAssignmentService.activateAssignment(id);

  res.status(200).json({
    success: true,
    message: 'Assignment activated successfully',
    data: assignment,
  });
});

// Complete assignment (when project ends)
export const completeAssignment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { actual_end_date } = req.body;

  const assignment = await projectAssignmentService.completeAssignment(
    id,
    actual_end_date ? new Date(actual_end_date) : undefined
  );

  res.status(200).json({
    success: true,
    message: 'Assignment completed successfully',
    data: assignment,
  });
});

// Cancel assignment (before project starts)
export const cancelAssignment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { reason } = req.body;

  const assignment = await projectAssignmentService.cancelAssignment(id, reason);

  res.status(200).json({
    success: true,
    message: 'Assignment cancelled successfully',
    data: assignment,
  });
});
