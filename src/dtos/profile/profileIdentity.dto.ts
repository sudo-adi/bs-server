import { ProfileIdentity } from '@/generated/prisma';

/**
 * DTO for profile identity response
 */
export type ProfileIdentityResponseDto = ProfileIdentity;

/**
 * Fields excluded from CreateProfileIdentityDto
 * These are auto-generated or system-managed fields
 */
type CreateExcludedFields = 'id' | 'profileId' | 'createdAt' | 'updatedAt' | 'verifiedAt';

/**
 * Fields excluded from UpdateProfileIdentityDto
 */
type UpdateExcludedFields = 'id' | 'profileId' | 'createdAt' | 'updatedAt';

/**
 * DTO for creating profile identity
 */
export type CreateProfileIdentityDto = Partial<Omit<ProfileIdentity, CreateExcludedFields>>;

/**
 * DTO for updating profile identity
 */
export type UpdateProfileIdentityDto = Partial<Omit<ProfileIdentity, UpdateExcludedFields>>;

/**
 * DTO for setting/updating Aadhaar number
 * Used when user provides raw Aadhaar number that will be hashed
 */
export interface SetAadhaarDto {
  aadhaarNumber: string; // 12-digit Aadhaar number (will be hashed)
  verificationSource?: string;
}

/**
 * DTO for setting/updating PAN number
 * Used when user provides raw PAN that will be hashed
 */
export interface SetPanDto {
  panNumber: string; // 10-character PAN (will be hashed)
  verificationSource?: string;
}
