import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProfileDeleteOperation {
  /**
   * Delete profile (soft delete using deleted_at)
   */
  static async softDelete(id: string): Promise<void> {
    const profile = await prisma.profiles.update({
      where: {
        id,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }
  }

  /**
   * Hard delete profile (use with caution)
   */
  static async hardDelete(id: string): Promise<void> {
    const profile = await prisma.profiles.delete({
      where: { id },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }
  }
}
