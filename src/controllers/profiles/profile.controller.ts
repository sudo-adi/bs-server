import logger from '@/config/logger';
import {
  notifyCandidateApproved,
  notifyCandidateRejected,
  notifyCandidateStatusChanged,
} from '@/services/notifications';
import profileService from '@/services/profiles/profile/profile.service';
import { SupabaseStorageProvider } from '@/services/storage/providers/supabase.provider';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const createProfile = catchAsync(async (req: Request, res: Response) => {
  logger.info('📥 [BACKEND] Received profile creation request');
  logger.info('📋 [BACKEND] Request body:', req.body);
  logger.info('🔍 [BACKEND] Headers:', {
    'content-type': req.headers['content-type'],
    origin: req.headers['origin'],
  });

  let profilePhotoUrl: string | undefined;

  // Handle profile picture upload if file is provided
  if (req.file) {
    logger.info('📸 [BACKEND] Profile picture file detected, uploading to Supabase...');
    const storageProvider = new SupabaseStorageProvider('profile-pic');
    const timestamp = Date.now();
    const fileName = `${timestamp}_${req.file.originalname}`;
    const filePath = `profiles/${fileName}`;

    profilePhotoUrl = await storageProvider.upload(req.file.buffer, filePath, req.file.mimetype);
    logger.info('✅ [BACKEND] Profile picture uploaded:', profilePhotoUrl);
  }

  // Add profile photo URL to request body
  const profileData = {
    ...req.body,
    profile_photo_url: profilePhotoUrl || req.body.profile_photo_url,
  };

  logger.info('⚙️  [BACKEND] Calling profileService.createProfile...');
  const profile = await profileService.createProfile(profileData);
  logger.info('✅ [BACKEND] Profile created successfully:', profile);

  res.status(201).json({
    success: true,
    message: 'Profile created successfully',
    data: profile,
  });
  logger.info('📤 [BACKEND] Response sent to client');
});

export const getProfile = catchAsync(async (req: Request, res: Response) => {
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
});

export const getAllProfiles = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    stage: req.query.stage as string | undefined,
    skill_category_id: req.query.skill_category_id as string | undefined,
    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
    isBlacklisted: req.query.isBlacklisted ? req.query.isBlacklisted === 'true' : undefined,
    search: req.query.search as string | undefined,
    training_batch_id: req.query.training_batch_id as string | undefined,
    has_batch_enrollment: req.query.has_batch_enrollment
      ? req.query.has_batch_enrollment === 'true'
      : undefined,
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
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  let profilePhotoUrl: string | undefined;

  // Handle profile picture upload if file is provided
  if (req.file) {
    logger.info('📸 [BACKEND] Profile picture file detected, uploading to Supabase...');
    const storageProvider = new SupabaseStorageProvider('profile-pic');
    const timestamp = Date.now();
    const fileName = `${timestamp}_${req.file.originalname}`;
    const filePath = `profiles/${fileName}`;

    profilePhotoUrl = await storageProvider.upload(req.file.buffer, filePath, req.file.mimetype);
    logger.info('✅ [BACKEND] Profile picture uploaded:', profilePhotoUrl);
  }

  // Add profile photo URL to request body if uploaded
  const updateData = {
    ...req.body,
    ...(profilePhotoUrl && { profile_photo_url: profilePhotoUrl }),
  };

  const profile = await profileService.updateProfile(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: profile,
  });
});

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

export const deleteProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await profileService.deleteProfile(id);

  res.status(200).json({
    success: true,
    message: 'Profile deleted successfully',
  });
});

// === Stage Management ===
export const changeStage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { newStage, notes } = req.body;

  // Get profile before stage change to get old stage
  const oldProfile = await profileService.getProfileById(id, false);

  const profile = await profileService.changeStage(id, req.body);

  // Send notifications based on stage change
  try {
    const candidateName = `${profile.first_name} ${profile.last_name}`;
    const candidateCode = profile.candidate_code || 'N/A';

    // Determine old stage from latest transition
    const oldStage = oldProfile?.current_stage || 'unknown';

    // Send specific notification for approval
    if (newStage === 'approved' || newStage === 'verified') {
      await notifyCandidateApproved({
        userId: undefined, // Profile doesn't have user_id yet
        email: profile.email || undefined,
        candidateName,
        candidateCode,
      });
    }
    // Send specific notification for rejection
    else if (newStage === 'rejected' || newStage === 'blacklisted') {
      await notifyCandidateRejected({
        userId: undefined, // Profile doesn't have user_id yet
        email: profile.email || undefined,
        candidateName,
        candidateCode,
        reason: notes,
      });
    }
    // Send general status change notification
    else {
      await notifyCandidateStatusChanged({
        userId: undefined, // Profile doesn't have user_id yet
        email: profile.email || undefined,
        candidateName,
        candidateCode,
        oldStatus: oldStage,
        newStatus: newStage,
        notes,
      });
    }
  } catch (error) {
    // Don't throw - notification failure shouldn't break stage change
  }

  res.status(200).json({
    success: true,
    message: 'Stage changed successfully',
    data: profile,
  });
});
