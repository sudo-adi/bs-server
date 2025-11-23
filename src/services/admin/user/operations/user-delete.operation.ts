import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class UserDeleteOperation {
  /**
   * Delete user (soft delete)
   * Instead of hard deleting, we set is_active to false to prevent foreign key constraint violations
   */
  static async delete(id: string): Promise<void> {
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete: set is_active to false
    await prisma.users.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }
}
