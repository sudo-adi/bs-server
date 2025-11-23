import { profile_blacklist } from '@/generated/prisma';
import { ProfileBlacklistQuery } from './queries/profile-blacklist.query';
import { ProfileBlacklistCreateOperation } from './operations/profile-blacklist-create.operation';
import { ProfileBlacklistUpdateOperation } from './operations/profile-blacklist-update.operation';
import { ProfileBlacklistRemoveOperation } from './operations/profile-blacklist-remove.operation';

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
  async blacklistProfile(data: CreateBlacklistDto): Promise<profile_blacklist> {
    return ProfileBlacklistCreateOperation.create(data);
  }

  async removeFromBlacklist(
    profileId: string,
    unblacklistedByUserId?: string
  ): Promise<profile_blacklist | null> {
    return ProfileBlacklistRemoveOperation.remove(profileId, unblacklistedByUserId);
  }

  async getProfileBlacklistHistory(profileId: string): Promise<profile_blacklist[]> {
    return ProfileBlacklistQuery.getProfileBlacklistHistory(profileId);
  }

  async isProfileBlacklisted(profileId: string): Promise<boolean> {
    return ProfileBlacklistQuery.isProfileBlacklisted(profileId);
  }

  async getAllBlacklistedProfiles(filters?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ data: profile_blacklist[]; total: number }> {
    return ProfileBlacklistQuery.getAllBlacklistedProfiles(filters);
  }

  async getBlacklistEntryById(id: string): Promise<profile_blacklist | null> {
    return ProfileBlacklistQuery.getBlacklistEntryById(id);
  }

  async updateBlacklistEntry(id: string, data: UpdateBlacklistDto): Promise<profile_blacklist> {
    return ProfileBlacklistUpdateOperation.update(id, data);
  }
}

export default new ProfileBlacklistService();
