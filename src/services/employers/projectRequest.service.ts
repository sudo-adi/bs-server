import prisma from '@/config/prisma';
import type { Prisma, project_requests } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateProjectRequestDto,
  ReviewProjectRequestDto,
  UpdateProjectRequestDto,
} from '@/models/employers/employer.model';

export class ProjectRequestService {
  async getAllByEmployerId(
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

  async getAll(filters?: {
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

  async getById(id: string): Promise<project_requests> {
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

  async create(data: CreateProjectRequestDto): Promise<project_requests> {
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: data.employer_id },
    });

    if (!employer || employer.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    const projectRequest = await prisma.project_requests.create({
      data: {
        employer_id: data.employer_id,
        project_title: data.project_title,
        project_description: data.project_description,
        location: data.location,
        estimated_start_date: data.estimated_start_date,
        estimated_duration_days: data.estimated_duration_days,
        estimated_budget: data.estimated_budget,
        additional_notes: data.additional_notes,
        status: 'pending',
      },
    });

    return projectRequest;
  }

  async update(id: string, data: UpdateProjectRequestDto): Promise<project_requests> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const existing = await prisma.project_requests.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Project request not found', 404);
    }

    // Only allow updates if status is pending
    if (existing.status !== 'pending') {
      throw new AppError('Can only update pending project requests', 400);
    }

    const projectRequest = await prisma.project_requests.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return projectRequest;
  }

  async review(id: string, data: ReviewProjectRequestDto): Promise<project_requests> {
    const existing = await prisma.project_requests.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Project request not found', 404);
    }

    if (existing.status !== 'pending') {
      throw new AppError('Project request has already been reviewed', 400);
    }

    const projectRequest = await prisma.project_requests.update({
      where: { id },
      data: {
        status: data.status,
        reviewed_by_user_id: data.reviewed_by_user_id,
        reviewed_at: new Date(),
        project_id: data.project_id,
        updated_at: new Date(),
      },
    });

    return projectRequest;
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.project_requests.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Project request not found', 404);
    }

    // Only allow deletion if status is pending
    if (existing.status !== 'pending') {
      throw new AppError('Can only delete pending project requests', 400);
    }

    await prisma.project_requests.delete({
      where: { id },
    });
  }
}

export default new ProjectRequestService();
