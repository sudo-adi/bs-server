import prisma from '@/config/prisma';
import type { ProfileSkill } from '@/types';

export class ProfileSkillQuery {
  static async getProfileSkills(profileId: string): Promise<ProfileSkill[]> {
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
}
