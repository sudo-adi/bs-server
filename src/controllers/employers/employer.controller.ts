/* eslint-disable @typescript-eslint/no-unused-vars */
import { employerService } from '@/services/employers';
import { notifyEmployerRejected, notifyEmployerVerified } from '@/services/notifications';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employersWithoutPasswords = result.employers.map(({ password_hash, ...emp }: any) => emp);

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
  const { is_verified, notes } = req.body;

  const employer = await employerService.verifyEmployer(id, req.body);

  const { password_hash, ...employerData } = employer;

  // Send notification based on verification status
  try {
    if (is_verified === true) {
      await notifyEmployerVerified({
        userId: employer.id,
        email: employer.email,
        companyName: employer.company_name,
        companyCode: undefined,
      });
    } else if (is_verified === false) {
      await notifyEmployerRejected({
        userId: employer.id,
        email: employer.email,
        companyName: employer.company_name,
        reason: notes,
      });
    }
  } catch (error) {
    // Don't throw - notification failure shouldn't break verification
    console.error('Failed to send employer verification notification:', error);
  }

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

// === Bulk Operations ===
export const bulkVerify = catchAsync(async (req: Request, res: Response) => {
  const { employer_ids, user_id } = req.body;

  console.log('Bulk verify request:', { employer_ids, user_id });

  if (!employer_ids || !Array.isArray(employer_ids) || employer_ids.length === 0) {
    res.status(400).json({
      success: false,
      message: 'employer_ids array is required',
    });
    return;
  }

  if (!user_id) {
    res.status(400).json({
      success: false,
      message: 'user_id is required',
    });
    return;
  }

  if (typeof user_id !== 'string' || user_id.length < 36) {
    res.status(400).json({
      success: false,
      message: `Invalid user_id format: ${user_id}`,
    });
    return;
  }

  const result = await employerService.bulkVerify(employer_ids, user_id);

  res.status(200).json({
    success: true,
    message: `Successfully verified ${result.success} employers`,
    data: result,
  });
});

export const bulkSoftDelete = catchAsync(async (req: Request, res: Response) => {
  const { employer_ids, user_id } = req.body;

  if (!employer_ids || !Array.isArray(employer_ids) || employer_ids.length === 0) {
    res.status(400).json({
      success: false,
      message: 'employer_ids array is required',
    });
    return;
  }

  if (!user_id) {
    res.status(400).json({
      success: false,
      message: 'user_id is required',
    });
    return;
  }

  const result = await employerService.bulkSoftDelete(employer_ids);

  res.status(200).json({
    success: true,
    message: `Successfully deactivated ${result.success} employers`,
    data: result,
  });
});

export const bulkHardDelete = catchAsync(async (req: Request, res: Response) => {
  const { employer_ids, user_id } = req.body;

  if (!employer_ids || !Array.isArray(employer_ids) || employer_ids.length === 0) {
    res.status(400).json({
      success: false,
      message: 'employer_ids array is required',
    });
    return;
  }

  if (!user_id) {
    res.status(400).json({
      success: false,
      message: 'user_id is required',
    });
    return;
  }

  const result = await employerService.bulkHardDelete(employer_ids, user_id);

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${result.success} employers and their projects`,
    data: result,
  });
});
