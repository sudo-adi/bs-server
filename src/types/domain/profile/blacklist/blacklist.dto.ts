import type { ProfileBlacklist } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateProfileBlacklistDto = CreateDTO<ProfileBlacklist>;
export type UpdateProfileBlacklistDto = UpdateDTO<ProfileBlacklist>;
