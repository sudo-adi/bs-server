import type { profiles } from '@/generated/prisma';
import { ChangeStageDto, ProfileWithDetails } from '@/types/';
import { CreateProfileDto, UpdateProfileDto } from '@/types/domain/profile';
import { ProfileAuthDomain } from './domain/profile-auth.domain';
import { ProfileStageDomain } from './domain/profile-stage.domain';
import { ProfileCreateOperation } from './operations/profile-create.operation';
import { ProfileDeleteOperation } from './operations/profile-delete.operation';
import { ProfileUpdateOperation } from './operations/profile-update.operation';
import { ProfileBaseQuery } from './queries/profile-base.query';
import { ProfileFiltersQuery } from './queries/profile-filters.query';
import { ProfileSkillStageQuery } from './queries/profile-skill-stage.query';
import { ProfileSkillQuery } from './queries/profile-skill.query';
import { ProfileStageQuery } from './queries/profile-stage.query';
import { ProfileTrainingQuery } from './queries/profile-training.query';

/**
 * Profile Service - Main orchestrator/facade
 * Delegates to specialized services for different concerns
 */
export class ProfileService {
  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  /**
   * Create a new profile
   */
  async createProfile(data: CreateProfileDto): Promise<profiles> {
    return ProfileCreateOperation.create(data);
  }

  /**
   * Update profile
   */
  async updateProfile(id: string, data: UpdateProfileDto): Promise<profiles> {
    return ProfileUpdateOperation.update(id, data);
  }

  /**
   * Delete profile (soft delete using deleted_at)
   */
  async deleteProfile(id: string): Promise<void> {
    return ProfileDeleteOperation.softDelete(id);
  }

  /**
   * Hard delete profile (use with caution)
   */
  async hardDeleteProfile(id: string): Promise<void> {
    return ProfileDeleteOperation.hardDelete(id);
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Get profile by ID with all related data
   */
  async getProfileById(id: string, includeDetails = false): Promise<ProfileWithDetails | null> {
    return ProfileBaseQuery.getProfileById(id, includeDetails);
  }

  /**
   * Get profile by mobile number
   */
  async getProfileByMobile(phone: string): Promise<profiles | null> {
    return ProfileBaseQuery.getProfileByMobile(phone);
  }

  /**
   * Check if mobile number exists
   */
  async checkMobileNumberExists(mobileNumber: string, excludeProfileId?: string): Promise<boolean> {
    return ProfileBaseQuery.checkMobileNumberExists(mobileNumber, excludeProfileId);
  }

  /**
   * Get all profiles with filtering
   */

  async getAllProfiles(filters?: {
    stage?: string;
    skill_category_id?: string;
    isActive?: boolean;
    isBlacklisted?: boolean;
    search?: string;
    trainer_name?: string;
    training_batch_id?: string;
    has_batch_enrollment?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: profiles[]; total: number }> {
    // If filtering by BOTH skill AND stage, use combined query
    if (filters?.skill_category_id && filters?.stage) {
      return ProfileSkillStageQuery.getProfilesBySkillAndStage(
        filters.skill_category_id,
        filters.stage,
        filters
      );
    }

    // If filtering by skill only, use skill-based query
    if (filters?.skill_category_id) {
      return ProfileSkillQuery.getProfilesBySkill(filters.skill_category_id, filters);
    }

    // If filtering by stage only, use specialized query with stage_transitions
    if (filters?.stage) {
      return ProfileStageQuery.getProfilesByStage(filters.stage, filters);
    }

    // If filtering by trainer, batch, or has_batch_enrollment, use specialized query
    if (filters?.trainer_name || filters?.training_batch_id || filters?.has_batch_enrollment) {
      return ProfileTrainingQuery.getProfilesByTraining(filters);
    }

    // Default: use general filters query
    return ProfileFiltersQuery.getAllProfiles(filters);
  }

  // ============================================================================
  // STAGE MANAGEMENT
  // ============================================================================

  /**
   * Change profile stage
   */
  async changeStage(profileId: string, data: ChangeStageDto): Promise<profiles> {
    return ProfileStageDomain.changeStage(profileId, data);
  }

  /**
   * Get current stage for a profile from stage_transitions table
   */
  async getCurrentStage(profileId: string): Promise<string | null> {
    return ProfileStageDomain.getCurrentStage(profileId);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Generate JWT auth token for candidate
   */
  async generateAuthToken(profileId: string): Promise<{ token: string }> {
    return ProfileAuthDomain.generateAuthToken(profileId);
  }
}

export default new ProfileService();
