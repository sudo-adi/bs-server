import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { PROJECT_REQUEST_STATUSES, ProjectRequestStatus } from '@/types/enums';
import type { ProjectRequest } from '@/types/prisma.types';

export class ProjectRequestQuery {
  static async getAllRequirements(filters?: {
    employer_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: ProjectRequest[]; total: number }> {
    const where: Record<string, string> = {};

    if (filters?.employer_id) {
      where.employer_id = filters.employer_id;
    }

    if (filters?.status) {
      if (!PROJECT_REQUEST_STATUSES.includes(filters.status as ProjectRequestStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${PROJECT_REQUEST_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    const total = await prisma.project_requests.count({ where });

    const results = await prisma.project_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return { requirements: results, total };
  }

  static async getRequirementById(id: string, includeDetails = false): Promise<ProjectRequest> {
    const requirement = await prisma.project_requests.findUnique({
      where: { id },
      include: includeDetails ? { employers: true, projects: true } : undefined,
    });

    if (!requirement) {
      throw new AppError('Employer project requirement not found', 404);
    }

    return requirement;
  }
}
