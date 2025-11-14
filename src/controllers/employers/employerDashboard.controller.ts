import employerDashboardService from '@/services/employers/employerDashboard.service';
import { Request, Response } from 'express';

/**
 * Get employer dashboard overview
 */
export const getDashboardOverview = async (req: Request, res: Response) => {
  const employerId = req.params.employerId;

  const data = await employerDashboardService.getDashboardOverview(employerId);

  res.json({
    success: true,
    data,
  });
};

/**
 * Get detailed project information
 */
export const getProjectDetails = async (req: Request, res: Response) => {
  const { employerId, projectId } = req.params;

  const data = await employerDashboardService.getProjectDetails(employerId, projectId);

  res.json({
    success: true,
    data,
  });
};

/**
 * Get list of employer projects
 */
export const getEmployerProjects = async (req: Request, res: Response) => {
  const employerId = req.params.employerId;
  const { status, search, limit, offset } = req.query;

  const data = await employerDashboardService.getEmployerProjects(employerId, {
    status: status as string,
    search: search as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  });

  res.json({
    success: true,
    ...data,
  });
};
