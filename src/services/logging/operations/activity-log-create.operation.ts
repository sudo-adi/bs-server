import prisma from '@/config/prisma';
import { ActivityLog } from '@/generated/prisma';

export class ActivityLogCreateOperation {
  static async create(data: {
    profileId: string;
    action: string;
    module: string;
    recordId?: string;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ActivityLog> {
    const log = await prisma.activityLog.create({
      data: {
        profileId: data.profileId,
        action: data.action,
        module: data.module,
        recordId: data.recordId,
        oldValue: data.oldValue,
        newValue: data.newValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return log;
  }
}
