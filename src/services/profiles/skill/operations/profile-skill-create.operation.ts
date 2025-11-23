import prisma from '@/config/prisma';
import type { ProfileSkill, CreateProfileSkillDto } from '@/models/profiles/skill.model';

export class ProfileSkillCreateOperation {
  static async create(data: CreateProfileSkillDto): Promise<ProfileSkill> {
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
