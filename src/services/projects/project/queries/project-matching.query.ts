import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectMatchedProfileStatus } from '@/types/enums';

export class ProjectMatchingQuery {
  /**
   * Get matched profiles for a project
   */
  static async getMatchedProfiles(projectId: string): Promise<any> {
    const project = await prisma.projects.findUnique({ where: { id: projectId } });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    const matchedProfiles = await prisma.project_matched_profiles.findMany({
      where: { project_id: projectId },
      include: {
        profiles: {
          include: {
            profile_skills: {
              include: { skill_categories: true },
            },
          },
        },
        skill_categories: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return matchedProfiles;
  }

  /**
   * Get shared profiles for a project (for employer view)
   */
  static async getSharedProfiles(projectId: string): Promise<any> {
    const sharedProfiles = await prisma.project_matched_profiles.findMany({
      where: {
        project_id: projectId,
        status: ProjectMatchedProfileStatus.SHARED,
      },
      include: {
        profiles: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            candidate_code: true,
            phone: true,
            email: true,
            profile_photo_url: true,
          },
        },
        skill_categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const groupedBySkill: Record<string, any> = {};

    sharedProfiles.forEach((matchedProfile: any) => {
      const skillName = matchedProfile.skill_categories.name;

      if (!groupedBySkill[skillName]) {
        groupedBySkill[skillName] = {
          skill_id: matchedProfile.skill_categories.id,
          skill_name: skillName,
          profiles: [],
        };
      }

      groupedBySkill[skillName].profiles.push({
        id: matchedProfile.id,
        profile_id: matchedProfile.profiles.id,
        first_name: matchedProfile.profiles.first_name,
        last_name: matchedProfile.profiles.last_name,
        candidate_code: matchedProfile.profiles.candidate_code,
        phone: matchedProfile.profiles.phone,
        email: matchedProfile.profiles.email,
        profile_photo_url: matchedProfile.profiles.profile_photo_url,
        status: matchedProfile.status,
        shared_at: matchedProfile.shared_at,
      });
    });

    return {
      project_id: projectId,
      skills: Object.values(groupedBySkill),
      total_profiles: sharedProfiles.length,
    };
  }
}
