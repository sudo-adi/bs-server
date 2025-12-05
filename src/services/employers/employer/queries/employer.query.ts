import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Employer } from '@/types';

export class EmployerQuery {
  /**
   * Get all employers with filters
   */
  static async getAllEmployers(filters?: {
    is_verified?: boolean;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ employers: Employer[]; total: number }> {
    const where: Prisma.employersWhereInput = {
      deleted_at: null,
    };

    if (filters?.is_verified !== undefined) {
      where.is_verified = filters.is_verified;
    }

    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters?.search) {
      where.OR = [
        { company_name: { contains: filters.search, mode: 'insensitive' } },
        { client_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [employers, total] = await Promise.all([
      prisma.employers.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          projects: {
            where: { deleted_at: null },
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              is_active: true,
            },
          },
        },
      }),
      prisma.employers.count({ where }),
    ]);

    return {
      employers,
      total,
    };
  }

  /**
   * Get employer by ID
   */
  static async getEmployerById(id: string): Promise<Employer> {
    const employer = await prisma.employers.findUnique({
      where: { id },
      include: {
        projects: {
          where: { deleted_at: null },
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            is_active: true,
            location: true,
          },
        },
        project_requests: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            project_title: true,
            project_description: true,
            location: true,
            estimated_start_date: true,
            estimated_duration_days: true,
            estimated_budget: true,
            status: true,
            additional_notes: true,
            reviewed_at: true,
            created_at: true,
            project_request_requirements: {
              include: {
                skill_categories: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        employer_authorized_persons: {
          orderBy: { created_at: 'asc' },
          select: {
            id: true,
            employer_id: true,
            name: true,
            designation: true,
            email: true,
            phone: true,
            address: true,
            is_primary: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!employer || employer.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    return employer;
  }

  /**
   * Get employer by email
   */
  static async getEmployerByEmail(email: string): Promise<Employer | null> {
    const employer = await prisma.employers.findFirst({
      where: {
        email,
        deleted_at: null,
      },
    });
    return employer;
  }
}
