import prisma from '@/config/prisma';

export class EmployerDashboardService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get employer dashboard overview with projects and statistics
   */
  async getDashboardOverview(employerId: string) {
    const projects = await prisma.projects.findMany({
      where: {
        employer_id: employerId,
        is_active: true,
      },
      include: {
        project_worker_assignments: {
          where: {
            removed_at: null,
            onboarded_date: { not: null }, // Only shared workers
          },
        },
      },
    });

    return {
      total_projects: projects.length,
      active_projects: projects.filter((p) => p.status === 'ongoing').length,
      total_workers: projects.reduce((sum, p) => sum + p.project_worker_assignments.length, 0),
      projects: projects.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        location: p.location,
        start_date: p.start_date,
        end_date: p.end_date,
        shared_workers_count: p.project_worker_assignments.length,
      })),
    };
  }

  /**
   * Get detailed project information including shared workers, financial details and timeline
   */
  async getProjectDetails(employerId: string, projectId: string) {
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        employer_id: employerId,
      },
      include: {
        project_financials: true,
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
        project_worker_assignments: {
          where: {
            removed_at: null,
            onboarded_date: { not: null }, // Only shared workers
          },
          include: {
            profiles: {
              include: {
                profile_skills: {
                  include: {
                    skill_categories: true,
                  },
                },
                addresses: {
                  where: {
                    is_current: true,
                  },
                },
              },
            },
            skill_categories: true,
          },
          orderBy: {
            onboarded_date: 'desc',
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Transform shared workers data
    const sharedWorkers = project.project_worker_assignments.map((assignment) => {
      const currentAddress = assignment.profiles.addresses?.[0];
      const addressString = currentAddress
        ? [
            currentAddress.house_number,
            currentAddress.village_or_city,
            currentAddress.district,
            currentAddress.state,
            currentAddress.postal_code,
          ]
            .filter(Boolean)
            .join(', ')
        : null;

      return {
        id: assignment.id,
        first_name: assignment.profiles.first_name,
        last_name: assignment.profiles.last_name,
        candidate_code: assignment.profiles.candidate_code,
        phone: assignment.profiles.phone,
        email: assignment.profiles.email,
        age: assignment.profiles.date_of_birth
          ? Math.floor(
              (new Date().getTime() - new Date(assignment.profiles.date_of_birth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null,
        address: addressString,
        skill_matched_for: assignment.skill_categories?.name || 'Unknown',
        shared_at: assignment.onboarded_date,
        deployed_date: assignment.deployed_date,
      };
    });

    return {
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description,
        location: project.location,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        deployment_date: project.deployment_date,
        award_date: project.award_date,
        revised_completion_date: project.revised_completion_date,
        contact_phone: project.contact_phone,
        project_manager: project.project_manager,
        po_co_number: project.po_co_number,
        is_accommodation_provided: project.is_accommodation_provided,
        // Financial details
        financials: project.project_financials
          ? {
              contract_value: project.project_financials.contract_value,
              revised_contract_value: project.project_financials.revised_contract_value,
              variation_order_value: project.project_financials.variation_order_value,
              budget: project.project_financials.budget,
            }
          : null,
        // Resource requirements
        resource_requirements: project.project_resource_requirements.map((req) => ({
          skill_category: req.skill_categories?.name || 'Unknown',
          required_count: req.required_count,
          allocated_count: sharedWorkers.filter(
            (w) => w.skill_matched_for === req.skill_categories?.name
          ).length,
        })),
        shared_workers: sharedWorkers,
      },
      worker_stats: {
        total_shared: sharedWorkers.length,
        deployed: sharedWorkers.filter((w) => w.deployed_date).length,
        pending_deployment: sharedWorkers.filter((w) => !w.deployed_date).length,
      },
    };
  }

  /**
   * Get list of projects for employer with basic info
   */
  async getEmployerProjects(
    employerId: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = {
      employer_id: employerId,
      is_active: true,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          project_worker_assignments: {
            where: {
              removed_at: null,
              onboarded_date: { not: null },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.projects.count({ where }),
    ]);

    return {
      projects: projects.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        location: p.location,
        start_date: p.start_date,
        end_date: p.end_date,
        shared_workers_count: p.project_worker_assignments.length,
        days_remaining:
          p.end_date && p.start_date
            ? Math.max(
                0,
                Math.ceil(
                  (new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                )
              )
            : 0,
      })),
      total,
    };
  }
}

export default new EmployerDashboardService();
