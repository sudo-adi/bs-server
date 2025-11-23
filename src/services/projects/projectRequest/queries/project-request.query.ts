import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  EmployerProjectRequirement,
  EmployerProjectRequirementWithDetails,
} from '@/models/projects/projectRequest.model';
import { PROJECT_REQUEST_STATUSES, ProjectRequestStatus } from '@/types/enums';

export class ProjectRequestQuery {
  static async getAllRequirements(filters?: {
    employer_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: EmployerProjectRequirement[]; total: number }> {
    const where: any = {};

    if (filters?.employer_id) {
      where.employer_id = filters.employer_id.toString();
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

    return { requirements: results as any[], total };
  }

  static async getRequirementById(
    id: number,
    includeDetails = false
  ): Promise<EmployerProjectRequirementWithDetails> {
    const requirement: any = await prisma.project_requests.findUnique({
      where: { id: id.toString() },
      include: includeDetails ? { employers: true, projects: true } : undefined,
    });

    if (!requirement) {
      throw new AppError('Employer project requirement not found', 404);
    }

    if (includeDetails) {
      return {
        ...requirement,
        employer: requirement.employers,
        project: requirement.projects,
      };
    }

    return requirement;
  }
}
