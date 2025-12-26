import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ProfileDto, ReactivateProfileDto } from '@/dtos/profile/profile.dto';

export class StageReactivateOperation {
  static async execute(
    id: string,
    request: ReactivateProfileDto,
    reactivatedByProfileId: string
  ): Promise<ProfileDto> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      if (profile.isActive) {
        throw new Error('Profile is already active');
      }

      const updatedProfile = await prisma.profile.update({
        where: { id },
        data: {
          isActive: true,
          reactivatedAt: new Date(),
          reactivatedByProfileId,
        },
      });

      await prisma.profileStageHistory.create({
        data: {
          profileId: id,
          previousStage: 'deactivated',
          newStage: profile.currentStage || 'active',
          changedByProfileId: reactivatedByProfileId,
          changedAt: new Date(),
          reason: request.reason || 'Profile reactivated',
          metadata: request.metadata as any,
        },
      });

      logger.info('Profile reactivated', { id });

      const { passwordHash, ...profileWithoutPassword } = updatedProfile;
      return profileWithoutPassword as ProfileDto;
    } catch (error: any) {
      logger.error('Error reactivating profile', { error, id });
      throw new Error(error.message || 'Failed to reactivate profile');
    }
  }
}
