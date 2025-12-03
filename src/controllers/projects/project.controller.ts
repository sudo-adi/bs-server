import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { projectService } from '@/services/projects';
import completeProjectOperation from '@/services/projects/project/operations/project-status-complete.operation';
import holdProjectOperation from '@/services/projects/project/operations/project-status-hold.operation';
import resumeProjectOperation from '@/services/projects/project/operations/project-status-resume.operation';
import shortCloseProjectOperation from '@/services/projects/project/operations/project-status-shortclose.operation';
import startProjectOperation from '@/services/projects/project/operations/project-status-start.operation';
import terminateProjectOperation from '@/services/projects/project/operations/project-status-terminate.operation';
import storageService from '@/services/storage/storage.service';
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

  const result = await projectService.shareMatchedProfilesWithEmployer(projectId);

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

// ==================== Project Status Transitions ====================

/**
 * Start Project
 * POST /api/v1/projects/:id/status/start
 */
export const startProject = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id, start_date, notes } = req.body;

  if (!user_id || !start_date) {
    throw new AppError('user_id and start_date are required', 400);
  }

  const result = await startProjectOperation.startProject(
    projectId,
    user_id,
    new Date(start_date),
    notes
  );

  res.status(200).json({
    success: true,
    message: 'Project started successfully',
    data: result,
  });
});

/**
 * Complete Project
 * POST /api/v1/projects/:id/status/complete
 */
export const completeProject = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id, actual_end_date, completion_notes } = req.body;

  if (!user_id || !actual_end_date) {
    throw new AppError('user_id and actual_end_date are required', 400);
  }

  const result = await completeProjectOperation.completeProject(
    projectId,
    user_id,
    new Date(actual_end_date),
    completion_notes
  );

  res.status(200).json({
    success: true,
    message: 'Project completed successfully',
    data: result,
  });
});

/**
 * Put Project on Hold
 * POST /api/v1/projects/:id/status/hold
 * Accepts file uploads via multipart/form-data
 */
export const holdProject = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id, on_hold_reason, notes } = req.body;

  if (!user_id || !on_hold_reason) {
    throw new AppError('user_id and on_hold_reason are required', 400);
  }

  if (!['employer', 'buildsewa', 'force_majeure'].includes(on_hold_reason)) {
    throw new AppError('on_hold_reason must be: employer, buildsewa, or force_majeure', 400);
  }

  // Handle file uploads if present
  const documents = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    try {
      for (const file of req.files) {
        const timestamp = Date.now();
        const fileName = `${file.originalname.replace(/\s/g, '_')}`;
        const filePath = `projects/${projectId}/hold/${timestamp}_${fileName}`;

        // Upload to Supabase
        const fileUrl = await storageService.upload(file.buffer, filePath, file.mimetype);

        documents.push({
          document_title: file.originalname,
          file_url: fileUrl,
          uploaded_by_user_id: user_id,
        });
      }
    } catch (uploadError: any) {
      console.error('File upload error:', uploadError.message);
      console.warn('Continuing without file uploads due to storage configuration issue');
      // Don't throw error - continue without documents
      // Files are optional, so we just skip the upload if it fails
    }
  }

  const result = await holdProjectOperation.holdProject(
    projectId,
    user_id,
    on_hold_reason,
    notes,
    documents
  );

  res.status(200).json({
    success: true,
    message: 'Project put on hold successfully',
    data: result,
  });
});

/**
 * Terminate Project
 * POST /api/v1/projects/:id/status/terminate
 * Accepts file uploads via multipart/form-data
 */
export const terminateProject = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id, termination_date, termination_reason } = req.body;

  if (!user_id || !termination_date || !termination_reason) {
    throw new AppError('user_id, termination_date, and termination_reason are required', 400);
  }

  // Handle file uploads if present
  const documents = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    try {
      for (const file of req.files) {
        const timestamp = Date.now();
        const fileName = `${file.originalname.replace(/\s/g, '_')}`;
        const filePath = `projects/${projectId}/terminate/${timestamp}_${fileName}`;

        // Upload to Supabase
        const fileUrl = await storageService.upload(file.buffer, filePath, file.mimetype);

        documents.push({
          document_title: file.originalname,
          file_url: fileUrl,
          uploaded_by_user_id: user_id,
        });
      }
    } catch (uploadError: any) {
      console.error('File upload error:', uploadError.message);
      console.warn('Continuing without file uploads due to storage configuration issue');
      // Don't throw error - continue without documents
      // Files are optional, so we just skip the upload if it fails
    }
  }

  const result = await terminateProjectOperation.terminateProject(
    projectId,
    user_id,
    new Date(termination_date),
    termination_reason,
    documents
  );

  res.status(200).json({
    success: true,
    message: 'Project terminated successfully',
    data: result,
  });
});

