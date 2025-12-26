import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { CODE_ENTITY_TYPES } from '@/constants/codes';
import { STAGE_CODE_ASSIGNMENT } from '@/constants/stages';
import { ProfileDto, UpdateProfileDto } from '@/dtos/profile/profile.dto';
import codeManagerService from '@/services/code/codeManager.service';
import bcrypt from 'bcrypt';
import { NestedUpdateHelper } from '../helpers/nested-update.helper';
import { ProfileDetailQuery } from '../queries/profile-detail.query';

export class ProfileUpdateOperation {
  static async execute(
    id: string,
    data: UpdateProfileDto,
    updatedByProfileId?: string
  ): Promise<ProfileDto> {
    try {
      const existingProfile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!existingProfile) {
        throw new Error('Profile not found');
      }

      const {
        identity,
        addresses,
        bankAccounts,
        documents,
        qualifications,
        skills,
        languages,
        interactions,
        password,
        ...profileData
      } = data as any;

      // Convert dateOfBirth to proper DateTime if provided
      if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
        profileData.dateOfBirth = new Date(profileData.dateOfBirth);
      }

      // Hash password if provided
      if (password) {
        profileData.passwordHash = await bcrypt.hash(password, 10);
      }

      // Check if stage is being changed to approved and auto-assign BSC code
      if (
        profileData.currentStage &&
        STAGE_CODE_ASSIGNMENT.BSC_CODE_STAGES.includes(profileData.currentStage as any) &&
        !existingProfile.candidateCode
      ) {
        const candidateCode = await codeManagerService.generateNextCode(
          CODE_ENTITY_TYPES.CANDIDATE
        );
        profileData.candidateCode = candidateCode;
        profileData.candidateCodeAssignedAt = new Date();
        profileData.candidateApprovedAt = new Date();
        if (updatedByProfileId) {
          profileData.candidateApprovedByProfileId = updatedByProfileId;
        }

        logger.info('Auto-assigned BSC code on approval', {
          profileId: id,
          candidateCode,
          stage: profileData.currentStage,
        });
      }

      // Check if stage is being changed to worker and auto-assign BSW code
      if (
        profileData.currentStage &&
        STAGE_CODE_ASSIGNMENT.BSW_CODE_STAGES.includes(profileData.currentStage as any) &&
        !existingProfile.workerCode
      ) {
        const workerCode = await codeManagerService.generateNextCode(CODE_ENTITY_TYPES.WORKER);
        profileData.workerCode = workerCode;
        profileData.workerCodeAssignedAt = new Date();
        profileData.workerConvertedAt = new Date();

        logger.info('Auto-assigned BSW code on worker conversion', {
          profileId: id,
          workerCode,
          stage: profileData.currentStage,
        });
      }

      // Use a transaction for atomic updates with extended timeout
      await prisma.$transaction(async (tx) => {
        if (Object.keys(profileData).length > 0) {
          await tx.profile.update({
            where: { id },
            data: {
              ...profileData,
              metadata: profileData.metadata as any,
            },
          });
        }

        if (addresses && addresses.length > 0) {
          await NestedUpdateHelper.handleAddresses(tx, id, addresses);
        }

        if (bankAccounts && bankAccounts.length > 0) {
          await NestedUpdateHelper.handleBankAccounts(tx, id, bankAccounts);
        }

        if (documents && documents.length > 0) {
          await NestedUpdateHelper.handleDocuments(tx, id, documents, updatedByProfileId);
        }

        if (qualifications && qualifications.length > 0) {
          await NestedUpdateHelper.handleQualifications(tx, id, qualifications);
        }

        if (skills && skills.length > 0) {
          await NestedUpdateHelper.handleSkills(tx, id, skills);
        }

        if (languages && languages.length > 0) {
          await NestedUpdateHelper.handleLanguages(tx, id, languages);
        }

        if (interactions && interactions.length > 0) {
          await NestedUpdateHelper.handleInteractions(tx, id, interactions, updatedByProfileId);
        }
      }, {
        maxWait: 10000, // 10 seconds max wait to connect
        timeout: 30000, // 30 seconds transaction timeout
      });

      logger.info('Profile updated', { id });

      const updatedProfile = await ProfileDetailQuery.execute(id);
      return updatedProfile as ProfileDto;
    } catch (error: any) {
      logger.error('Error updating profile', { error, id });
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}
