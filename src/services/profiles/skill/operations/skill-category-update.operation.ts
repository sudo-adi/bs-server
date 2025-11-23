import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { SkillCategory, UpdateSkillCategoryDto } from '@/models/profiles/skill.model';

export class SkillCategoryUpdateOperation {
  static async update(id: string, data: UpdateSkillCategoryDto): Promise<SkillCategory> {
    const existingCategory = await prisma.skill_categories.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new AppError('Skill category not found', 404);
    }

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
}
