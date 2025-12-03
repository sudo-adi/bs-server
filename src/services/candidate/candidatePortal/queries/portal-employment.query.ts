import prisma from '@/config/prisma';

export class PortalEmploymentQuery {
  /**
   * Get candidate's employment/project assignment history
   * Returns current, past, and all project deployments
   */
  static async getEmploymentHistory(profileId: string) {
    const assignments = await prisma.project_worker_assignments.findMany({
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
        users_assigned_by: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        deployed_date: 'desc',
      },
    });

    const now = new Date();

    // Categorize assignments based on removed_at field
    const current = assignments.filter((a) => !a.removed_at && a.deployed_date);

    const past = assignments.filter((a) => a.removed_at);

    const mapAssignment = (assignment: any) => {
      let daysWorked = null;
      if (assignment.deployed_date) {
        const startDate = new Date(assignment.deployed_date);
        const endDate = assignment.removed_at ? new Date(assignment.removed_at) : now;
        const diffTime = endDate.getTime() - startDate.getTime();
        daysWorked = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: assignment.id,
        deployed_date: assignment.deployed_date,
        onboarded_date: assignment.onboarded_date,
        removed_at: assignment.removed_at,
        removal_reason: assignment.removal_reason,
        days_worked: daysWorked,
        assigned_by: assignment.users_assigned_by?.full_name || null,
        project: {
          id: assignment.projects.id,
          code: assignment.projects.code,
          name: assignment.projects.name,
          location: assignment.projects.location,
          status: assignment.projects.status,
          description: assignment.projects.description,
          is_accommodation_provided: assignment.projects.is_accommodation_provided,
          employer: {
            company_name: assignment.projects.employers?.company_name || null,
            client_name: assignment.projects.employers?.client_name || null,
            phone: assignment.projects.employers?.phone || null,
          },
        },
      };
    };

    return {
      current: current.map(mapAssignment),
      past: past.map(mapAssignment),
      total: assignments.length,
    };
  }
}
