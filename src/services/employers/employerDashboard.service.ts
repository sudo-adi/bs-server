import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectStatus } from '@/types/enums';

export class EmployerDashboardService {
  /**
   * Get employer dashboard overview with projects and statistics
   */
  async getDashboardOverview(employerId: string) {
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: employerId, deleted_at: null },
    });

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    // Get all projects for this employer
    const projects = await prisma.projects.findMany({
      where: {
        employer_id: employerId,
        deleted_at: null,
      },
      include: {
        // Show shared workers instead of deployed workers
        project_matched_profiles: {
          where: {
            status: 'shared',
          },
          include: {
            profiles: {
              select: {
                id: true,
                candidate_code: true,
                first_name: true,
                last_name: true,
                phone: true,
              },
            },
            skill_categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project_resource_requirements: {
          include: {
            skill_categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Get project requests
    const projectRequests = await prisma.project_requests.findMany({
      where: {
        employer_id: employerId,
      },
      include: {
        project_request_requirements: {
          include: {
            skill_categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate statistics
    const stats = {
      total_projects: projects.length,
      active_projects: projects.filter((p) => p.status === ProjectStatus.ACTIVE).length,
      allocated_projects: projects.filter((p) => p.status === ProjectStatus.ALLOCATED).length,
      completed_projects: projects.filter((p) => p.status === ProjectStatus.COMPLETED).length,
      pending_projects: projects.filter((p) => p.status === ProjectStatus.PLANNING).length,
      total_workers: projects.reduce((sum, p) => sum + ((p as any).project_matched_profiles?.length || 0), 0),
      pending_requests: projectRequests.filter((r) => r.status === 'pending').length,
      approved_requests: projectRequests.filter((r) => r.status === 'project_created').length,
    };

    return {
      employer: {
        id: employer.id,
        employer_code: employer.employer_code,
        company_name: employer.company_name,
        client_name: employer.client_name,
        email: employer.email,
        phone: employer.phone,
        is_verified: employer.is_verified,
      },
      stats,
      projects,
      projectRequests,
    };
  }

  /**
   * Get detailed project information including workers and timeline
   */
  async getProjectDetails(employerId: string, projectId: string) {
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: employerId, deleted_at: null },
    });

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    // Get project with all details
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        employer_id: employerId,
        deleted_at: null,
      },
      include: {
        // Show shared workers instead of deployed workers
        project_matched_profiles: {
          where: {
            status: 'shared',
          },
          include: {
            profiles: {
              select: {
                id: true,
                candidate_code: true,
                first_name: true,
                last_name: true,
                phone: true,
                date_of_birth: true,
                addresses: {
                  where: {
                    is_current: true,
                  },
                  select: {
                    house_number: true,
                    village_or_city: true,
                    district: true,
                    state: true,
                    postal_code: true,
                    landmark: true,
                    police_station: true,
                    post_office: true,
                  },
                  take: 1,
                },
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
        },
        project_resource_requirements: {
          include: {
            skill_categories: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        employers: {
          select: {
            id: true,
            employer_code: true,
            company_name: true,
            client_name: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Calculate project timeline metrics
    const now = new Date();
    const startDate = project.start_date ? new Date(project.start_date) : null;
    const endDate = project.end_date ? new Date(project.end_date) : null;

    let daysElapsed = 0;
    let daysRemaining = 0;
    let totalDays = 0;
    let progressPercentage = 0;

    if (startDate && endDate) {
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (now >= startDate) {
        daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (now < endDate) {
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (totalDays > 0) {
        progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
      }
    }

    // Calculate worker stats from shared profiles
    const workerStats = {
      total_shared: (project as any).project_matched_profiles?.length || 0,
    };

    // Helper function to calculate age from date of birth
    const calculateAge = (dateOfBirth: Date | null): number | null => {
      if (!dateOfBirth) return null;
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Enrich shared workers with calculated age and formatted address
    const enrichedWorkers = ((project as any).project_matched_profiles || []).map((matchedProfile: any) => {
      const profile = matchedProfile.profiles;
      const currentAddress = profile?.addresses?.[0];

      // Format full address
      let fullAddress = null;
      if (currentAddress) {
        const addressParts = [
          currentAddress.house_number,
          currentAddress.village_or_city,
          currentAddress.district,
          currentAddress.state,
          currentAddress.postal_code,
        ].filter(Boolean);
        fullAddress = addressParts.join(', ');
      }

      return {
        id: matchedProfile.id,
        candidate_code: profile?.candidate_code,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        phone: profile?.phone,
        age: calculateAge(profile?.date_of_birth),
        address: fullAddress,
        current_address: currentAddress,
        skill_matched_for: matchedProfile.skill_categories?.name,
        skill_category_id: matchedProfile.skill_category_id,
        shared_at: matchedProfile.shared_at,
      };
    });

    return {
      project: {
        ...project,
        shared_workers: enrichedWorkers,
        project_matched_profiles: undefined, // Remove from response
      },
      timeline: {
        start_date: startDate,
        end_date: endDate,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        total_days: totalDays,
        progress_percentage: Math.round(progressPercentage),
      },
      worker_stats: workerStats,
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
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: employerId, deleted_at: null },
    });

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    const where: any = {
      employer_id: employerId,
      deleted_at: null,
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
          project_matched_profiles: {
            where: {
              status: 'shared',
            },
            select: {
              id: true,
              skill_category_id: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.projects.count({ where }),
    ]);

    // Calculate timeline for each project
    const projectsWithTimeline = projects.map((project) => {
      const now = new Date();
      const endDate = project.end_date ? new Date(project.end_date) : null;

      let daysRemaining = 0;
      if (endDate && now < endDate) {
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...project,
        days_remaining: daysRemaining,
        shared_workers_count: (project as any).project_matched_profiles?.length || 0,
        project_matched_profiles: undefined, // Remove from response
      };
    });

    return {
      projects: projectsWithTimeline,
      total,
    };
  }
}

export default new EmployerDashboardService();
