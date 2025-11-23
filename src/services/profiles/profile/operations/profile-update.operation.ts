import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { UpdateProfileDto } from '@/types/prisma.types';
import { sanitizeObject } from '@/utils/sanitize';

export class ProfileUpdateOperation {
  /**
   * Update profile
   */
  static async update(id: string, data: UpdateProfileDto): Promise<profiles> {
    // Sanitize all string inputs to prevent XSS
    const sanitizedData = sanitizeObject(data);

    // Filter out undefined values
    const updateData: Record<string, unknown> = {};
    Object.entries(sanitizedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const profile = await prisma.profiles.update({
      where: {
        id,
        deleted_at: null,
      },
      data: updateData,
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  }
}
