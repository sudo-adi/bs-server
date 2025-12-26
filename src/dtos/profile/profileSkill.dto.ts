import { ProfileSkill } from '@/generated/prisma';

/**
 * DTO for creating profile skill
 * Omits: id, createdAt, updatedAt, profileId, verifiedAt, verifiedByProfileId
 */
export type CreateProfileSkillDto = Omit<
  ProfileSkill,
  'id' | 'createdAt' | 'updatedAt' | 'profileId' | 'verifiedAt' | 'verifiedByProfileId'
>;

/**
 * DTO for updating profile skill
 */
export type UpdateProfileSkillDto = Partial<CreateProfileSkillDto>;

/**
 * DTO for profile skill response
 */
export type ProfileSkillResponseDto = ProfileSkill;
