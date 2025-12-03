import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';

export class ProfileTrainingQuery {
  /**
   * Get profiles by training batch or trainer name
   */
  static async getProfilesByTraining(filters: {
    trainer_name?: string;
    training_batch_id?: string;
    has_batch_enrollment?: boolean;
    isActive?: boolean;
    isBlacklisted?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: profiles[]; total: number }> {
    const where: any = {
      deleted_at: null,
    };

    // Build batch_enrollments filter based on provided criteria
    // Include enrolled, in_progress (ongoing), and completed (trained) statuses
    const batchEnrollmentFilter: any = {
      status: {
        in: ['enrolled', 'in_progress', 'ongoing', 'completed'],
      },
    };

    // Add specific batch filter if provided
    if (filters.training_batch_id) {
      batchEnrollmentFilter.batch_id = filters.training_batch_id;
    }

    // Add trainer filter if provided
    if (filters.trainer_name) {
      batchEnrollmentFilter.training_batches = {
        trainers: {
          name: {
            contains: filters.trainer_name,
            mode: 'insensitive',
          },
        },
      };
    }

    // Apply batch enrollment filter
    // If has_batch_enrollment is explicitly true, or if any training-specific filters are provided
    if (filters.has_batch_enrollment || filters.training_batch_id || filters.trainer_name) {
      where.batch_enrollments = {
        some: batchEnrollmentFilter,
      };
    }

    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters.isBlacklisted !== undefined) {
      where.profile_blacklist = filters.isBlacklisted
        ? { some: { is_active: true } }
        : { none: { is_active: true } };
    }

    if (filters.search) {
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
        // COMMENTED OUT - Will implement project assignments later
        // project_worker_assignments: {
        //   where: {
        //     project_id: { not: null },
        //   },
        //   include: {
        //     projects: {
        //       select: {
        //         name: true,
        //       },
        //     },
        //   },
        //   orderBy: { created_at: 'desc' },
        //   take: 1,
        // },
        batch_enrollments: {
          where: {
            status: {
              in: ['enrolled', 'in_progress', 'ongoing', 'completed'],
            },
          },
          include: {
            training_batches: {
              include: {
                trainers: true,
              },
            },
          },
          orderBy: { enrollment_date: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    });

    // Transform profiles with training batch data
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
        current_project_name: null,
        current_deployment_start_date: null,
        current_deployment_end_date: null,
        batch_enrollments: enrichedBatchEnrollments,
        stage_transitions: undefined,
        profile_blacklist: undefined,
        project_worker_assignments: undefined,
      };
    });

    return {
      profiles: profilesWithStage,
      total,
    };
  }
}
