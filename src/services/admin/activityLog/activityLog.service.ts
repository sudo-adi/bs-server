import type { activity_logs } from '@/generated/prisma';
import { ActivityLogCreateOperation } from './operations/activity-log-create.operation';
import { ActivityLogDeleteOperation } from './operations/activity-log-delete.operation';
import { ActivityLogQuery, ActivityLogQueryParams } from './queries/activity-log.query';

export class ActivityLogService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  async getAllLogs(
    params?: ActivityLogQueryParams
  ): Promise<{ logs: activity_logs[]; total: number }> {
    return ActivityLogQuery.getAllLogs(params);
  }

  async getLogById(id: string): Promise<activity_logs> {
    return ActivityLogQuery.getLogById(id);
  }

  async getUserActivity(userId: string, limit = 100): Promise<activity_logs[]> {
    return ActivityLogQuery.getUserActivity(userId, limit);
  }

  async getModuleActivity(module: string, limit = 100): Promise<activity_logs[]> {
    return ActivityLogQuery.getModuleActivity(module, limit);
  }

  // ============================================================================
  // CREATE, DELETE OPERATIONS
  // ============================================================================

  async createLog(data: {
    user_id: string;
    action: string;
    module: string;
    record_id?: number;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<activity_logs> {
    return ActivityLogCreateOperation.create(data);
  }

  async deleteOldLogs(daysToKeep = 90): Promise<number> {
    return ActivityLogDeleteOperation.deleteOldLogs(daysToKeep);
  }
}

export default new ActivityLogService();
