import { prisma } from '@/config/prisma';
import { profile_blacklist } from '@/generated/prisma';

export class ProfileBlacklistQuery {
  static async getProfileBlacklistHistory(profileId: string): Promise<profile_blacklist[]> {
    return await prisma.profile_blacklist.findMany({
      where: {
        profile_id: profileId,
      },
      include: {
        users_profile_blacklist_blacklisted_by_user_idTousers: {
          select: {
            id: true,
            username: true,
            full_name: true,
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
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  static async isProfileBlacklisted(profileId: string): Promise<boolean> {
    const activeBlacklist = await prisma.profile_blacklist.findFirst({
      where: {
        profile_id: profileId,
        is_active: true,
      },
    });

    return activeBlacklist !== null;
  }

  static async getAllBlacklistedProfiles(filters?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ data: profile_blacklist[]; total: number }> {
    const where: any = {
      is_active: true,
    };

    if (filters?.search) {
      where.profiles = {
        OR: [
          { first_name: { contains: filters.search, mode: 'insensitive' } },
          { last_name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } },
          { candidate_code: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      prisma.profile_blacklist.findMany({
        where,
        include: {
          profiles: {
            select: {
              id: true,
              candidate_code: true,
              first_name: true,
              last_name: true,
              phone: true,
              email: true,
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
        orderBy: {
          blacklisted_at: 'desc',
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.profile_blacklist.count({ where }),
    ]);

    return { data, total };
  }

  static async getBlacklistEntryById(id: string): Promise<profile_blacklist | null> {
    return await prisma.profile_blacklist.findUnique({
      where: { id },
      include: {
        profiles: {
          select: {
            id: true,
            candidate_code: true,
            first_name: true,
            last_name: true,
            phone: true,
            email: true,
          },
        },
        users_profile_blacklist_blacklisted_by_user_idTousers: {
          select: {
            id: true,
            username: true,
            full_name: true,
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
  }
}
