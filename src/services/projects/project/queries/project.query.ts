import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { PROJECT_STATUSES, ProjectStatus } from '@/types/enums';
import type { ProjectWithDetails } from '@/types';

export class ProjectQuery {
  /**
   * Get all projects with optional filters
   */
  static async getAllProjects(filters?: {
    employer_id?: string;
    status?: string;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projects: ProjectWithDetails[]; total: number }> {
    const where: Prisma.projectsWhereInput = {};

    if (filters?.employer_id) {
      where.employer_id = filters.employer_id;
    }

    if (filters?.status) {
      if (!PROJECT_STATUSES.includes(filters.status as ProjectStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${PROJECT_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { po_co_number: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    where.deleted_at = null;

    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          employers: true,
          project_resource_requirements: {
            include: { skill_categories: true },
          },
          project_worker_assignments: {
            take: 5,
            orderBy: { created_at: 'desc' },
          },
          project_requests: true,
        },
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.projects.count({ where }),
    ]);

    return {
      projects: projects as ProjectWithDetails[],
      total,
    };
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string, includeDetails = false): Promise<ProjectWithDetails> {
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        employers: includeDetails,
        project_resource_requirements: {
          include: { skill_categories: true },
        },
        project_worker_assignments: includeDetails
          ? {
              orderBy: { created_at: 'desc' },
              include: { profiles: true },
            }
          : false,
        project_requests: includeDetails,
        project_financials: true,
      },
    });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    return project as ProjectWithDetails;
  }
}
