import type { ProfileSkill, SkillCategory } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateProfileSkillDto = CreateDTO<ProfileSkill>;
export type UpdateProfileSkillDto = UpdateDTO<ProfileSkill>;

export interface VerifySkillDto {
  verified_by_user_id: string;
}

// Skill Category DTOs
export type CreateSkillCategoryDto = CreateDTO<SkillCategory>;
export type UpdateSkillCategoryDto = UpdateDTO<SkillCategory>;

// Legacy interface for backwards compatibility
export interface ProfileSkillWithCategory extends ProfileSkill {
  skill_name?: string;
  skill_description?: string;
}
