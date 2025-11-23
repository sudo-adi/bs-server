import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { ProjectWithDetails } from '@/types/prisma.types';

export class ProjectCreateFromRequestOperation {
  /**
   * Create project from project request (approve project request)
   */
  static async createFromRequest(
    projectRequestId: string,
    userId: string
  ): Promise<ProjectWithDetails> {
    const projectRequest = await prisma.project_requests.findUnique({
      where: { id: projectRequestId },
      include: {
        project_request_requirements: {
          include: { skill_categories: true },
        },
        employers: true,
      },
    });

    if (!projectRequest) {
      throw new AppError('Project request not found', 404);
    }

    if (projectRequest.status === 'project_created') {
      throw new AppError('Project already created from this request', 400);
    }

    if (!projectRequest.employers) {
      throw new AppError('Employer not found for this project request', 404);
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Generate unique project code in format: BSP-001
        const lastProject = await tx.projects.findFirst({
          where: { code: { startsWith: 'BSP-' } },
          orderBy: { code: 'desc' },
          select: { code: true },
        });

        let nextCode = 1;
        if (lastProject) {
          const match = lastProject.code.match(/BSP-(\d+)/);
          if (match) nextCode = parseInt(match[1]) + 1;
        }

        const code = `BSP-${String(nextCode).padStart(3, '0')}`;

        const project = await tx.projects.create({
          data: {
            code,
            name: projectRequest.project_title,
            description: projectRequest.project_description,
            location: projectRequest.location,
            employer_id: projectRequest.employer_id!,
            contact_phone: projectRequest.employers?.phone || '',
            status: 'planning',
            is_active: true,
            created_by_user_id: userId,
          },
          include: {
            employers: true,
            project_resource_requirements: {
              include: { skill_categories: true },
            },
          },
        });

        if (projectRequest.project_request_requirements.length > 0) {
          await tx.project_resource_requirements.createMany({
            data: projectRequest.project_request_requirements.map((req) => ({
              project_id: project.id,
              skill_category_id: req.skill_category_id,
              required_count: req.required_count,
              notes: req.notes,
            })),
          });
        }

        await tx.project_requests.update({
          where: { id: projectRequestId },
          data: {
            status: 'project_created',
            reviewed_at: new Date(),
            reviewed_by_user_id: userId,
            project_id: project.id,
          },
        });

        const completeProject = await tx.projects.findUnique({
          where: { id: project.id },
          include: {
            employers: true,
            project_resource_requirements: {
              include: { skill_categories: true },
            },
          },
        });

        return completeProject!;
      },
      { maxWait: 10000, timeout: 20000 }
    );

    return result as ProjectWithDetails;
  }
}
