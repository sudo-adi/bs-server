import prisma from '@/config/prisma';

export class PortalProjectsQuery {
  /**
   * Get candidate's matched projects
   * Returns all projects where the candidate has been matched/shared
   */
  static async getMatchedProjects(profileId: string) {
    const matchedProjects = await prisma.project_matched_profiles.findMany({
      where: {
        profile_id: profileId,
      },
      include: {
        projects: {
          include: {
            employers: {
              select: {
                company_name: true,
                client_name: true,
                phone: true,
              },
            },
          },
        },
        skill_categories: {
          select: {
            name: true,
            description: true,
          },
        },
        users: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        shared_at: 'desc',
      },
    });

    return matchedProjects.map((match) => ({
      id: match.id,
      status: match.status,
      shared_at: match.shared_at,
      shared_by: match.users?.full_name || null,
      skill_category: match.skill_categories?.name || null,
      project: {
        id: match.projects.id,
        code: match.projects.code,
        name: match.projects.name,
        location: match.projects.location,
        start_date: match.projects.start_date,
        end_date: match.projects.end_date,
        status: match.projects.status,
        description: match.projects.description,
        employer: {
          company_name: match.projects.employers?.company_name || null,
          client_name: match.projects.employers?.client_name || null,
          phone: match.projects.employers?.phone || null,
        },
      },
    }));
  }
}
