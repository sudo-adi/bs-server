import logger from '@/config/logger';
import { StageApproveOperation } from './stage-approve.operation';
import { StageDeactivateOperation } from './stage-deactivate.operation';
import { ProfileDeleteOperation } from './profile-delete.operation';

export class BulkOperations {
  static async bulkApprove(
    profileIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const profileId of profileIds) {
      try {
        await StageApproveOperation.execute(profileId, {}, userId);
        successCount++;
      } catch (error) {
        logger.error('Bulk approve failed for profile', { profileId, error });
        failedCount++;
      }
    }

    logger.info('Bulk approve completed', { successCount, failedCount });
    return { success: successCount, failed: failedCount };
  }

  static async bulkSoftDelete(
    profileIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const profileId of profileIds) {
      try {
        await StageDeactivateOperation.execute(profileId, {}, userId);
        successCount++;
      } catch (error) {
        logger.error('Bulk soft delete failed for profile', { profileId, error });
        failedCount++;
      }
    }

    logger.info('Bulk soft delete completed', { successCount, failedCount });
    return { success: successCount, failed: failedCount };
  }

  static async bulkHardDelete(
    profileIds: string[],
    userId: string,
    _password?: string
  ): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    for (const profileId of profileIds) {
      try {
        await ProfileDeleteOperation.execute(profileId, userId);
        successCount++;
      } catch (error) {
        logger.error('Bulk hard delete failed for profile', { profileId, error });
        failedCount++;
      }
    }

    logger.info('Bulk hard delete completed', { successCount, failedCount });
    return { success: successCount, failed: failedCount };
  }
}
