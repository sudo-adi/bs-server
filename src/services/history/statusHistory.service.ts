import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class StatusHistoryService {
  async getProfileStatusHistory(profileId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) throw new Error('Profile not found');

    const [history, total] = await Promise.all([
      prisma.profileStageHistory.findMany({
        where: { profileId },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
        include: {
          changedByProfile: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.profileStageHistory.count({ where: { profileId } }),
    ]);

    return {
      data: history,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProjectStatusHistory(projectId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const [history, total] = await Promise.all([
      prisma.projectStageHistory.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
        include: {
          changedByProfile: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.projectStageHistory.count({ where: { projectId } }),
    ]);

    return {
      data: history,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEmployerStatusHistory(employerId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const employer = await prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) throw new Error('Employer not found');

    const [history, total] = await Promise.all([
      prisma.employerStatusHistory.findMany({
        where: { employerId },
        skip,
        take: limit,
        orderBy: { changedAt: 'desc' },
        include: {
          changedByProfile: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.employerStatusHistory.count({ where: { employerId } }),
    ]);

    return {
      data: history,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getActivityLogs(query: {
    page?: number;
    limit?: number;
    module?: string;
    action?: string;
    profileId?: string;
  }) {
    const { page = 1, limit = 50, module, action, profileId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (profileId) where.profileId = profileId;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

export const statusHistoryService = new StatusHistoryService();
export default statusHistoryService;
