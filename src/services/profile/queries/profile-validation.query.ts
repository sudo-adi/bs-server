import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class ProfileValidationQuery {
  static async checkMobileExists(
    mobile: string,
    excludeProfileId?: string
  ): Promise<{ exists: boolean; message: string }> {
    try {
      const where: Prisma.ProfileWhereInput = {
        phone: mobile,
        deletedAt: null,
      };

      if (excludeProfileId) {
        where.id = { not: excludeProfileId };
      }

      const existingProfile = await prisma.profile.findFirst({
        where,
        select: { id: true, firstName: true, lastName: true },
      });

      if (existingProfile) {
        return {
          exists: true,
          message:
            `Mobile number is already registered to ${existingProfile.firstName || ''} ${existingProfile.lastName || ''}`.trim(),
        };
      }

      return {
        exists: false,
        message: 'Mobile number is available',
      };
    } catch (error) {
      logger.error('Error checking mobile exists', { error, mobile });
      throw new Error('Failed to check mobile number');
    }
  }
}
