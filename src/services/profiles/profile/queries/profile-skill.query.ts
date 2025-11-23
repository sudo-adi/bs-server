import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';

export class ProfileSkillQuery {
  /**
   * Get profiles by skill category
   */
  static async getProfilesBySkill(
    skillCategoryId: string,
    additionalFilters?: any
  ): Promise<{ profiles: profiles[]; total: number }> {
    const where: any = {
      deleted_at: null,
      profile_skills: {
        some: {
          skill_category_id: skillCategoryId,
        },
      },
    };

    if (additionalFilters?.isActive !== undefined) {
      where.is_active = additionalFilters.isActive;
    }

    if (additionalFilters?.isBlacklisted !== undefined) {
      where.profile_blacklist = additionalFilters.isBlacklisted
        ? { some: { is_active: true } }
        : { none: { is_active: true } };
    }

    if (additionalFilters?.search) {
      where.OR = [
        { first_name: { contains: additionalFilters.search, mode: 'insensitive' } },
        { last_name: { contains: additionalFilters.search, mode: 'insensitive' } },
        { phone: { contains: additionalFilters.search, mode: 'insensitive' } },
        { candidate_code: { contains: additionalFilters.search, mode: 'insensitive' } },
        { email: { contains: additionalFilters.search, mode: 'insensitive' } },
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
        project_assignments: {
          where: {
            status: 'deployed', // Only get currently deployed assignments
          },
          include: {
            projects: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { deployment_date: 'desc' },
          take: 1, // Get the most recent deployment
        },
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
      take: additionalFilters?.limit,
      skip: additionalFilters?.offset,
    });

    // Add current_stage, is_blacklisted, project info, and training batch info
    const profilesWithStage = profiles.map((profile: any) => {
      const currentAssignment = profile.project_assignments?.[0];
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
        current_project_name: currentAssignment?.projects?.name || null,
        current_deployment_start_date: currentAssignment?.deployment_date || null,
        current_deployment_end_date:
          currentAssignment?.actual_end_date || currentAssignment?.expected_end_date || null,
        batch_enrollments: enrichedBatchEnrollments,
        stage_transitions: undefined,
        profile_blacklist: undefined,
        project_assignments: undefined,
      };
    });

    return {
      profiles: profilesWithStage,
      total,
    };
  }
}
