import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  ApproveCandidateDto,
  ConvertToWorkerDto,
  DeactivateProfileDto,
  ProfileListQueryDto,
  ReactivateProfileDto,
  UpdateProfileDto,
} from '@/dtos/profile/profile.dto';
import { sanitizeFilename } from '@/middlewares/upload.middleware';
import { profileService } from '@/services/profile';
import { nextWorkerStageService } from '@/services/profile/nextWorkerStage.service';
import { deleteFile, uploadProfilePhoto } from '@/utils/fileStorage';
import { Request, Response } from 'express';

/**
 * Controller for handling profile HTTP requests
 */
export class ProfileController {
  /**
   * Get all profiles with filters
   * GET /api/profiles
   */
  async getAllProfiles(req: Request, res: Response): Promise<void> {
    try {
      const query: ProfileListQueryDto = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        workerType: req.query.workerType as string,
        profileType: req.query.profileType as string,
        isActive:
          req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isDeleted:
          req.query.isDeleted === 'true'
            ? true
            : req.query.isDeleted === 'false'
              ? false
              : undefined,
        currentStage: (req.query.currentStage || req.query.stage) as string,
        gender: req.query.gender as string,
        state: req.query.state as string,
        candidateCode: req.query.candidateCode as string,
        workerCode: req.query.workerCode as string,
        codePrefix: req.query.codePrefix as string,
      };

      const result = await profileService.getAllProfiles(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profiles',
      });
    }
  }

  /**
   * Get profile by ID
   * GET /api/profiles/:id
   */
  async getProfileById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const profile = await profileService.getProfileById(id);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
      });
    }
  }

  /**
   * Check if mobile number exists
   * GET /api/profiles/check-mobile?mobile=1234567890&excludeProfileId=xxx
   */
  async checkMobileExists(req: Request, res: Response): Promise<void> {
    try {
      const mobile = req.query.mobile as string;
      const excludeProfileId = req.query.excludeProfileId as string | undefined;

      if (!mobile) {
        res.status(400).json({
          success: false,
          exists: false,
          message: 'Mobile number is required',
        });
        return;
      }

      const result = await profileService.checkMobileExists(mobile, excludeProfileId);

      res.status(200).json({
        success: true,
        exists: result.exists,
        message: result.message,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        exists: false,
        message: error.message || 'Failed to check mobile number',
      });
    }
  }

  /**
   * Create new profile
   * POST /api/profiles
   * Returns error if phone already exists
   */
  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;

      if (!data.phone) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      const createdByProfileId = req.user?.id;

      const profile = await profileService.createProfile(data, createdByProfileId);

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data: profile,
      });
    } catch (error: any) {
      // Check if it's a duplicate phone error
      const isDuplicate = error.message?.includes('already exists');
      res.status(isDuplicate ? 409 : 500).json({
        success: false,
        message: error.message || 'Failed to create profile',
      });
    }
  }

  /**
   * Update profile
   * PATCH /api/profiles/:id
   * Supports multipart/form-data with optional profilePicture file
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedByProfileId = req.user?.id;

      // Parse JSON strings from FormData (nested objects are stringified)
      const nestedFields = [
        'identity',
        'addresses',
        'bankAccounts',
        'documents',
        'qualifications',
        'skills',
        'languages',
        'metadata',
      ];
      const data: UpdateProfileDto = { ...req.body };

      for (const field of nestedFields) {
        if (typeof data[field as keyof UpdateProfileDto] === 'string') {
          try {
            (data as any)[field] = JSON.parse(data[field as keyof UpdateProfileDto] as string);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
      }

      // Handle profile photo upload if file is provided
      if (req.file) {
        // Check if profile exists
        const existingProfile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!existingProfile) {
          res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
          return;
        }

        // Delete old photo if exists
        if (existingProfile.profilePhotoURL) {
          try {
            await deleteFile(existingProfile.profilePhotoURL);
          } catch (deleteError) {
            logger.warn('Failed to delete old profile photo', { deleteError });
          }
        }

        // Upload new photo
        const filename = sanitizeFilename(req.file.originalname);
        const result = await uploadProfilePhoto(req.file.buffer, filename, id);

        // Add the photo URL to the update data
        data.profilePhotoURL = result.url;

        logger.info('Profile photo uploaded during update', { profileId: id, url: result.url });
      }

      const profile = await profileService.updateProfile(id, data, updatedByProfileId);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error: any) {
      logger.error('Profile update error', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * Soft delete profile
   * DELETE /api/profiles/:id
   */
  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await profileService.deleteProfile(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete profile',
      });
    }
  }

  /**
   * Approve candidate
   * PATCH /api/profiles/:id/approve-candidate
   */
  async approveCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ApproveCandidateDto = req.body;
      const approvedByUserId = req.user?.id;

      if (!approvedByUserId) {
        res.status(401).json({
          success: false,
          message: 'userId is required',
        });
        return;
      }

      const profile = await profileService.approveCandidate(id, data, approvedByUserId);

      res.status(200).json({
        success: true,
        message: 'Candidate approved successfully',
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve candidate',
      });
    }
  }

  /**
   * Reject candidate
   * PATCH /api/profiles/:id/reject-candidate
   */
  async rejectCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, userId } = req.body;

      // Accept userId from body or from authenticated user
      const rejectedByUserId = userId || req.user?.id;

      if (!rejectedByUserId) {
        res.status(401).json({
          success: false,
          message: 'userId is required',
        });
        return;
      }

      const profile = await profileService.rejectCandidate(id, reason, rejectedByUserId);

      res.status(200).json({
        success: true,
        message: 'Candidate rejected successfully',
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject candidate',
      });
    }
  }

  /**
   * Convert candidate to worker
   * PATCH /api/profiles/:id/convert-to-worker
   */
  async convertToWorker(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ConvertToWorkerDto = req.body;

      const profile = await profileService.convertToWorker(id, data);

      res.status(200).json({
        success: true,
        message: 'Candidate converted to worker successfully',
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to convert to worker',
      });
    }
  }

  /**
   * Deactivate profile
   * PATCH /api/profiles/:id/deactivate
   */
  async deactivateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: DeactivateProfileDto = req.body;

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const profile = await profileService.deactivateProfile(id, data, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Profile deactivated successfully',
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to deactivate profile',
      });
    }
  }

  /**
   * Reactivate profile
   * PATCH /api/profiles/:id/reactivate
   */
  async reactivateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: ReactivateProfileDto = req.body;

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const profile = await profileService.reactivateProfile(id, data, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Profile reactivated successfully',
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reactivate profile',
      });
    }
  }

  /**
   * Bulk approve candidates
   * POST /api/profiles/bulk/approve
   */
  async bulkApprove(req: Request, res: Response): Promise<void> {
    try {
      const { profileIds, userId } = req.body;

      if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'profileIds array is required',
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId is required',
        });
        return;
      }

      const result = await profileService.bulkApprove(profileIds, userId);

      res.status(200).json({
        success: true,
        message: 'Bulk approve completed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk approve',
      });
    }
  }

  /**
   * Bulk soft delete (deactivate) profiles
   * POST /api/profiles/bulk/soft-delete
   */
  async bulkSoftDelete(req: Request, res: Response): Promise<void> {
    try {
      const { profileIds, userId } = req.body;

      if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'profileIds array is required',
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId is required',
        });
        return;
      }

      const result = await profileService.bulkSoftDelete(profileIds, userId);

      res.status(200).json({
        success: true,
        message: 'Bulk soft delete completed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk soft delete',
      });
    }
  }

  /**
   * Bulk hard delete profiles
   * POST /api/profiles/bulk/hard-delete
   */
  async bulkHardDelete(req: Request, res: Response): Promise<void> {
    try {
      const { profileIds, userId, password } = req.body;

      if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'profileIds array is required',
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'userId is required',
        });
        return;
      }

      const result = await profileService.bulkHardDelete(profileIds, userId, password);

      res.status(200).json({
        success: true,
        message: 'Bulk hard delete completed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk hard delete',
      });
    }
  }

  /**
   * Get the next stage for a worker after current project ends
   * GET /api/profiles/:id/next-stage
   *
   * Query params:
   * - excludeProjectId: UUID - Exclude this project from calculation
   * - referenceDate: ISO date string - Date to check from (default: today)
   */
  async getNextStage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const excludeProjectId = req.query.excludeProjectId as string | undefined;
      const referenceDateStr = req.query.referenceDate as string | undefined;

      const referenceDate = referenceDateStr ? new Date(referenceDateStr) : undefined;

      const result = await nextWorkerStageService.getNextStage(
        id,
        excludeProjectId,
        referenceDate
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error getting next stage', { error, profileId: req.params.id });
      res.status(error.message === 'Profile not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to get next stage',
      });
    }
  }

  /**
   * Get upcoming assignments for a worker
   * GET /api/profiles/:id/upcoming-assignments
   *
   * Query params:
   * - includeCompleted: boolean - Include past completed projects (default: false)
   */
  async getUpcomingAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeCompleted = req.query.includeCompleted === 'true';

      const result = await nextWorkerStageService.getUpcomingAssignments(id, includeCompleted);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error getting upcoming assignments', { error, profileId: req.params.id });
      res.status(error.message === 'Profile not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to get upcoming assignments',
      });
    }
  }
}

export default new ProfileController();
