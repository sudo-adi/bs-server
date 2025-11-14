import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type {
  CreateProfileSkillDto,
  CreateSkillCategoryDto,
  ProfileSkill,
  SkillCategory,
  UpdateProfileSkillDto,
  UpdateSkillCategoryDto,
  VerifySkillDto,
} from '@/models/profiles/skill.model';

export class SkillService {
  // === Skill Categories ===
  async getAllSkillCategories(activeOnly = false): Promise<SkillCategory[]> {
    const categories = await prisma.skill_categories.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  async createSkillCategory(data: CreateSkillCategoryDto): Promise<SkillCategory> {
    const category = await prisma.skill_categories.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
      },
    });

    return category;
  }

  async updateSkillCategory(id: string, data: UpdateSkillCategoryDto): Promise<SkillCategory> {
    // Check if skill category exists
    const existingCategory = await prisma.skill_categories.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new AppError('Skill category not found', 404);
    }

    // Build update data object
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const category = await prisma.skill_categories.update({
      where: { id },
      data: updateData,
    });

    return category;
  }

  async deleteSkillCategory(id: string): Promise<void> {
    // Check if skill category exists
    const existingCategory = await prisma.skill_categories.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new AppError('Skill category not found', 404);
    }

    await prisma.skill_categories.delete({
      where: { id },
    });
  }

  // === Profile Skills ===
  async getProfileSkills(profileId: string): Promise<ProfileSkill[]> {
    const skills = await prisma.profile_skills.findMany({
      where: { profile_id: profileId },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
      include: {
        skill_categories: true,
        profiles: true,
      },
    });

    return skills;
  }

  async addProfileSkill(data: CreateProfileSkillDto): Promise<ProfileSkill> {
    const skill = await prisma.profile_skills.create({
      data: {
        profile_id: data.profile_id,
        skill_category_id: data.skill_category_id,
        years_of_experience: data.years_of_experience || 0,
        is_primary: data.is_primary || false,
      },
      include: {
        skill_categories: true,
        profiles: true,
      },
    });

    return skill;
  }

  async updateProfileSkill(id: string, data: UpdateProfileSkillDto): Promise<ProfileSkill> {
    // Check if profile skill exists
    const existingSkill = await prisma.profile_skills.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      throw new AppError('Profile skill not found', 404);
    }

    // Build update data object
    const updateData: any = {};

    if (data.skill_category_id !== undefined)
      updateData.skill_category_id = data.skill_category_id;
    if (data.years_of_experience !== undefined)
      updateData.years_of_experience = data.years_of_experience;
    if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const skill = await prisma.profile_skills.update({
      where: { id },
      data: updateData,
      include: {
        skill_categories: true,
        profiles: true,
      },
    });

    return skill;
  }

  async verifyProfileSkill(id: string, data: VerifySkillDto): Promise<ProfileSkill> {
    // Check if profile skill exists
    const existingSkill = await prisma.profile_skills.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      throw new AppError('Profile skill not found', 404);
    }

    const skill = await prisma.profile_skills.update({
      where: { id },
      data: {
        verified_by_user_id: data.verified_by_user_id,
        verified_at: new Date(),
      },
      include: {
        skill_categories: true,
        profiles: true,
      },
    });

    return skill;
  }

  async deleteProfileSkill(id: string): Promise<void> {
    // Check if profile skill exists
    const existingSkill = await prisma.profile_skills.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      throw new AppError('Profile skill not found', 404);
    }

    await prisma.profile_skills.delete({
      where: { id },
    });
  }
}

export default new SkillService();
