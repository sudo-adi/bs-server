import prisma from '@/config/prisma';

export class PortalDashboardQuery {
  /**
   * Get candidate's dashboard summary
   * Returns counts and recent activities
   */
  static async getDashboardSummary(profileId: string) {
    // Get counts
    const [matchedProjectsCount, trainingEnrollmentsCount, employmentCount] = await Promise.all([
      prisma.project_worker_assignments.count({
        where: { profile_id: profileId },
      }),
      prisma.batch_enrollments.count({
        where: { profile_id: profileId },
      }),
      prisma.project_worker_assignments.count({
        where: { profile_id: profileId },
      }),
    ]);

    // Get current training
    const currentTraining = await prisma.batch_enrollments.findFirst({
      where: {
        profile_id: profileId,
        status: {
          in: ['enrolled', 'in_progress'],
        },
      },
      include: {
        training_batches: {
          include: {
            trainer_batch_assignments: {
              where: {
                is_active: true,
              },
              include: {
                trainers: {
                  include: {
                    profiles: {
                      select: {
                        first_name: true,
                        last_name: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        enrollment_date: 'desc',
      },
    });

    // Get current employment
    const currentEmployment = await prisma.project_worker_assignments.findFirst({
      where: {
        profile_id: profileId,
      },
      include: {
        projects: {
          include: {
            employers: {
              select: {
                company_name: true,
              },
            },
          },
        },
      },
      orderBy: {},
    });

    // Calculate days left for current training
    let trainingDaysLeft = null;
    if (currentTraining?.training_batches?.end_date) {
      const now = new Date();
      const endDate = new Date(currentTraining.training_batches.end_date);
      const diffTime = endDate.getTime() - now.getTime();
      trainingDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      counts: {
        matched_projects: matchedProjectsCount,
        training_enrollments: trainingEnrollmentsCount,
        employment_history: employmentCount,
      },
      current_training: currentTraining
        ? {
            batch_name: currentTraining.training_batches?.name,
            program_name: currentTraining.training_batches?.program_name,
            trainer_name: currentTraining.training_batches?.trainers?.name,
            start_date: currentTraining.training_batches?.start_date,
            end_date: currentTraining.training_batches?.end_date,
            days_left: trainingDaysLeft,
            status: currentTraining.status,
          }
        : null,
      current_employment: currentEmployment
        ? {
            project_name: currentEmployment.projects?.name,
            project_location: currentEmployment.projects?.location,
            employer_name: currentEmployment.projects?.employers?.company_name,
            deployed_date: currentEmployment.deployed_date,
            onboarded_date: currentEmployment.onboarded_date,
          }
        : null,
    };
  }
}
