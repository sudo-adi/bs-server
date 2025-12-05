import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ChangeStageDto } from '@/types';
import { PROFILE_STAGES, ProfileStage, isValidStageTransition } from '@/types/enums';
import { CodeGenerator } from '@/utils/codeGenerator';

export class ProfileStageDomain {
  /**
   * Change profile stage
   */
  static async changeStage(profileId: string, data: ChangeStageDto): Promise<profiles> {
    // eslint-disable-next-line no-useless-catch
    try {
      // Validate stage value
      if (!PROFILE_STAGES.includes(data.to_stage as ProfileStage)) {
        throw new AppError(
          `Invalid stage: ${data.to_stage}. Must be one of: ${PROFILE_STAGES.join(', ')}`,
          400
        );
      }

      // Use Prisma transaction to get current stage and create transition
      const profile = await prisma.$transaction(async (tx) => {
        // Get current profile
        const currentProfile = await tx.profiles.findFirst({
          where: {
            id: profileId,
            deleted_at: null,
          },
        });

        if (!currentProfile) {
          throw new AppError('Profile not found', 404);
        }

        // Get latest stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: profileId },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        const currentStage = latestTransition?.to_stage || null;

        // Validate stage transition if there's a current stage
        if (
          currentStage &&
          !isValidStageTransition(currentStage as ProfileStage, data.to_stage as ProfileStage)
        ) {
          throw new AppError(
            `Invalid stage transition from ${currentStage} to ${data.to_stage}`,
            400
          );
        }

        // Generate worker ID if transitioning to BENCHED, APPROVED, or ONBOARDED stage
        // and profile doesn't already have a BSW code
        const needsWorkerCode = [
          ProfileStage.BENCHED,
          ProfileStage.APPROVED,
          ProfileStage.ONBOARDED,
        ].includes(data.to_stage as ProfileStage);

        let updatedProfile = currentProfile;

        if (needsWorkerCode && currentProfile.candidate_code && !currentProfile.candidate_code.startsWith('BSW-')) {
          // Generate worker code (BSW prefix)
          const workerCode = await CodeGenerator.generate('worker');

          // Update profile with worker code
          updatedProfile = await tx.profiles.update({
            where: { id: profileId },
            data: { candidate_code: workerCode },
          });
        }

        // Record stage transition (this is the source of truth for current stage)
        await tx.stage_transitions.create({
          data: {
            profile_id: profileId,
            from_stage: currentStage,
            to_stage: data.to_stage,
            transitioned_by_user_id: data.user_id,
            notes: data.notes,
          },
        });

        return updatedProfile;
      });

      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current stage for a profile from stage_transitions table
   */
  static async getCurrentStage(profileId: string): Promise<string | null> {
    const latestTransition = await prisma.stage_transitions.findFirst({
      where: { profile_id: profileId },
      orderBy: { transitioned_at: 'desc' },
      select: { to_stage: true },
    });

    return latestTransition?.to_stage || null;
  }
}
