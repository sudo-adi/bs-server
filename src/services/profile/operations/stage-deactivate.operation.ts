import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { DeactivateProfileDto, ProfileDto } from '@/dtos/profile/profile.dto';

export class StageDeactivateOperation {
  static async execute(
    id: string,
    request: DeactivateProfileDto,
    deactivatedByProfileId: string
  ): Promise<ProfileDto> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      if (!profile.isActive) {
        throw new Error('Profile is already deactivated');
      }

      const updatedProfile = await prisma.profile.update({
        where: { id },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedByProfileId,
        },
      });

      await prisma.profileStageHistory.create({
        data: {
          profileId: id,
          previousStage: profile.currentStage || 'active',
          newStage: 'deactivated',
          changedByProfileId: deactivatedByProfileId,
          changedAt: new Date(),
          reason: request.reason || 'Profile deactivated',
          metadata: request.metadata as any,
        },
      });

      logger.info('Profile deactivated', { id });

      const { passwordHash, ...profileWithoutPassword } = updatedProfile;
      return profileWithoutPassword as ProfileDto;
    } catch (error: any) {
      logger.error('Error deactivating profile', { error, id });
      throw new Error(error.message || 'Failed to deactivate profile');
    }
  }
}
