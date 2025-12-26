import { ProfileLanguage } from '@/generated/prisma';

/**
 * DTO for creating profile language
 * Omits: id, createdAt, profileId, verifiedByProfileId
 */
export type CreateProfileLanguageDto = Omit<
  ProfileLanguage,
  'id' | 'createdAt' | 'profileId' | 'verifiedByProfileId'
>;

/**
 * DTO for updating profile language
 */
export type UpdateProfileLanguageDto = Partial<CreateProfileLanguageDto>;

/**
 * DTO for profile language response
 */
export type ProfileLanguageResponseDto = ProfileLanguage;
