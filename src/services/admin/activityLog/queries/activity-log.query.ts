import prisma from '@/config/prisma';
import type { activity_logs, Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export interface ActivityLogQueryParams {
  user_id?: string;
  module?: string;
  action?: string;
  limit?: number;
  offset?: number;
  start_date?: Date;
  end_date?: Date;
}

export class ActivityLogQuery {
  /**
   * Get all activity logs with filters
   */
  static async getAllLogs(
    params?: ActivityLogQueryParams
  ): Promise<{ logs: activity_logs[]; total: number }> {
    const where: Prisma.activity_logsWhereInput = {};

    if (params?.user_id) {
      where.user_id = params.user_id;
    }

    if (params?.module) {
      where.module = params.module;
    }

    if (params?.action) {
      where.action = params.action;
    }

    if (params?.start_date || params?.end_date) {
      where.created_at = {};
      if (params.start_date) {
        where.created_at.gte = params.start_date;
      }
      if (params.end_date) {
        where.created_at.lte = params.end_date;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activity_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: params?.limit,
        skip: params?.offset,
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              full_name: true,
            },
          },
        },
      }),
      prisma.activity_logs.count({ where }),
    ]);

    return {
      logs,
      total,
    };
  }

  /**
   * Get activity log by ID
   */
  static async getLogById(id: string): Promise<activity_logs> {
    const log = await prisma.activity_logs.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    if (!log) {
      throw new AppError('Activity log not found', 404);
    }

    return log;
  }

  /**
   * Get user activity
   */
  static async getUserActivity(userId: string, limit = 100): Promise<activity_logs[]> {
    const logs = await prisma.activity_logs.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    return logs;
  }

  /**
   * Get module activity
   */
  static async getModuleActivity(module: string, limit = 100): Promise<activity_logs[]> {
    const logs = await prisma.activity_logs.findMany({
      where: { module },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    return logs;
  }
}
