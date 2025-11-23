import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class SkillCategoryDeleteOperation {
  static async delete(id: string): Promise<void> {
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
}
