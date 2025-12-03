import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { ProfileSkill, VerifySkillDto } from '@/types';

export class ProfileSkillVerifyOperation {
  static async verify(id: string, data: VerifySkillDto): Promise<ProfileSkill> {
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
}
