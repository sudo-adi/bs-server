import { ProfileInteraction } from '@/generated/prisma';

/**
 * DTO for creating profile interaction
 * Omits: id, createdAt, updatedAt, profileId, createdByProfileId
 */
export type CreateProfileInteractionDto = Omit<
  ProfileInteraction,
  'id' | 'createdAt' | 'updatedAt' | 'profileId' | 'createdByProfileId'
>;

/**
 * DTO for updating profile interaction
 */
export type UpdateProfileInteractionDto = Partial<CreateProfileInteractionDto>;

/**
 * DTO for profile interaction response
 */
export type ProfileInteractionResponseDto = ProfileInteraction;
