import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class AssignmentDeleteOperation {
  static async delete(id: string): Promise<void> {
    try {
      await prisma.project_assignments.delete({ where: { id } });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Assignment not found', 404);
      }
      throw error;
    }
  }
}
