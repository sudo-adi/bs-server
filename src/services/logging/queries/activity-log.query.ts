import prisma from '@/config/prisma';
import type { ActivityLog, Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export interface ActivityLogQueryParams {
  profileId?: string;
  module?: string;
  action?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

export class ActivityLogQuery {
  /**
   * Get all activity logs with filters
   */
  static async getAllLogs(
    params?: ActivityLogQueryParams
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    const where: Prisma.ActivityLogWhereInput = {};

    if (params?.profileId) {
      where.profileId = params.profileId;
    }

    if (params?.module) {
      where.module = params.module;
    }

    if (params?.action) {
      where.action = params.action;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params?.limit,
        skip: params?.offset,
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      total,
    };
  }

  /**
   * Get activity log by ID
   */
  static async getLogById(id: string): Promise<ActivityLog> {
    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
  static async getUserActivity(profileId: string, limit = 100): Promise<ActivityLog[]> {
    const logs = await prisma.activityLog.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return logs;
  }

  /**
   * Get module activity
   */
  static async getModuleActivity(module: string, limit = 100): Promise<ActivityLog[]> {
    const logs = await prisma.activityLog.findMany({
      where: { module },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return logs;
  }
}
