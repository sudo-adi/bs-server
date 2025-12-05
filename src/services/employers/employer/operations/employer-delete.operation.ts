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

  static async hardDelete(id: string, _deletedByUserId?: string): Promise<{ projectsDeleted: number }> {
    // Check if employer exists
    const existing = await prisma.employers.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!existing) {
      throw new AppError('Employer not found', 404);
    }

    const projectCount = existing._count.projects;

    // Hard delete in the correct order to respect foreign key constraints:
    // 1. First delete employer_authorized_persons (references employer)
    // 2. Then delete projects (will cascade to project-related data)
    // 3. Finally delete the employer record

    // Delete all authorized persons for this employer
    await prisma.employer_authorized_persons.deleteMany({
      where: { employer_id: id },
    });

    // Delete all projects for this employer (will cascade to related data)
    await prisma.projects.deleteMany({
      where: { employer_id: id },
    });

    // Delete project_requests for this employer
    await prisma.project_requests.deleteMany({
      where: { employer_id: id },
    });

    // Finally delete the employer
    await prisma.employers.delete({
      where: { id },
    });

    return {
      projectsDeleted: projectCount,
    };
  }
}
