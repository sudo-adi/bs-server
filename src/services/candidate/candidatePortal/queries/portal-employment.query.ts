import prisma from '@/config/prisma';

export class PortalEmploymentQuery {
  /**
   * Get candidate's employment/project assignment history
   * Returns current, past, and all project deployments
   */
  static async getEmploymentHistory(profileId: string) {
    const assignments = await prisma.project_assignments.findMany({
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
        users: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        deployment_date: 'desc',
      },
    });

    const now = new Date();

    // Categorize assignments
    const current = assignments.filter((a) => a.status === 'deployed' || a.status === 'allocated');

    const past = assignments.filter((a) => a.status === 'completed' || a.status === 'terminated');

    const mapAssignment = (assignment: any) => {
      let daysWorked = null;
      if (assignment.deployment_date) {
        const startDate = new Date(assignment.deployment_date);
        const endDate = assignment.actual_end_date ? new Date(assignment.actual_end_date) : now;
        const diffTime = endDate.getTime() - startDate.getTime();
        daysWorked = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: assignment.id,
        deployment_date: assignment.deployment_date,
        expected_end_date: assignment.expected_end_date,
        actual_end_date: assignment.actual_end_date,
        status: assignment.status,
        days_worked: daysWorked,
        assigned_by: assignment.users?.full_name || null,
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
