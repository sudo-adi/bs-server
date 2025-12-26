import { ProfileBankAccount } from '@/generated/prisma';

/**
 * DTO for creating profile bank account
 * Omits: id, createdAt, updatedAt, profileId, verifiedAt, verifiedByProfileId
 */
export type CreateProfileBankAccountDto = Omit<
  ProfileBankAccount,
  'id' | 'createdAt' | 'updatedAt' | 'profileId' | 'verifiedAt' | 'verifiedByProfileId'
>;

/**
 * DTO for updating profile bank account
 */
export type UpdateProfileBankAccountDto = Partial<CreateProfileBankAccountDto>;

/**
 * DTO for profile bank account response
 */
export type ProfileBankAccountResponseDto = ProfileBankAccount;
