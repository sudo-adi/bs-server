import batchEnrollmentService from '@/services/training/batchEnrollment/batchEnrollment.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Create single enrollment
export const createEnrollment = catchAsync(async (req: Request, res: Response) => {
  const enrollment = await batchEnrollmentService.createEnrollment(req.body);

  res.status(201).json({
    success: true,
    message: 'Profile enrolled successfully. Stage changed to trainee.',
    data: enrollment,
  });
});

// Bulk enroll multiple profiles (CRITICAL for workflow)
export const bulkEnrollProfiles = catchAsync(async (req: Request, res: Response) => {
  const { batch_id, profile_ids, enrolled_by_user_id, notes } = req.body;

  if (!batch_id || !profile_ids || !Array.isArray(profile_ids) || profile_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'batch_id and profile_ids array are required',
    });
  }

  // Create enrollments for all profiles
  const enrollments = [];
  const errors = [];

  for (const profile_id of profile_ids) {
    try {
      const enrollment = await batchEnrollmentService.createEnrollment({
        batch_id,
        profile_id,
        enrolled_by_user_id,
        notes,
      });
      enrollments.push(enrollment);
    } catch (error: unknown) {
      errors.push({
        profile_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${enrollments.length} profiles enrolled successfully. ${errors.length} failed.`,
    data: {
      enrolled: enrollments,
      failed: errors,
      summary: {
        total: profile_ids.length,
        success: enrollments.length,
        failed: errors.length,
      },
    },
  });
});

// Get all enrollments with filters
export const getAllEnrollments = catchAsync(async (req: Request, res: Response) => {
  const { batch_id, profile_id, status, limit, offset, include_details } = req.query;

  const filters = {
    batch_id: batch_id as string | undefined,
    profile_id: profile_id as string | undefined,
    status: status as string,
    limit: limit ? parseInt(limit as string) : undefined,
    offset: offset ? parseInt(offset as string) : undefined,
  };

  const includeDetails = include_details === 'true';
  const result = await batchEnrollmentService.getAllEnrollments(filters, includeDetails);

  res.status(200).json({
    success: true,
    data: result.enrollments,
    pagination: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
});

// Get enrollment by ID
export const getEnrollmentById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeDetails = req.query.include_details === 'true';

  const enrollment = await batchEnrollmentService.getEnrollmentById(id, includeDetails);

  res.status(200).json({
    success: true,
    data: enrollment,
  });
});

// Update enrollment (status, scores, certificate)
export const updateEnrollment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const enrollment = await batchEnrollmentService.updateEnrollment(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Enrollment updated successfully',
    data: enrollment,
  });
});

// Delete enrollment
export const deleteEnrollment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await batchEnrollmentService.deleteEnrollment(id);

  res.status(200).json({
    success: true,
    message: 'Enrollment deleted successfully',
  });
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// Bulk mark enrollments as completed
export const bulkMarkCompleted = catchAsync(async (req: Request, res: Response) => {
  const { enrollment_ids } = req.body;

  if (!enrollment_ids || !Array.isArray(enrollment_ids) || enrollment_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'enrollment_ids array is required',
    });
  }

  const result = await batchEnrollmentService.bulkMarkCompleted(enrollment_ids);

  res.status(200).json({
    success: true,
    message: `Successfully marked ${result.success} enrollments as completed`,
    data: result,
  });
});

// Bulk mark enrollments as dropped
export const bulkMarkDropped = catchAsync(async (req: Request, res: Response) => {
  const { enrollment_ids } = req.body;

  if (!enrollment_ids || !Array.isArray(enrollment_ids) || enrollment_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'enrollment_ids array is required',
    });
  }

  const result = await batchEnrollmentService.bulkMarkDropped(enrollment_ids);

  res.status(200).json({
    success: true,
    message: `Successfully marked ${result.success} enrollments as dropped`,
    data: result,
  });
});
