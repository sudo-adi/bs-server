import { statusHistoryService } from '@/services/history/statusHistory.service';
import { Request, Response } from 'express';

export class StatusHistoryController {
  async getProfileStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };
      const result = await statusHistoryService.getProfileStatusHistory(req.params.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      const status = error.message === 'Profile not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch status history' });
    }
  }

  async getProjectStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };
      const result = await statusHistoryService.getProjectStatusHistory(req.params.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      const status = error.message === 'Project not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch status history' });
    }
  }

  async getEmployerStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };
      const result = await statusHistoryService.getEmployerStatusHistory(req.params.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      const status = error.message === 'Employer not found' ? 404 : 500;
      res
        .status(status)
        .json({ success: false, message: error.message || 'Failed to fetch status history' });
    }
  }

  async getActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        module: req.query.module as string,
        action: req.query.action as string,
        profileId: req.query.profileId as string,
      };
      const result = await statusHistoryService.getActivityLogs(query);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error.message || 'Failed to fetch activity logs' });
    }
  }
}

export const statusHistoryController = new StatusHistoryController();
export default statusHistoryController;
