import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import candidatePortalService from '../../services/candidate/candidatePortal.service';

/**
 * Get candidate's matched projects
 * GET /api/candidate/portal/matched-projects
 */
export const getMatchedProjects = catchAsync(async (req: Request, res: Response) => {
  const profileId = (req as any).profileId;

  const projects = await candidatePortalService.getMatchedProjects(profileId);

  res.status(200).json({
    success: true,
    data: projects,
    total: projects.length,
  });
});

/**
 * Get candidate's training enrollments
 * GET /api/candidate/portal/training
 */
export const getTrainingEnrollments = catchAsync(async (req: Request, res: Response) => {
  const profileId = (req as any).profileId;

  const trainings = await candidatePortalService.getTrainingEnrollments(profileId);

  res.status(200).json({
    success: true,
    data: trainings,
  });
});

/**
 * Get candidate's employment history
 * GET /api/candidate/portal/employment
 */
export const getEmploymentHistory = catchAsync(async (req: Request, res: Response) => {
  const profileId = (req as any).profileId;

  const employment = await candidatePortalService.getEmploymentHistory(profileId);

  res.status(200).json({
    success: true,
    data: employment,
  });
});

/**
 * Get candidate's full profile
 * GET /api/candidate/portal/profile
 */
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const profileId = (req as any).profileId;

  const profile = await candidatePortalService.getProfile(profileId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

/**
 * Get candidate's dashboard summary
 * GET /api/candidate/portal/dashboard
 */
export const getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const profileId = (req as any).profileId;

  const summary = await candidatePortalService.getDashboardSummary(profileId);

  res.status(200).json({
    success: true,
    data: summary,
  });
});
