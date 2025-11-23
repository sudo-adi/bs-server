import type {
  CompleteProjectDto,
  HoldProjectDto,
  ResumeProjectDto,
  ShortCloseProjectDto,
  StartProjectDto,
  StatusTransitionRequestDto,
  TerminateProjectDto,
} from '@/dtos/project-status.dto';
import { projectService } from '@/services/projects';
import catchAsync from '@/utils/catchAsync';
import type { Request, Response } from 'express';

/**
 * Generic status transition endpoint
 * POST /api/projects/:id/status/transition
 */
export const transitionStatus = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: StatusTransitionRequestDto = {
    ...req.body,
    changed_by_user_id: userId,
  };

  const result = await projectService.transitionProjectStatus(projectId, data);

  res.status(200).json({
    success: true,
    message: `Project status transitioned to ${data.to_status} successfully`,
    data: result,
  });
});

/**
 * Put project on hold
 * POST /api/projects/:id/status/hold
 */
export const holdProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: HoldProjectDto = req.body;

  const result = await projectService.holdProject(projectId, data, userId);

  res.status(200).json({
    success: true,
    message: `Project put on hold (attributable to: ${data.attributable_to})`,
    data: result,
  });
});

/**
 * Resume project from hold
 * POST /api/projects/:id/status/resume
 */
export const resumeProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: ResumeProjectDto = req.body;

  const result = await projectService.resumeProject(projectId, data, userId);

  res.status(200).json({
    success: true,
    message: 'Project resumed from on hold status',
    data: result,
  });
});

/**
 * Start project (transition to ONGOING)
 * POST /api/projects/:id/status/start
 */
export const startProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: StartProjectDto = req.body;

  const result = await projectService.startProject(projectId, data, userId);

  res.status(200).json({
    success: true,
    message: 'Project started successfully',
    data: result,
  });
});

/**
 * Complete project
 * POST /api/projects/:id/status/complete
 */
export const completeProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: CompleteProjectDto = req.body;

  const result = await projectService.completeProject(projectId, data, userId);

  res.status(200).json({
    success: true,
    message: 'Project completed successfully',
    data: result,
  });
});

/**
 * Short close project (early completion)
 * POST /api/projects/:id/status/short-close
 */
export const shortCloseProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: ShortCloseProjectDto = req.body;

  const result = await projectService.shortCloseProject(projectId, data, userId);

  res.status(200).json({
    success: true,
    message: 'Project short closed successfully',
    data: result,
  });
});

/**
 * Terminate project
 * POST /api/projects/:id/status/terminate
 */
export const terminateProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const userId = (req as any).userId || (req as any).user?.id;

  if (!userId) {
    throw new Error('User ID not found. Please ensure you are authenticated.');
  }

  const data: TerminateProjectDto = req.body;

  const result = await projectService.terminateProject(projectId, data, userId);

  res.status(200).json({
    success: true,
    message: 'Project terminated successfully',
    data: result,
  });
});

/**
 * Get project status history
 * GET /api/projects/:id/status/history
 */
export const getStatusHistory = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const { limit, offset, from_status, to_status } = req.query;

  const options = {
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
    from_status: from_status as string,
    to_status: to_status as string,
  };

  const result = await projectService.getProjectStatusHistory(projectId, options);

  res.status(200).json({
    success: true,
    data: result.history,
    pagination: {
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    },
  });
});

/**
 * Get status history by ID
 * GET /api/projects/status/history/:historyId
 */
export const getStatusHistoryById = catchAsync(async (req: Request, res: Response) => {
  const historyId = req.params.historyId;

  const history = await projectService.getStatusHistoryById(historyId);

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * Get project status documents
 * GET /api/projects/:id/status/documents
 */
export const getStatusDocuments = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const { status, limit, offset } = req.query;

  const options = {
    status: status as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await projectService.getProjectStatusDocuments(projectId, options);

  res.status(200).json({
    success: true,
    data: result.documents,
    pagination: {
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    },
  });
});

/**
 * Get documents by history ID
 * GET /api/projects/status/history/:historyId/documents
 */
export const getDocumentsByHistoryId = catchAsync(async (req: Request, res: Response) => {
  const historyId = req.params.historyId;

  const documents = await projectService.getDocumentsByHistoryId(historyId);

  res.status(200).json({
    success: true,
    data: documents,
  });
});