/**
 * Resume Project from Hold
 * POST /api/v1/projects/:id/status/resume
 */
export const resumeProject = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id, resume_reason } = req.body;

  if (!user_id) {
    throw new AppError('user_id is required', 400);
  }

  const result = await resumeProjectOperation.resumeProject(
    projectId,
    user_id,
    resume_reason || 'Project resumed from hold'
  );

  res.status(200).json({
    success: true,
    message: 'Project resumed successfully',
    data: result,
  });
});

/**
 * Short Close Project
 * POST /api/v1/projects/:id/status/short-close
 * Accepts file uploads via multipart/form-data
 */
export const shortCloseProject = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id, actual_end_date, short_close_reason } = req.body;

  if (!user_id || !actual_end_date || !short_close_reason) {
    throw new AppError('user_id, actual_end_date, and short_close_reason are required', 400);
  }

  // Handle file uploads if present
  const documents = [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    try {
      for (const file of req.files) {
        const timestamp = Date.now();
        const fileName = `${file.originalname.replace(/\s/g, '_')}`;
        const filePath = `projects/${projectId}/short-close/${timestamp}_${fileName}`;

        // Upload to Supabase
        const fileUrl = await storageService.upload(file.buffer, filePath, file.mimetype);

        documents.push({
          document_title: file.originalname,
          file_url: fileUrl,
          uploaded_by_user_id: user_id,
        });
      }
    } catch (uploadError: any) {
      console.error('File upload error:', uploadError.message);
      console.warn('Continuing without file uploads due to storage configuration issue');
      // Don't throw error - continue without documents
      // Files are optional, so we just skip the upload if it fails
    }
  }

  const result = await shortCloseProjectOperation.shortCloseProject(
    projectId,
    user_id,
    new Date(actual_end_date),
    short_close_reason,
    documents
  );

  res.status(200).json({
    success: true,
    message: 'Project short closed successfully',
    data: result,
  });
});

/**
 * Get Status History for Project
 * GET /api/v1/projects/:id/status/history
 */
export const getStatusHistory = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;

  const history = await prisma.project_status_history.findMany({
    where: { project_id: projectId },
    include: {
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
      project_status_documents: {
        orderBy: { created_at: 'desc' },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * Get Status Documents for Project
 * GET /api/v1/projects/:id/status/documents
 */
export const getStatusDocuments = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { status } = req.query;

  const where: any = { project_id: projectId };
  if (status) {
    where.status = status;
  }

  const documents = await prisma.project_status_documents.findMany({
    where,
    include: {
      project_status_history: {
        select: {
          to_status: true,
          change_reason: true,
          status_date: true,
          attributable_to: true,
        },
      },
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: documents,
  });
});

// ==================== Worker Matching Controllers ====================

/**
 * Get Matchable Workers
 * GET /api/v1/projects/:id/matchable-workers
 */
export const getMatchableWorkers = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { skill_category_id, search, limit, offset } = req.query;

  const filters = {
    skill_category_id: skill_category_id as string | undefined,
    search: search as string | undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectService.getMatchableWorkers(projectId, filters);

  res.status(200).json({
    success: true,
    message: 'Matchable workers retrieved successfully',
    data: result.workers,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

/**
 * Get Matchable Workers Count by Skill
 * GET /api/v1/projects/:id/matchable-workers/count-by-skill
 */
export const getMatchableWorkersCountBySkill = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;

  const result = await projectService.getMatchableWorkersCountBySkill(projectId);

  res.status(200).json({
    success: true,
    message: 'Matchable workers count by skill retrieved successfully',
    data: result,
  });
});

/**
 * Auto-Match Helpers
 * POST /api/v1/projects/:id/auto-match-helpers
 */
export const autoMatchHelpers = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    throw new AppError('user_id is required', 400);
  }

  const result = await projectService.autoMatchHelpers(projectId, user_id);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      success_count: result.success,
      failed_count: result.failed,
      required_count: result.required_count,
      available_count: result.available_count,
      assignments: result.assignments,
      errors: result.errors,
    },
  });
});

/**
 * Get Auto-Match Preview
 * GET /api/v1/projects/:id/auto-match-helpers/preview
 */
export const getAutoMatchPreview = catchAsync(async (req: Request, res: Response) => {
  const { id: projectId } = req.params;

  const result = await projectService.getAutoMatchPreview(projectId);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      can_auto_match: result.can_auto_match,
      required_count: result.required_count,
      already_assigned: result.already_assigned,
      remaining_needed: result.remaining_needed,
      available_count: result.available_count,
      workers_to_match: result.workers_to_match,
    },
  });
});
