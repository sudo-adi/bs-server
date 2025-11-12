import { prisma } from '@/config/prisma';
import { profile_blacklist } from '@/generated/prisma';

interface CreateBlacklistDto {
  profile_id: string;
  reason?: string;
  blacklisted_by_user_id?: string;
}

interface UpdateBlacklistDto {
  reason?: string;
  unblacklisted_at?: Date;
  unblacklisted_by_user_id?: string;
  is_active?: boolean;
}

class ProfileBlacklistService {
  // Add profile to blacklist
  async blacklistProfile(data: CreateBlacklistDto): Promise<profile_blacklist> {
    // Deactivate any existing blacklist entries
    await prisma.profile_blacklist.updateMany({
      where: {
        profile_id: data.profile_id,
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    // Create new blacklist entry
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

  // Remove profile from blacklist
  async removeFromBlacklist(
    profileId: string,
    unblacklistedByUserId?: string
  ): Promise<profile_blacklist | null> {
    // Find active blacklist entry
    const activeEntry = await prisma.profile_blacklist.findFirst({
      where: {
        profile_id: profileId,
        is_active: true,
      },
    });

    if (!activeEntry) {
      return null;
    }

    // Deactivate the blacklist entry
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

  // Get blacklist history for a profile
  async getProfileBlacklistHistory(profileId: string): Promise<profile_blacklist[]> {
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

  // Check if profile is currently blacklisted
  async isProfileBlacklisted(profileId: string): Promise<boolean> {
    const activeBlacklist = await prisma.profile_blacklist.findFirst({
      where: {
        profile_id: profileId,
        is_active: true,
      },
    });

    return activeBlacklist !== null;
  }

  // Get all currently blacklisted profiles
  async getAllBlacklistedProfiles(filters?: {
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

  // Get specific blacklist entry by ID
  async getBlacklistEntryById(id: string): Promise<profile_blacklist | null> {
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

  // Update blacklist entry
  async updateBlacklistEntry(id: string, data: UpdateBlacklistDto): Promise<profile_blacklist> {
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

export default new ProfileBlacklistService();
