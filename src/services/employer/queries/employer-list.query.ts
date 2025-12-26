import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  EmployerListDto,
  EmployerListQuery as EmployerListQueryDto,
} from '@/dtos/employer/employer.dto';
import { Prisma } from '@/generated/prisma';

/**
 * Get all employers with filters and pagination
 */
export async function getAllEmployers(query: EmployerListQueryDto): Promise<{
  data: EmployerListDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    const { page = 1, limit = 10, search, isActive, isVerified, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployerWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { employerCode: { contains: search } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (status) where.status = status;

    const [employers, total] = await Promise.all([
      prisma.employer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employerCode: true,
          companyName: true,
          clientName: true,
          email: true,
          phone: true,
          isActive: true,
          isVerified: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              projectRequests: true,
              projects: true,
            },
          },
        },
      }),
      prisma.employer.count({ where }),
    ]);

    return {
      data: employers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Error fetching employers', { error });
    throw new Error('Failed to fetch employers');
  }
}

/**
 * Get employer by email
 */
export async function getEmployerByEmail(email: string): Promise<any | null> {
  try {
    const employer = await prisma.employer.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
    return employer;
  } catch (error: any) {
    logger.error('Error fetching employer by email', { error, email });
    throw new Error(error.message || 'Failed to fetch employer by email');
  }
}
