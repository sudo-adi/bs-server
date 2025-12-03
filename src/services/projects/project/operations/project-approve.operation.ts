import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Prisma } from '@/generated/prisma';
import { ProjectStatus } from '@/types/enums';
import type { ProjectWithDetails } from '@/types';

export class ProjectApproveOperation {
  static async approve(
    id: string,
    data: {
      approved_by_user_id: string;
      approve: boolean;
      approval_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<ProjectWithDetails> {
    const project = await prisma.projects.findUnique({
      where: { id },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    if (project.status !== ProjectStatus.PLANNING) {
      throw new AppError('Only planning projects can be approved or rejected', 400);
    }

    const updateData: Prisma.projectsUpdateInput = data.approve
      ? {
          status: ProjectStatus.APPROVED,
          is_active: true,
        }
      : {
          status: ProjectStatus.CANCELLED,
          is_active: false,
        };

    const updatedProject = await prisma.projects.update({
      where: { id },
      data: updateData,
      include: {
        employers: true,
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
      },
    });

    return updatedProject as ProjectWithDetails;
  }
}
