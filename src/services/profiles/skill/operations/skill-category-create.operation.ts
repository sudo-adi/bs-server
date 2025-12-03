import prisma from '@/config/prisma';
import type { CreateSkillCategoryDto, SkillCategory } from '@/types';

export class SkillCategoryCreateOperation {
  static async create(data: CreateSkillCategoryDto): Promise<SkillCategory> {
    const category = await prisma.skill_categories.create({
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
      },
    });

    return category;
  }
}
