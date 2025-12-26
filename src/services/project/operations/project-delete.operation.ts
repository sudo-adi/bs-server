import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { getProjectOrThrow, logProjectStageChange } from '../helpers';

/**
 * Soft delete a project
 */
export async function deleteProject(id: string, deletedByProfileId: string): Promise<void> {
  try {
    const existingProject = await getProjectOrThrow(id);

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: { deletedAt: new Date(), deletedByProfileId, isActive: false },
      });

      await logProjectStageChange(tx, id, existingProject.stage, 'deleted', deletedByProfileId, 'Project soft deleted');
    });

    logger.info('Project soft deleted', { id, deletedByProfileId });
  } catch (error: any) {
    logger.error('Error deleting project', { error, id });
    throw new Error(error.message || 'Failed to delete project');
  }
}
