import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { getEmployerOrThrow } from '../helpers/employer-lookup.helper';
import { createStatusHistoryEntry } from '../helpers/status-history.helper';

/**
 * Soft delete employer
 */
export async function deleteEmployer(id: string, deletedByProfileId?: string): Promise<void> {
  try {
    const employer = await getEmployerOrThrow(id);

    await prisma.employer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedByProfileId,
        isActive: false,
      },
    });

    await createStatusHistoryEntry(
      id,
      employer.status || 'active',
      'deleted',
      deletedByProfileId,
      'Employer soft deleted'
    );

    logger.info('Employer soft deleted', { id, deletedByProfileId });
  } catch (error: any) {
    logger.error('Error deleting employer', { error, id });
    throw new Error(error.message || 'Failed to delete employer');
  }
}

/**
 * Hard delete employer (permanently)
 */
export async function hardDeleteEmployer(
  id: string,
  _deletedByProfileId?: string
): Promise<{ projectsDeleted: number }> {
  try {
    const existing = await prisma.employer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error('Employer not found');
    }

    const projectCount = existing._count.projects;

    // Delete in correct order for foreign key constraints
    await prisma.employerAuthorizedPerson.deleteMany({
      where: { employerId: id },
    });

    await prisma.project.deleteMany({
      where: { employerId: id },
    });

    await prisma.projectRequest.deleteMany({
      where: { employerId: id },
    });

    await prisma.employer.delete({
      where: { id },
    });

    logger.info('Employer hard deleted', { id, projectsDeleted: projectCount });

    return { projectsDeleted: projectCount };
  } catch (error: any) {
    logger.error('Error hard deleting employer', { error, id });
    throw new Error(error.message || 'Failed to hard delete employer');
  }
}
