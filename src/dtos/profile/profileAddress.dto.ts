import { ProfileAddress } from '@/generated/prisma';

/**
 * DTO for creating profile address
 * Omits: id, createdAt, updatedAt, profileId, verifiedAt, verifiedByProfileId
 */
export type CreateProfileAddressDto = Omit<
  ProfileAddress,
  'id' | 'createdAt' | 'updatedAt' | 'profileId' | 'verifiedAt' | 'verifiedByProfileId'
>;

/**
 * DTO for updating profile address
 */
export type UpdateProfileAddressDto = Partial<CreateProfileAddressDto>;

/**
 * DTO for profile address response
 */
export type ProfileAddressResponseDto = ProfileAddress;
