import { prisma } from '@/config/prisma';
import { profile_blacklist } from '@/generated/prisma';

interface UpdateBlacklistDto {
  reason?: string;
  unblacklisted_at?: Date;
  unblacklisted_by_user_id?: string;
  is_active?: boolean;
}

export class ProfileBlacklistUpdateOperation {
  static async update(id: string, data: UpdateBlacklistDto): Promise<profile_blacklist> {
    return await prisma.profile_blacklist.update({
      where: { id },
      data,
      include: {
        profiles: {
          select: {
            id: true,
            candidate_code: true,
            first_name: true,
            last_name: true,
            phone: true,
          },
        },
      },
    });
  }
}
