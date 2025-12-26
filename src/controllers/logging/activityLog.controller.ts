import { activityLogService } from '@/services/logging';
import { Request, Response } from 'express';

export class ActivityLogController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        profileId: req.query.profileId as string,
        action: req.query.action as string,
        module: req.query.module as string,
      };

      const result = await activityLogService.getAllLogs(params);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: {
          total: result.total,
          page: params.page,
          limit: params.limit,
          totalPages: Math.ceil(result.total / params.limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch activity logs',
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const log = await activityLogService.getLogById(id);

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error: any) {
      const status = error.message === 'Activity log not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to fetch activity log',
      });
    }
  }

  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const logs = await activityLogService.getUserActivity(profileId, limit);

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user activity',
      });
    }
  }

  async getModuleActivity(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const logs = await activityLogService.getModuleActivity(module, limit);

      res.status(200).json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch module activity',
      });
    }
  }

  async deleteOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const daysToKeep = req.body.daysToKeep ? parseInt(req.body.daysToKeep) : 90;
      const deletedCount = await activityLogService.deleteOldLogs(daysToKeep);

      res.status(200).json({
        success: true,
        message: `Deleted ${deletedCount} old activity logs`,
        deletedCount,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete old logs',
      });
    }
  }
}

export const activityLogController = new ActivityLogController();
