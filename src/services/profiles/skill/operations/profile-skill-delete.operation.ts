import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProfileSkillDeleteOperation {
  static async delete(id: string): Promise<void> {
    const existingSkill = await prisma.profile_skills.findUnique({
      where: { id },
      include: { skill_categories: true },
    });

    if (!existingSkill) {
      throw new AppError('Profile skill not found', 404);
    }

    // Trainers are now automatically derived from profiles with "Trainer" as primary skill
    // No need to manage a separate trainer record

    await prisma.profile_skills.delete({
      where: { id },
    });
  }
}
