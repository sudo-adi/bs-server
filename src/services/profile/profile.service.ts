import {
  ApproveCandidateDto,
  ConvertToWorkerDto,
  CreateProfileDto,
  DeactivateProfileDto,
  ProfileDto,
  ProfileListDto,
  ProfileListQueryDto,
  ReactivateProfileDto,
  UpdateProfileDto,
} from '@/dtos/profile/profile.dto';

// Operations
import { BulkOperations } from './operations/bulk-operations.operation';
import { ProfileCreateOperation } from './operations/profile-create.operation';
import { ProfileDeleteOperation } from './operations/profile-delete.operation';
import { ProfileUpdateOperation } from './operations/profile-update.operation';
import { StageApproveOperation } from './operations/stage-approve.operation';
import { StageConvertWorkerOperation } from './operations/stage-convert-worker.operation';
import { StageDeactivateOperation } from './operations/stage-deactivate.operation';
import { StageReactivateOperation } from './operations/stage-reactivate.operation';
import { StageRejectOperation } from './operations/stage-reject.operation';

// Queries
import { ProfileDetailQuery } from './queries/profile-detail.query';
import { ProfileListQuery } from './queries/profile-list.query';
import { ProfileValidationQuery } from './queries/profile-validation.query';

/**
 * Profile Service - Facade that delegates to specialized operations and queries
 */
export class ProfileService {
  // ==========================================================================
  // QUERIES
  // ==========================================================================

  async getAllProfiles(query: ProfileListQueryDto): Promise<{
    data: ProfileListDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return ProfileListQuery.execute(query);
  }

  async getProfileById(id: string): Promise<ProfileDto | null> {
    return ProfileDetailQuery.execute(id);
  }

  async checkMobileExists(
    mobile: string,
    excludeProfileId?: string
  ): Promise<{ exists: boolean; message: string }> {
    return ProfileValidationQuery.checkMobileExists(mobile, excludeProfileId);
  }

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  async createProfile(data: CreateProfileDto, createdByProfileId?: string): Promise<ProfileDto> {
    return ProfileCreateOperation.execute(data, createdByProfileId);
  }

  async updateProfile(
    id: string,
    data: UpdateProfileDto,
    updatedByProfileId?: string
  ): Promise<ProfileDto> {
    return ProfileUpdateOperation.execute(id, data, updatedByProfileId);
  }

  async deleteProfile(id: string, deletedByProfileId: string): Promise<void> {
    return ProfileDeleteOperation.execute(id, deletedByProfileId);
  }

  // ==========================================================================
  // STAGE OPERATIONS
  // ==========================================================================

  async approveCandidate(
    id: string,
    request: ApproveCandidateDto,
    approvedByProfileId: string
  ): Promise<ProfileDto> {
    return StageApproveOperation.execute(id, request, approvedByProfileId);
  }

  async rejectCandidate(
    id: string,
    reason: string | undefined,
    rejectedByProfileId: string
  ): Promise<ProfileDto> {
    return StageRejectOperation.execute(id, reason, rejectedByProfileId);
  }

  async convertToWorker(id: string, request: ConvertToWorkerDto): Promise<ProfileDto> {
    return StageConvertWorkerOperation.execute(id, request);
  }

  async deactivateProfile(
    id: string,
    request: DeactivateProfileDto,
    deactivatedByProfileId: string
  ): Promise<ProfileDto> {
    return StageDeactivateOperation.execute(id, request, deactivatedByProfileId);
  }

  async reactivateProfile(
    id: string,
    request: ReactivateProfileDto,
    reactivatedByProfileId: string
  ): Promise<ProfileDto> {
    return StageReactivateOperation.execute(id, request, reactivatedByProfileId);
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  async bulkApprove(
    profileIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number }> {
    return BulkOperations.bulkApprove(profileIds, userId);
  }

  async bulkSoftDelete(
    profileIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number }> {
    return BulkOperations.bulkSoftDelete(profileIds, userId);
  }

  async bulkHardDelete(
    profileIds: string[],
    userId: string,
    password?: string
  ): Promise<{ success: number; failed: number }> {
    return BulkOperations.bulkHardDelete(profileIds, userId, password);
  }
}

export default new ProfileService();
