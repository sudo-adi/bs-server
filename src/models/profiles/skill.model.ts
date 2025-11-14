import type { profile_skills, profiles, skill_categories } from '@/generated/prisma';

// Re-export Skill Category type from Prisma
export type SkillCategory = skill_categories;

// Re-export Profile Skill type from Prisma
export type ProfileSkill = profile_skills & {
  skill_categories?: skill_categories | null;
  profiles?: profiles | null;
};

// DTOs for Skill Categories
export interface CreateSkillCategoryDto {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSkillCategoryDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// DTOs for Profile Skills
export interface CreateProfileSkillDto {
  profile_id: string;
  skill_category_id: string;
  years_of_experience?: number;
  is_primary?: boolean;
}

export interface UpdateProfileSkillDto {
  skill_category_id?: string;
  years_of_experience?: number;
  is_primary?: boolean;
}

export interface VerifySkillDto {
  verified_by_user_id: string;
}

// Legacy interface for backwards compatibility with old code that used skill_name
export interface ProfileSkillWithCategory extends ProfileSkill {
  skill_name?: string;
  skill_description?: string;
}
