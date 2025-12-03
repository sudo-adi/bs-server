import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProjectRequestDeleteOperation {
  static async delete(id: string): Promise<void> {
    try {
      await prisma.project_requests.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }
}
