import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';

export class ProfileFiltersQuery {
  /**
   * Get all profiles with filtering (no specific stage/skill/training filters)
   */
  static async getAllProfiles(filters?: {
    isActive?: boolean;
    isBlacklisted?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: profiles[]; total: number }> {
    // Build WHERE clause
    const where: any = {
      deleted_at: null,
    };

    if (filters?.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters?.isBlacklisted !== undefined) {
      where.profile_blacklist = filters.isBlacklisted
        ? { some: { is_active: true } }
        : { none: { is_active: true } };
    }

    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { candidate_code: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.profiles.count({ where });

    const profiles = await prisma.profiles.findMany({
      where,
      include: {
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
        profile_blacklist: {
          where: { is_active: true },
          orderBy: { blacklisted_at: 'desc' },
          take: 1,
        },
        // COMMENTED OUT - Will implement project assignments later with different approach
        // project_worker_assignments: {
        //   where: {
        //     status: 'deployed', // Only get currently deployed assignments
        //   },
        //   include: {
        //     projects: {
        //       select: {
        //         name: true,
        //       },
        //     },
        //   },
        //   orderBy: { deployment_date: 'desc' },
        //   take: 1, // Get the most recent deployment
        // },
        batch_enrollments: {
          where: {
            status: {
              in: ['enrolled', 'in_progress'],
            },
          },
          include: {
            training_batches: true,
          },
          orderBy: { enrollment_date: 'desc' },
          take: 1, // Get the most recent active enrollment
        },
      },
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    const profilesWithStage = profiles.map((profile: any) => {
      // COMMENTED OUT - Will implement project assignments later
      // const currentAssignment = profile.project_worker_assignments?.[0];
      const currentEnrollment = profile.batch_enrollments?.[0];

      // Calculate training days left
      let trainingDaysLeft = null;
      if (currentEnrollment?.training_batches?.end_date) {
        const today = new Date();
        const endDate = new Date(currentEnrollment.training_batches.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        trainingDaysLeft = daysLeft > 0 ? daysLeft : 0;
      }

      // Enrich batch enrollment with calculated field
      const enrichedBatchEnrollments = currentEnrollment
        ? [
            {
              ...currentEnrollment,
              training_days_left: trainingDaysLeft,
            },
          ]
        : [];

      return {
        ...profile,
        current_stage: profile.stage_transitions[0]?.to_stage || null,
        is_blacklisted: profile.profile_blacklist && profile.profile_blacklist.length > 0,
        current_project_name: null, // Temporary - will be implemented later
        current_deployment_start_date: null, // Temporary - will be implemented later
        current_deployment_end_date: null, // Temporary - will be implemented later
        // current_project_name: currentAssignment?.projects?.name || null,
        // current_deployment_start_date: currentAssignment?.deployment_date || null,
        // current_deployment_end_date:
        //   currentAssignment?.actual_end_date || currentAssignment?.expected_end_date || null,
        batch_enrollments: enrichedBatchEnrollments,
        stage_transitions: undefined, // Remove from response
        profile_blacklist: undefined, // Remove from response
        project_worker_assignments: undefined, // Remove from response
      };
    });

    return {
      profiles: profilesWithStage,
      total,
    };
  }
}
