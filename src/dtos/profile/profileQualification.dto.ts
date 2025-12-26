import { ProfileQualification } from '@/generated/prisma';

/**
 * DTO for creating profile qualification
 * Omits: id, createdAt, profileId, verifiedAt, verifiedByProfileId
 */
export type CreateProfileQualificationDto = Omit<
  ProfileQualification,
  'id' | 'createdAt' | 'profileId' | 'verifiedAt' | 'verifiedByProfileId'
>;

/**
 * DTO for updating profile qualification
 */
export type UpdateProfileQualificationDto = Partial<CreateProfileQualificationDto>;

/**
 * DTO for profile qualification response
 */
export type ProfileQualificationResponseDto = ProfileQualification;
