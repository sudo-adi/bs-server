import { prisma } from '@/config/prisma';
import { profile_blacklist } from '@/generated/prisma';

export class ProfileBlacklistRemoveOperation {
  static async remove(
    profileId: string,
    unblacklistedByUserId?: string
  ): Promise<profile_blacklist | null> {
    const activeEntry = await prisma.profile_blacklist.findFirst({
      where: {
        profile_id: profileId,
        is_active: true,
      },
    });

    if (!activeEntry) {
      return null;
    }

    const updated = await prisma.profile_blacklist.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        is_active: false,
        unblacklisted_at: new Date(),
        unblacklisted_by_user_id: unblacklistedByUserId,
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
        users_profile_blacklist_unblacklisted_by_user_idTousers: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return updated;
  }
}
