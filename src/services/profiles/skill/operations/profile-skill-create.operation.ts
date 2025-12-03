import prisma from '@/config/prisma';
import type { CreateProfileSkillDto, ProfileSkill } from '@/types';
import { AppError } from '@/middlewares/errorHandler';

export class ProfileSkillCreateOperation {
  static async create(data: CreateProfileSkillDto): Promise<ProfileSkill> {
    // Validate skill_category_id is provided
    if (!data.skill_category_id) {
      throw new AppError('Skill category ID is required.', 400);
    }

    // Validate skill_category_id exists and is active
    const skillCategory = await prisma.skill_categories.findFirst({
      where: {
        id: data.skill_category_id,
        is_active: true,
      },
    });

    if (!skillCategory) {
      throw new AppError(
        'Invalid skill category. Please select a valid skill category from the system.',
        400
      );
    }

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
}
