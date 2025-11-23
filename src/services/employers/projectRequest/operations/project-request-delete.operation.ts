import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProjectRequestDeleteOperation {
  static async delete(id: string): Promise<void> {
    const existing = await prisma.project_requests.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Project request not found', 404);
    }

    // Only allow deletion if status is pending
    if (existing.status !== 'pending') {
      throw new AppError('Can only delete pending project requests', 400);
    }

    await prisma.project_requests.delete({
      where: { id },
    });
  }
}
