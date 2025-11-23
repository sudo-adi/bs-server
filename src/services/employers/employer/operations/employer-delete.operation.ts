import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class EmployerDeleteOperation {
  static async delete(id: string, deletedByUserId?: string): Promise<void> {
    // Check if employer exists and is not already deleted
    const existing = await prisma.employers.findUnique({
      where: { id },
    });

    if (!existing || existing.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    // Soft delete the employer
    await prisma.employers.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_user_id: deletedByUserId,
        is_active: false,
      },
    });
  }
}
