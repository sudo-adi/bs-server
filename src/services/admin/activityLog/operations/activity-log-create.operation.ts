import prisma from '@/config/prisma';
import type { activity_logs } from '@/generated/prisma';

export class ActivityLogCreateOperation {
  static async create(data: {
    user_id: string;
    action: string;
    module: string;
    record_id?: number;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<activity_logs> {
    const log = await prisma.activity_logs.create({
      data: {
        user_id: data.user_id,
        action: data.action,
        module: data.module,
        record_id: data.record_id ? String(data.record_id) : undefined,
        old_value: data.old_value,
        new_value: data.new_value,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
      },
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

    return log;
  }
}
