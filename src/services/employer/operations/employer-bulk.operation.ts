import logger from '@/config/logger';
import { hardDeleteEmployer } from './employer-delete.operation';
import { updateEmployer } from './employer-update.operation';
import { verifyEmployer } from './employer-verify.operation';

/**
 * Bulk verify multiple employers
 */
export async function bulkVerify(
  employerIds: string[],
  verifiedByProfileId: string
): Promise<{ success: number; failed: number; errors: any[] }> {
  const errors: any[] = [];
  let successCount = 0;

  for (const employerId of employerIds) {
    try {
      await verifyEmployer(employerId, {}, verifiedByProfileId);
      successCount++;
    } catch (error: any) {
      errors.push({
        employerId,
        error: error.message || 'Unknown error',
      });
    }
  }

  logger.info('Bulk verify completed', {
    success: successCount,
    failed: errors.length,
  });

  return {
    success: successCount,
    failed: errors.length,
    errors,
  };
}

/**
 * Bulk soft delete multiple employers
 */
export async function bulkSoftDelete(
  employerIds: string[]
): Promise<{ success: number; failed: number; errors: any[] }> {
  const errors: any[] = [];
  let successCount = 0;

  for (const employerId of employerIds) {
    try {
      await updateEmployer(employerId, { isActive: false });
      successCount++;
    } catch (error: any) {
      errors.push({
        employerId,
        error: error.message || 'Unknown error',
      });
    }
  }

  logger.info('Bulk soft delete completed', {
    success: successCount,
    failed: errors.length,
  });

  return {
    success: successCount,
    failed: errors.length,
    errors,
  };
}

/**
 * Bulk hard delete multiple employers (permanently)
 */
export async function bulkHardDelete(
  employerIds: string[],
  deletedByProfileId?: string
): Promise<{ success: number; failed: number; errors: any[]; projectsDeleted: number }> {
  const errors: any[] = [];
  let successCount = 0;
  let totalProjectsDeleted = 0;

  for (const employerId of employerIds) {
    try {
      const result = await hardDeleteEmployer(employerId, deletedByProfileId);
      totalProjectsDeleted += result.projectsDeleted;
      successCount++;
    } catch (error: any) {
      errors.push({
        employerId,
        error: error.message || 'Unknown error',
      });
    }
  }

  logger.info('Bulk hard delete completed', {
    success: successCount,
    failed: errors.length,
    projectsDeleted: totalProjectsDeleted,
  });

  return {
    success: successCount,
    failed: errors.length,
    errors,
    projectsDeleted: totalProjectsDeleted,
  };
}
