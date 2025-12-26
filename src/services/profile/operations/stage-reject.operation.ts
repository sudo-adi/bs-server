import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { PROFILE_STAGES } from '@/constants/stages';
import { ProfileDto } from '@/dtos/profile/profile.dto';

export class StageRejectOperation {
  static async execute(
    id: string,
    reason: string | undefined,
    rejectedByProfileId: string
  ): Promise<ProfileDto> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const updatedProfile = await prisma.profile.update({
        where: { id },
        data: {
          currentStage: PROFILE_STAGES.REJECTED,
        },
      });

      await prisma.profileStageHistory.create({
        data: {
          profileId: id,
          previousStage: profile.currentStage || PROFILE_STAGES.NEW_REGISTRATION,
          newStage: PROFILE_STAGES.REJECTED,
          changedByProfileId: rejectedByProfileId,
          changedAt: new Date(),
          reason: reason || 'Candidate rejected',
        },
      });

      logger.info('Candidate rejected', { id, reason });

      const { passwordHash, ...profileWithoutPassword } = updatedProfile;
      return profileWithoutPassword as ProfileDto;
    } catch (error: any) {
      logger.error('Error rejecting candidate', { error, id });
      throw new Error(error.message || 'Failed to reject candidate');
    }
  }
}
