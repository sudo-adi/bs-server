import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProjectDeleteOperation {
  /**
   * Soft delete a project
   */
  static async delete(id: string, deleted_by_user_id?: string): Promise<void> {
    const project = await prisma.projects.findUnique({ where: { id } });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    await prisma.projects.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_user_id,
        is_active: false,
      },
    });
  }
}
