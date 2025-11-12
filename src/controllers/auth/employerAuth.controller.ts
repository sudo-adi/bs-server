/* eslint-disable @typescript-eslint/no-unused-vars */
import employerService from '@/services/employers/employer.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Register new employer with auto-created inactive project
export const register = catchAsync(async (req: Request, res: Response) => {
  const { employer, token, project } = await employerService.registerEmployer(req.body);

  // Remove password from response
  const { password_hash, ...employerData } = employer;

  res.status(201).json({
    success: true,
    message:
      'Employer registered successfully. Your project has been created and is pending approval.',
    data: {
      employer: employerData,
      project,
      token,
    },
  });
});

// Employer login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { employer, token } = await employerService.loginEmployer(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      employer,
      token,
    },
  });
});

// Get current employer profile
export const getCurrentEmployer = catchAsync(async (req: Request, res: Response) => {
  // Assuming auth middleware attaches employerId to req
  const employerId = (req as any).employerId;

  const employer = await employerService.getEmployerById(employerId);

  // Remove password from response
  const { password_hash, ...employerData } = employer;

  res.status(200).json({
    success: true,
    data: employerData,
  });
});
