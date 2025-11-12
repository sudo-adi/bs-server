/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import employerService from '@/services/employers/employer.service';
import catchAsync from '@/utils/catchAsync';

// Admin: Create employer
export const createEmployer = catchAsync(async (req: Request, res: Response) => {
  const employer = await employerService.createEmployer(req.body);

  const { password_hash, ...employerData } = employer;

  res.status(201).json({
    success: true,
    message: 'Employer created successfully',
    data: employerData,
  });
});

// Get all employers with filters
export const getAllEmployers = catchAsync(async (req: Request, res: Response) => {
  const { is_active, is_verified, search, limit, offset } = req.query;

  const filters = {
    is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    is_verified: is_verified === 'true' ? true : is_verified === 'false' ? false : undefined,
    search: search as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const result = await employerService.getAllEmployers(filters);

  // Remove passwords from all employers
  const employersWithoutPasswords = result.employers.map(({ password_hash, ...emp }) => emp);

  res.status(200).json({
    success: true,
    data: employersWithoutPasswords,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get employer by ID
export const getEmployerById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const employer = await employerService.getEmployerById(id);

  const { password_hash, ...employerData } = employer;

  res.status(200).json({
    success: true,
    data: employerData,
  });
});

// Update employer
export const updateEmployer = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const employer = await employerService.updateEmployer(id, req.body);

  const { password_hash, ...employerData } = employer;

  res.status(200).json({
    success: true,
    message: 'Employer updated successfully',
    data: employerData,
  });
});

// Verify employer
export const verifyEmployer = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const employer = await employerService.verifyEmployer(id, req.body);

  const { password_hash, ...employerData } = employer;

  res.status(200).json({
    success: true,
    message: 'Employer verified successfully',
    data: employerData,
  });
});

// Delete employer
export const deleteEmployer = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const deletedByUserId = (req as any).userId; // Get from auth middleware if available
  await employerService.deleteEmployer(id, deletedByUserId);

  res.status(200).json({
    success: true,
    message: 'Employer deleted successfully',
  });
});
