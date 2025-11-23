import profileBlacklistService from '@/services/profiles/profileBlacklist/profileBlacklist.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Add profile to blacklist
export const blacklistProfile = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const { reason, user_id } = req.body;

  const blacklistEntry = await profileBlacklistService.blacklistProfile({
    profile_id: profileId,
    reason,
    blacklisted_by_user_id: user_id,
  });

  res.status(201).json({
    success: true,
    message: 'Profile blacklisted successfully',
    data: blacklistEntry,
  });
});

// Remove profile from blacklist
export const removeFromBlacklist = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const { user_id } = req.body;

  const result = await profileBlacklistService.removeFromBlacklist(profileId, user_id);

  if (!result) {
    res.status(404).json({
      success: false,
      message: 'No active blacklist entry found for this profile',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Profile removed from blacklist successfully',
    data: result,
  });
});

// Get blacklist history for a profile
export const getProfileBlacklistHistory = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;

  const history = await profileBlacklistService.getProfileBlacklistHistory(profileId);

  res.status(200).json({
    success: true,
    data: history,
  });
});

// Check if profile is blacklisted
export const checkIfBlacklisted = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;

  const isBlacklisted = await profileBlacklistService.isProfileBlacklisted(profileId);

  res.status(200).json({
    success: true,
    isBlacklisted,
    message: isBlacklisted ? 'Profile is blacklisted' : 'Profile is not blacklisted',
  });
});

// Get all blacklisted profiles
export const getAllBlacklistedProfiles = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    search: req.query.search as string | undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  };

  const result = await profileBlacklistService.getAllBlacklistedProfiles(filters);

  res.status(200).json({
    success: true,
    data: result.data,
    total: result.total,
    limit: filters.limit,
    offset: filters.offset,
  });
});

// Get specific blacklist entry by ID
export const getBlacklistEntryById = catchAsync(async (req: Request, res: Response) => {
  const blacklistId = req.params.blacklistId;

  const entry = await profileBlacklistService.getBlacklistEntryById(blacklistId);

  if (!entry) {
    res.status(404).json({
      success: false,
      message: 'Blacklist entry not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: entry,
  });
});

// Update blacklist entry
export const updateBlacklistEntry = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.blacklistId;

  const updated = await profileBlacklistService.updateBlacklistEntry(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Blacklist entry updated successfully',
    data: updated,
  });
});
