import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class ProfileSkillDeleteOperation {
  static async delete(id: string): Promise<void> {
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
