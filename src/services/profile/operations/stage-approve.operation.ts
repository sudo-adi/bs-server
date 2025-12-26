import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { CODE_ENTITY_TYPES } from '@/constants/codes';
import { PROFILE_STAGES } from '@/constants/stages';
import { ApproveCandidateDto, ProfileDto } from '@/dtos/profile/profile.dto';
import codeManagerService from '@/services/code/codeManager.service';

export class StageApproveOperation {
  static async execute(
    id: string,
    request: ApproveCandidateDto,
    approvedByProfileId: string
  ): Promise<ProfileDto> {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const profile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!profile) {
          throw new Error('Profile not found');
        }

        if (profile.candidateApprovedAt) {
          throw new Error('Candidate already approved');
        }

        // Generate candidate code using Code Manager Service if not provided
        let candidateCode = request.candidateCode;
        if (!candidateCode) {
          candidateCode = await codeManagerService.generateNextCode(CODE_ENTITY_TYPES.CANDIDATE);
        }

        // Check if code already exists (race condition protection)
        const existingWithCode = await prisma.profile.findFirst({
          where: { candidateCode, id: { not: id } },
        });

        if (existingWithCode) {
          logger.warn('Candidate code already exists, retrying...', {
            candidateCode,
            attempt,
            profileId: id,
          });
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }

        // Update profile within a transaction
        const updatedProfile = await prisma.$transaction(async (tx) => {
          const doubleCheck = await tx.profile.findFirst({
            where: { candidateCode, id: { not: id } },
          });

          if (doubleCheck) {
            throw new Error('CODE_CONFLICT');
          }

          const updated = await tx.profile.update({
            where: { id },
            data: {
              candidateCode,
              candidateApprovedAt: new Date(),
              candidateApprovedByProfileId: approvedByProfileId,
              candidateCodeAssignedAt: new Date(),
              currentStage: PROFILE_STAGES.APPROVED,
            },
          });

          await tx.profileStageHistory.create({
            data: {
              profileId: id,
              previousStage: profile.currentStage || PROFILE_STAGES.NEW_REGISTRATION,
              newStage: PROFILE_STAGES.APPROVED,
              changedByProfileId: approvedByProfileId,
              changedAt: new Date(),
              reason: 'Candidate approved',
              metadata: { candidateCode },
            },
          });

          return updated;
        });

        logger.info('Candidate approved', { id, candidateCode, attempt });

        const { passwordHash, ...profileWithoutPassword } = updatedProfile;
        return profileWithoutPassword as ProfileDto;
      } catch (error: any) {
        lastError = error;

        if (error.message === 'CODE_CONFLICT' && attempt < MAX_RETRIES) {
          logger.warn('Code conflict detected, retrying...', { attempt, profileId: id });
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
          continue;
        }

        if (attempt === MAX_RETRIES || error.message !== 'CODE_CONFLICT') {
          logger.error('Error approving candidate', { error, id, attempt });
          throw new Error(error.message || 'Failed to approve candidate');
        }
      }
    }

    throw lastError || new Error('Failed to approve candidate after max retries');
  }
}
