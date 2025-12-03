import prisma from '@/config/prisma';
import type { SkillCategory } from '@/types';

export class SkillCategoryQuery {
  static async getAllSkillCategories(activeOnly = false): Promise<SkillCategory[]> {
    const categories = await prisma.skill_categories.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { name: 'asc' },
    });

    return categories;
  }
}
