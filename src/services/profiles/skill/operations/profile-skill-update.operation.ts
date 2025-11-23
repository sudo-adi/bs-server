import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { ProfileSkill, UpdateProfileSkillDto } from '@/models/profiles/skill.model';

export class ProfileSkillUpdateOperation {
  static async update(id: string, data: UpdateProfileSkillDto): Promise<ProfileSkill> {
    const existingSkill = await prisma.profile_skills.findUnique({
      where: { id },
    });

    if (!existingSkill) {
      throw new AppError('Profile skill not found', 404);
    }

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
}
