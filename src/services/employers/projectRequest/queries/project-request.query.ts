import prisma from '@/config/prisma';
import type { Prisma, project_requests } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProjectRequestQuery {
  /**
   * Get all project requests by employer ID
   */
  static async getAllByEmployerId(
    employerId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ projectRequests: project_requests[]; total: number }> {
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: employerId },
    });

    if (!employer || employer.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    const where: Prisma.project_requestsWhereInput = {
      employer_id: employerId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [projectRequests, total] = await Promise.all([
      prisma.project_requests.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          employers: {
            select: {
              id: true,
              employer_code: true,
              company_name: true,
              client_name: true,
            },
          },
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      }),
      prisma.project_requests.count({ where }),
    ]);

    return { projectRequests, total };
  }

  /**
   * Get all project requests (for admin)
   */
  static async getAll(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projectRequests: project_requests[]; total: number }> {
    const where: Prisma.project_requestsWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    const [projectRequests, total] = await Promise.all([
      prisma.project_requests.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          employers: {
            select: {
              id: true,
              employer_code: true,
              company_name: true,
              client_name: true,
              email: true,
              phone: true,
            },
          },
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            },
          },
          users: {
            select: {
              id: true,
              username: true,
              full_name: true,
            },
          },
        },
      }),
      prisma.project_requests.count({ where }),
    ]);

    return { projectRequests, total };
  }

  /**
   * Get project request by ID
   */
  static async getById(id: string): Promise<project_requests> {
    const projectRequest = await prisma.project_requests.findUnique({
      where: { id },
      include: {
        employers: {
          select: {
            id: true,
            employer_code: true,
            company_name: true,
            client_name: true,
            email: true,
            phone: true,
            registered_address: true,
          },
        },
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            location: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    if (!projectRequest) {
      throw new AppError('Project request not found', 404);
    }

    return projectRequest;
  }
}
