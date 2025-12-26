import { ActivityLog } from '@/generated/prisma';
import { ActivityLogCreateOperation } from './operations/activity-log-create.operation';
import { ActivityLogDeleteOperation } from './operations/activity-log-delete.operation';
import { ActivityLogQuery, ActivityLogQueryParams } from './queries/activity-log.query';

export class ActivityLogService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  async getAllLogs(
    params?: ActivityLogQueryParams
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    return ActivityLogQuery.getAllLogs(params);
  }

  async getLogById(id: string): Promise<ActivityLog> {
    return ActivityLogQuery.getLogById(id);
  }

  async getUserActivity(userId: string, limit = 100): Promise<ActivityLog[]> {
    return ActivityLogQuery.getUserActivity(userId, limit);
  }

  async getModuleActivity(module: string, limit = 100): Promise<ActivityLog[]> {
    return ActivityLogQuery.getModuleActivity(module, limit);
  }

  // ============================================================================
  // CREATE, DELETE OPERATIONS
  // ============================================================================

  async createLog(data: {
    profileId: string;
    action: string;
    module: string;
    recordId?: string;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityLog> {
    return ActivityLogCreateOperation.create(data);
  }

  async deleteOldLogs(daysToKeep = 90): Promise<number> {
    return ActivityLogDeleteOperation.deleteOldLogs(daysToKeep);
  }
}

export default new ActivityLogService();
