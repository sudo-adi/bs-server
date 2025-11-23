import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ResourceRequirementDeleteOperation {
  static async delete(id: number): Promise<void> {
    try {
      await prisma.project_resource_requirements.delete({
        where: { id: id.toString() },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Project skill requirement not found', 404);
      }
      throw error;
    }
  }
}
