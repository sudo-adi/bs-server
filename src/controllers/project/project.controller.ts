import prisma from '@/config/prisma';
import {
  AssignWorkerToProjectRequest,
  CancelProjectRequest,
  CompleteProjectRequest,
  CreateProjectRequest,
  HoldProjectRequest,
  ProjectListQuery,
  RemoveWorkerFromProjectRequest,
  ResumeProjectRequest,
  ShareProjectRequest,
  ShortCloseProjectRequest,
  StartPlanningRequest,
  StartProjectRequest,
  TerminateProjectRequest,
  UpdateProjectRequest,
  UpdateProjectStageRequest,
} from '@/dtos/project';
import { projectService, projectWorkerService } from '@/services/project';
import projectStatusService from '@/services/project/projectStatus.service';
import { uploadProjectDocument } from '@/utils/fileStorage';
import { Request, Response } from 'express';

/**
 * Controller for handling project HTTP requests
 */
export class ProjectController {
  /**
   * Get all projects with filters
   * GET /api/projects
   */
  async getAllProjects(req: Request, res: Response): Promise<void> {
    try {
      const query: ProjectListQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        status: req.query.status as string,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        employerId: req.query.employerId as string,
        projectManagerProfileId: req.query.projectManagerProfileId as string,
      };

      const result = await projectService.getAllProjects(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch projects',
      });
    }
  }

  /**
   * Get project by ID
   * GET /api/projects/:id
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch project',
      });
    }
  }

  /**
   * Create a new project
   * POST /api/projects
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateProjectRequest = req.body;

      // Validate required fields
      if (!data.name) {
        res.status(400).json({
          success: false,
          message: 'Project name is required',
        });
        return;
      }

      const createdByProfileId = req.user?.id;

      const project = await projectService.createProject(data, createdByProfileId);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create project',
      });
    }
  }

  /**
   * Create project from employer project request
   * POST /api/projects/from-request/:projectRequestId
   */
  async createProjectFromRequest(req: Request, res: Response): Promise<void> {
    try {
      const { projectRequestId } = req.params;
      const userId = req.user?.id || req.body.userId;

      if (!projectRequestId) {
        res.status(400).json({
          success: false,
          message: 'Project request ID is required',
        });
        return;
      }

      const project = await projectService.createProjectFromRequest(projectRequestId, userId);

      res.status(201).json({
        success: true,
        message: 'Project created successfully from request',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message?.includes('not found')
        ? 404
        : error.message?.includes('already')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create project from request',
      });
    }
  }

  /**
   * Update project
   * PATCH /api/projects/:id
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateProjectRequest = req.body;

      const updatedByProfileId = req.user?.id;

      const project = await projectService.updateProject(id, data, updatedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update project',
      });
    }
  }

  /**
   * Soft delete project
   * DELETE /api/projects/:id
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await projectService.deleteProject(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete project',
      });
    }
  }

  /**
   * Update project stage
   * PATCH /api/projects/:id/stage
   */
  async updateProjectStage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateProjectStageRequest = req.body;

      if (!data.stage) {
        res.status(400).json({
          success: false,
          message: 'stage is required',
        });
        return;
      }

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
      }

      const project = await projectService.updateProjectStage(id, data, data.userId);

      res.status(200).json({
        success: true,
        message: 'Project stage updated successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update project stage',
      });
    }
  }

  // ==================== PROJECT STAGE OPERATIONS ====================

  /**
   * Start project planning
   * POST /api/projects/:id/stage/start-planning
   * Transition: APPROVED → PLANNING
   */
  async startPlanning(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: StartPlanningRequest = req.body;

      if (!data.changeReason) {
        res.status(400).json({
          success: false,
          message: 'changeReason is required',
        });
        return;
      }

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }

      const project = await projectStatusService.startPlanning(id, data);

      res.status(200).json({
        success: true,
        message: 'Project moved to planning stage',
        data: project,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('must be in APPROVED')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to start project planning',
      });
    }
  }

  /**
   * Put project on hold
   * POST /api/projects/:id/stage/hold or /api/projects/:id/status/hold
   * Transition: ONSITE → ON_HOLD
   * Supports multipart/form-data with document uploads
   */
  async holdProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: HoldProjectRequest = req.body;

      if (!data.changeReason || !data.attributableTo) {
        res.status(400).json({
          success: false,
          message: 'changeReason and attributableTo are required',
        });
        return;
      }

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }

      // Handle file uploads if present (from multer)
      const documentIds: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          // Upload file to storage
          const uploadResult = await uploadProjectDocument(file.buffer, file.originalname, id);

          // Create project document record
          const document = await prisma.projectDocument.create({
            data: {
              projectId: id,
              fileName: file.originalname,
              documentUrl: uploadResult.url,
              documentType: 'status_change',
              uploadedByProfileId: data.userId,
            },
          });
          documentIds.push(document.id);
        }
      }

      // Add document IDs to the request data
      data.documentIds = documentIds;

      const project = await projectStatusService.holdProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project put on hold successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to put project on hold',
      });
    }
  }

  /**
   * Terminate project
   * POST /api/projects/:id/stage/terminate or /api/projects/:id/status/terminate
   * Transition: ONSITE → TERMINATED
   * Supports multipart/form-data with document uploads
   */
  async terminateProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: TerminateProjectRequest = req.body;

      if (!data.changeReason) {
        res.status(400).json({
          success: false,
          message: 'changeReason is required',
        });
        return;
      }

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }

      // Handle file uploads if present (from multer)
      const documentIds: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          // Upload file to storage
          const uploadResult = await uploadProjectDocument(file.buffer, file.originalname, id);

          // Create project document record
          const document = await prisma.projectDocument.create({
            data: {
              projectId: id,
              fileName: file.originalname,
              documentUrl: uploadResult.url,
              documentType: 'termination',
              uploadedByProfileId: data.userId,
            },
          });
          documentIds.push(document.id);
        }
      }

      // Add document IDs to the request data
      data.documentIds = documentIds;

      const project = await projectStatusService.terminateProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project terminated successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to terminate project',
      });
    }
  }

  /**
   * Short-close project
   * POST /api/projects/:id/stage/short-close or /api/projects/:id/status/short-close
   * Transition: ONSITE → SHORT_CLOSED
   * Supports multipart/form-data with document uploads
   */
  async shortCloseProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ShortCloseProjectRequest = req.body;

      if (!data.changeReason || !data.actualEndDate) {
        res.status(400).json({
          success: false,
          message: 'changeReason and actualEndDate are required',
        });
        return;
      }

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }

      // Handle file uploads if present (from multer)
      const documentIds: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          // Upload file to storage
          const uploadResult = await uploadProjectDocument(file.buffer, file.originalname, id);

          // Create project document record
          const document = await prisma.projectDocument.create({
            data: {
              projectId: id,
              fileName: file.originalname,
              documentUrl: uploadResult.url,
              documentType: 'short_close',
              uploadedByProfileId: data.userId,
            },
          });
          documentIds.push(document.id);
        }
      }

      // Add document IDs to the request data
      data.documentIds = documentIds;

      const project = await projectStatusService.shortCloseProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project short-closed successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to short-close project',
      });
    }
  }

  /**
   * Complete project
   * POST /api/projects/:id/stage/complete
   * Transition: ONSITE → COMPLETED
   */
  async completeProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: CompleteProjectRequest = req.body;

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }

      const project = await projectStatusService.completeProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project completed successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to complete project',
      });
    }
  }

  /**
   * Cancel project
   * POST /api/projects/:id/stage/cancel
   * Transition: Any stage → CANCELLED
   */
  async cancelProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: CancelProjectRequest = req.body;

      if (!data.changeReason) {
        res.status(400).json({
          success: false,
          message: 'changeReason is required',
        });
        return;
      }

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized' });
          return;
        }
      }

      const project = await projectStatusService.cancelProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project cancelled successfully',
        data: project,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to cancel project',
      });
    }
  }

  /**
   * Resume project from on_hold
   * POST /api/projects/:id/stage/resume
   * Transition: ON_HOLD → ONSITE
   * Supports multipart/form-data with document uploads
   */
  async resumeProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ResumeProjectRequest = req.body;

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized - userId is required' });
          return;
        }
      }

      // Handle file uploads if present (from multer)
      const documentIds: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          // Upload file to storage
          const uploadResult = await uploadProjectDocument(file.buffer, file.originalname, id);

          // Create project document record
          const document = await prisma.projectDocument.create({
            data: {
              projectId: id,
              fileName: file.originalname,
              documentUrl: uploadResult.url,
              documentType: 'resume',
              uploadedByProfileId: data.userId,
            },
          });
          documentIds.push(document.id);
        }
      }

      // Add document IDs to data if any were uploaded
      if (documentIds.length > 0) {
        data.documentIds = documentIds;
      }

      const project = await projectStatusService.resumeProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project resumed successfully',
        data: project,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('must be in ON_HOLD')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to resume project',
      });
    }
  }

  /**
   * Share project worker details with employer
   * POST /api/projects/:id/stage/share or /api/projects/:id/status/share
   * Transition: PLANNING → SHARED, Workers MATCHED → ASSIGNED
   * Supports multipart/form-data with document uploads
   */
  async shareProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ShareProjectRequest = req.body;

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized - userId is required' });
          return;
        }
      }

      // Handle file uploads if present (from multer)
      const documentIds: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          // Upload file to storage
          const uploadResult = await uploadProjectDocument(file.buffer, file.originalname, id);

          // Create project document record
          const document = await prisma.projectDocument.create({
            data: {
              projectId: id,
              fileName: file.originalname,
              documentUrl: uploadResult.url,
              documentType: 'share',
              uploadedByProfileId: data.userId,
            },
          });
          documentIds.push(document.id);
        }
      }

      // Add document IDs to data if any were uploaded
      if (documentIds.length > 0) {
        data.documentIds = documentIds;
      }

      const project = await projectStatusService.shareProjectToEmployer(id, data);

      res.status(200).json({
        success: true,
        message: 'Project shared with employer successfully',
        data: project,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('must be in PLANNING')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to share project',
      });
    }
  }

  /**
   * Start a project
   * POST /api/projects/:id/stage/start
   * Transition: SHARED → ONSITE, Workers ASSIGNED → ON_SITE
   * Supports multipart/form-data with document uploads
   */
  async startProject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: StartProjectRequest = req.body;

      // Ensure userId is set
      if (!data.userId) {
        data.userId = req.user?.id || '';
        if (!data.userId) {
          res.status(401).json({ success: false, message: 'Unauthorized - userId is required' });
          return;
        }
      }

      // Handle file uploads if present (from multer)
      const documentIds: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        for (const file of req.files as Express.Multer.File[]) {
          // Upload file to storage
          const uploadResult = await uploadProjectDocument(file.buffer, file.originalname, id);

          // Create project document record
          const document = await prisma.projectDocument.create({
            data: {
              projectId: id,
              fileName: file.originalname,
              documentUrl: uploadResult.url,
              documentType: 'start',
              uploadedByProfileId: data.userId,
            },
          });
          documentIds.push(document.id);
        }
      }

      // Add document IDs to data if any were uploaded
      if (documentIds.length > 0) {
        data.documentIds = documentIds;
      }

      // Set actualStartDate to current date if not provided
      if (!data.actualStartDate) {
        data.actualStartDate = new Date().toISOString();
      }

      const project = await projectStatusService.startProject(id, data);

      res.status(200).json({
        success: true,
        message: 'Project started successfully',
        data: project,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('must be in SHARED')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to start project',
      });
    }
  }

  // ==================== WORKER ASSIGNMENT OPERATIONS ====================

  /**
   * Assign worker to project
   * POST /api/projects/:id/workers
   */
  async assignWorker(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: AssignWorkerToProjectRequest = req.body;

      if (!data.profileId) {
        res.status(400).json({
          success: false,
          message: 'profileId is required',
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const assignment = await projectService.assignWorkerToProject(id, data, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Worker assigned to project successfully',
        data: assignment,
      });
    } catch (error: any) {
      const statusCode = error.message.includes('not found')
        ? 404
        : error.message.includes('Only benched') ||
            error.message.includes('overlapping') ||
            error.message.includes('already assigned')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to assign worker to project',
      });
    }
  }

  /**
   * Remove worker from project
   * DELETE /api/projects/:id/workers/:assignmentId
   */
  async removeWorker(req: Request, res: Response): Promise<void> {
    try {
      const { id, assignmentId } = req.params;
      const data: RemoveWorkerFromProjectRequest = req.body;

      if (!data.reason) {
        res.status(400).json({
          success: false,
          message: 'reason is required',
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await projectService.removeWorkerFromProject(id, assignmentId, data, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Worker removed from project successfully',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('already removed')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to remove worker from project',
      });
    }
  }

  // ==================== WORKER AVAILABILITY OPERATIONS ====================

  /**
   * Get available workers for a project
   * GET /api/projects/:id/available-workers
   *
   * Query params:
   * - search: Search by name, worker code, candidate code, phone
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20)
   * - requireBlueWorker: Filter by blue worker type (default: true)
   */
  async getAvailableWorkers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const options = {
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        requireBlueWorker: req.query.requireBlueWorker !== 'false',
      };

      const result = await projectService.getAvailableWorkersForProject(id, options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('must have')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to get available workers',
      });
    }
  }

  /**
   * Get unavailable workers for a date range with blocking reasons
   * GET /api/projects/workers/unavailable
   *
   * Query params:
   * - startDate: Start date (required, ISO format)
   * - endDate: End date (required, ISO format)
   * - search: Search by name, worker code, candidate code, phone
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20)
   * - requireBlueWorker: Filter by blue worker type (default: true)
   */
  async getUnavailableWorkers(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO format (e.g., 2024-01-15)',
        });
        return;
      }

      const options = {
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        requireBlueWorker: req.query.requireBlueWorker !== 'false',
      };

      const result = await projectService.getUnavailableWorkers(
        parsedStartDate,
        parsedEndDate,
        options
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: message || 'Failed to get unavailable workers',
      });
    }
  }

  /**
   * Check availability for a specific worker
   * GET /api/projects/workers/:profileId/availability
   *
   * Query params:
   * - startDate: Start date (required, ISO format)
   * - endDate: End date (required, ISO format)
   * - excludeProjectId: Optional project ID to exclude from collision check
   */
  async checkWorkerAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const { startDate, endDate, excludeProjectId } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'startDate and endDate are required',
        });
        return;
      }

      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO format (e.g., 2024-01-15)',
        });
        return;
      }

      const result = await projectService.checkWorkerAvailabilityForDates(
        profileId,
        parsedStartDate,
        parsedEndDate,
        excludeProjectId as string | undefined
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: message || 'Failed to check worker availability',
      });
    }
  }

  /**
   * Get eligible workers for a specific project
   * GET /api/projects/:id/eligible-workers
   *
   * These are workers who:
   * - Have blue collar skills
   * - Are in TRAINED or BENCHED stage
   * - Are available during the project's timeline (no conflicts)
   *
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50)
   * - search: Search by name, code, phone
   * - skillCategoryId: Filter by specific skill category
   */
  async getEligibleWorkersForProject(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId } = req.params;

      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        search: req.query.search as string,
        skillCategoryId: req.query.skillCategoryId as string,
        requireBlueWorker: true,
      };

      const result = await projectService.getAvailableWorkersForProject(projectId, options);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('must have')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to get eligible workers',
      });
    }
  }

  // ==================== MATCHED PROFILES ====================

  /**
   * Get matched profiles for a project
   * GET /api/projects/:id/matched-profiles
   */
  async getMatchedProfiles(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId } = req.params;

      const matchedProfiles = await projectWorkerService.getMatchedProfiles(projectId);

      res.status(200).json({
        success: true,
        data: matchedProfiles,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to get matched profiles',
      });
    }
  }

  /**
   * Save matched profiles for a project (bulk assign workers)
   * POST /api/projects/:id/matched-profiles
   *
   * Body: { matchedProfiles: [{ profileId: string, skillCategoryId?: string }] }
   */
  async saveMatchedProfiles(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId } = req.params;
      const { matchedProfiles } = req.body;

      if (!matchedProfiles || !Array.isArray(matchedProfiles) || matchedProfiles.length === 0) {
        res.status(400).json({
          success: false,
          message: 'matchedProfiles array is required and must not be empty',
        });
        return;
      }

      const assignedByProfileId = req.user?.id || req.body.assigned_by_user_id || 'system';

      const result = await projectWorkerService.saveMatchedProfiles(
        projectId,
        matchedProfiles,
        assignedByProfileId
      );

      res.status(201).json({
        success: true,
        message: `Successfully matched ${result.success} workers. ${result.failed} failed.`,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = message.includes('not found')
        ? 404
        : message.includes('already assigned') || message.includes('Only benched')
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: message || 'Failed to save matched profiles',
      });
    }
  }
}

export default new ProjectController();
