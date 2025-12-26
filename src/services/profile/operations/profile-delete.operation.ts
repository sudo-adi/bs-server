import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ENROLLMENT_STATUSES } from '@/constants/stages';

export class ProfileDeleteOperation {
  static async execute(id: string, deletedByProfileId: string): Promise<void> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Business Rule: Cannot delete profile with active training enrollment
      const activeEnrollment = await prisma.trainingBatchEnrollment.findFirst({
        where: {
          profileId: id,
          status: ENROLLMENT_STATUSES.ENROLLED,
          batch: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
        },
        include: {
          batch: { select: { name: true, code: true } },
        },
      });

      if (activeEnrollment) {
        throw new Error(
          `Cannot delete profile with active training enrollment in batch: ${activeEnrollment.batch?.name || activeEnrollment.batch?.code}`
        );
      }

      await prisma.profile.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedByProfileId,
          isActive: false,
        },
      });

      await prisma.profileStageHistory.create({
        data: {
          profileId: id,
          previousStage: 'active',
          newStage: 'deleted',
          changedByProfileId: deletedByProfileId,
          changedAt: new Date(),
          reason: 'Profile soft deleted',
        },
      });

      logger.info('Profile soft deleted', { id, deletedByProfileId });
    } catch (error) {
      logger.error('Error deleting profile', { error, id });
      throw new Error('Failed to delete profile');
    }
  }
}
