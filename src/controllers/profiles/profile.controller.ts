import logger from '@/config/logger';
import profileService from '@/services/profiles/profile.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const createProfile = catchAsync(async (req: Request, res: Response) => {
  logger.info('📥 [BACKEND] Received profile creation request');
  logger.info('📋 [BACKEND] Request body:', req.body);
  logger.info('🔍 [BACKEND] Headers:', {
    'content-type': req.headers['content-type'],
    origin: req.headers['origin'],
  });

  logger.info('⚙️  [BACKEND] Calling profileService.createProfile...');
  const profile = await profileService.createProfile(req.body);
  logger.info('✅ [BACKEND] Profile created successfully:', profile);

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: profile,
  });
  logger.info('📤 [BACKEND] Response sent to client');
});

export const getProfile = async (req: Request, res: Response) => {
  const id = req.params.id;
  const includeDetails = req.query.details === 'true';
  const profile = await profileService.getProfileById(id, includeDetails);

  if (!profile) {
    res.status(404).json({
      success: false,
      message: 'Profile not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: profile,
  });
};

export const getAllProfiles = async (req: Request, res: Response) => {
  const filters = {
    stage: req.query.stage as string | undefined,
    skill_category_id: req.query.skill_category_id as string | undefined,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    isBlacklisted: req.query.isBlacklisted ? req.query.isBlacklisted === 'true' : undefined,
    search: req.query.search as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const result = await profileService.getAllProfiles(filters);

  res.status(200).json({
    success: true,
    data: result.profiles,
    total: result.total,
    limit: filters.limit,
    offset: filters.offset,
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const id = req.params.id;
  const profile = await profileService.updateProfile(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
};

export const checkMobileNumber = catchAsync(async (req: Request, res: Response) => {
  const mobileNumber = req.query.mobile as string;
  const excludeProfileId = req.query.excludeProfileId
    ? (req.query.excludeProfileId as string)
    : undefined;

  if (!mobileNumber) {
    res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
    return;
  }

  const exists = await profileService.checkMobileNumberExists(mobileNumber, excludeProfileId);

  res.status(200).json({
    success: true,
    exists,
    message: exists ? 'Mobile number already registered' : 'Mobile number is available',
  });
});

export const deleteProfile = async (req: Request, res: Response) => {
  const id = req.params.id;
  await profileService.deleteProfile(id);

  res.status(200).json({
    success: true,
    message: 'Profile deleted successfully',
  });
};

// === Stage Management ===
export const changeStage = async (req: Request, res: Response) => {
  const id = req.params.id;
  const profile = await profileService.changeStage(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Stage changed successfully',
    data: profile,
  });
};
