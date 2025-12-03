import prisma from '@/config/prisma';

export class PortalProjectsQuery {
  /**
   * Get candidate's matched projects
   * Returns all projects where the candidate has been matched/shared
   */
  static async getMatchedProjects(profileId: string) {
    const matchedProjects = await prisma.project_worker_assignments.findMany({
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
        users_assigned_by: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return matchedProjects.map((match) => ({
      id: match.id,
      created_at: match.created_at,
      deployed_date: match.deployed_date,
      onboarded_date: match.onboarded_date,
      assigned_by: match.users_assigned_by?.full_name || null,
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
