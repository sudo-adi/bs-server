import { prisma } from '@/config/prisma';
import { profile_blacklist } from '@/generated/prisma';

interface CreateBlacklistDto {
  profile_id: string;
  reason?: string;
  blacklisted_by_user_id?: string;
}

export class ProfileBlacklistCreateOperation {
  static async create(data: CreateBlacklistDto): Promise<profile_blacklist> {
    await prisma.profile_blacklist.updateMany({
      where: {
        profile_id: data.profile_id,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    const blacklistEntry = await prisma.profile_blacklist.create({
      data: {
        profile_id: data.profile_id,
        reason: data.reason,
        blacklisted_at: new Date(),
        blacklisted_by_user_id: data.blacklisted_by_user_id,
        is_active: true,
      },
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
        users_profile_blacklist_blacklisted_by_user_idTousers: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return blacklistEntry;
  }
}
