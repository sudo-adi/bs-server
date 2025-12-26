/**
 * Employer Portal Controller
 * Handles HTTP requests for employer-facing APIs
 */

import { CreateProjectRequestDto, ProjectQueryParams, ProjectRequestQueryParams } from '@/dtos/employerPortal';
import {
  createMyProjectRequest,
  getEmployerInfo,
  getMyProjectById,
  getMyProjectRequestById,
  getMyProjectRequests,
  getMyProjects,
} from '@/services/employerPortal';
import { Request, Response } from 'express';

class EmployerPortalController {
  // ============================================================================
  // Employer Info
  // ============================================================================

  /**
   * GET /api/employer-portal/me
   * Get current employer's info
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.userType !== 'employer') {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const employerId = req.user.id;
      const data = await getEmployerInfo(employerId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch employer info',
      });
    }
  }

  // ============================================================================
  // Project Requests
  // ============================================================================

  /**
   * GET /api/employer-portal/project-requests
   * Get current employer's project requests
   */
  async getProjectRequests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.userType !== 'employer') {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const employerId = req.user.id;
      const params: ProjectRequestQueryParams = {
        status: req.query.status as any,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const data = await getMyProjectRequests(employerId, params);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch project requests',
      });
    }
  }

  /**
   * GET /api/employer-portal/project-requests/:id
   * Get a specific project request
   */
  async getProjectRequestById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.userType !== 'employer') {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const employerId = req.user.id;
      const requestId = req.params.id;

      const data = await getMyProjectRequestById(employerId, requestId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      const status = error.message === 'Project request not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch project request',
      });
    }
  }

  /**
   * POST /api/employer-portal/project-requests
   * Create a new project request
   */
  async createProjectRequest(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.userType !== 'employer') {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const employerId = req.user.id;
      const requestData: CreateProjectRequestDto = req.body;

      // Validate required fields
      if (!requestData.projectTitle) {
        res.status(400).json({
          success: false,
          message: 'Project title is required',
        });
        return;
      }

      const data = await createMyProjectRequest(employerId, requestData);

      res.status(201).json({
        success: true,
        message: 'Project request submitted successfully',
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create project request',
      });
    }
  }

  // ============================================================================
  // Projects
  // ============================================================================

  /**
   * GET /api/employer-portal/projects
   * Get current employer's projects (approved projects)
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.userType !== 'employer') {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const employerId = req.user.id;
      const params: ProjectQueryParams = {
        stage: req.query.stage as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const data = await getMyProjects(employerId, params);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch projects',
      });
    }
  }

  /**
   * GET /api/employer-portal/projects/:id
   * Get a specific project's details
   * Returns full details only if project is shared, otherwise just stage info
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.userType !== 'employer') {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const employerId = req.user.id;
      const projectId = req.params.id;

      const data = await getMyProjectById(employerId, projectId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      const status = error.message === 'Project not found' ? 404 : 400;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch project',
      });
    }
  }
}

export default new EmployerPortalController();
