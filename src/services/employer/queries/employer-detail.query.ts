import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { EmployerDetailDto } from '@/dtos/employer/employer.dto';

/**
 * Get employer by ID with full details
 */
export async function getEmployerById(id: string): Promise<EmployerDetailDto | null> {
  try {
    const employer = await prisma.employer.findUnique({
      where: { id, deletedAt: null },
      include: {
        authorizedPersons: {
          orderBy: { createdAt: 'desc' },
        },
        projectRequests: {
          include: {
            requirements: {
              include: {
                skillCategory: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        projects: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          include: {
            changedByProfile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { changedAt: 'desc' },
        },
        verifiedByProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!employer) return null;

    const { passwordHash, ...employerWithoutPassword } = employer;
    return employerWithoutPassword as EmployerDetailDto;
  } catch (error) {
    logger.error('Error fetching employer by ID', { error, id });
    throw new Error('Failed to fetch employer');
  }
}
