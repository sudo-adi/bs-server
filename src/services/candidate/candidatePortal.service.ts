import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class CandidatePortalService {
  /**
   * Get candidate's matched projects
   * Returns all projects where the candidate has been matched/shared
   */
  async getMatchedProjects(profileId: string) {
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

  /**
   * Get candidate's training batch enrollments
   * Returns current, upcoming, and past trainings
   */
  async getTrainingEnrollments(profileId: string) {
    const enrollments = await prisma.batch_enrollments.findMany({
      where: {
        profile_id: profileId,
      },
      include: {
        training_batches: {
          include: {
            skill_categories: {
              select: {
                name: true,
                description: true,
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
        enrollment_date: 'desc',
      },
    });

    const now = new Date();

    // Categorize trainings
    const current = enrollments.filter(
      (e) =>
        e.status === 'in_progress' ||
        (e.status === 'enrolled' &&
          e.training_batches?.start_date &&
          new Date(e.training_batches.start_date) <= now &&
          e.training_batches?.end_date &&
          new Date(e.training_batches.end_date) >= now)
    );

    const upcoming = enrollments.filter(
      (e) =>
        e.status === 'enrolled' &&
        e.training_batches?.start_date &&
        new Date(e.training_batches.start_date) > now
    );

    const past = enrollments.filter(
      (e) =>
        e.status === 'completed' ||
        (e.training_batches?.end_date && new Date(e.training_batches.end_date) < now)
    );

    const mapEnrollment = (enrollment: any) => {
      let daysLeft = null;
      if (enrollment.training_batches?.end_date) {
        const endDate = new Date(enrollment.training_batches.end_date);
        const diffTime = endDate.getTime() - now.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) daysLeft = 0;
      }

      return {
        id: enrollment.id,
        enrollment_date: enrollment.enrollment_date,
        completion_date: enrollment.completion_date,
        status: enrollment.status,
        attendance_percentage: enrollment.attendance_percentage,
        score: enrollment.score,
        notes: enrollment.notes,
        enrolled_by: enrollment.users?.full_name || null,
        days_left: daysLeft,
        batch: {
          id: enrollment.training_batches?.id,
          code: enrollment.training_batches?.code,
          name: enrollment.training_batches?.name,
          program_name: enrollment.training_batches?.program_name,
          provider: enrollment.training_batches?.provider,
          trainer_name: enrollment.training_batches?.trainer_name,
          start_date: enrollment.training_batches?.start_date,
          end_date: enrollment.training_batches?.end_date,
          duration_days: enrollment.training_batches?.duration_days,
          status: enrollment.training_batches?.status,
          location: enrollment.training_batches?.location,
          description: enrollment.training_batches?.description,
          skill_category: enrollment.training_batches?.skill_categories?.name || null,
        },
      };
    };

    return {
      current: current.map(mapEnrollment),
      upcoming: upcoming.map(mapEnrollment),
      past: past.map(mapEnrollment),
      total: enrollments.length,
    };
  }

  /**
   * Get candidate's employment/project assignment history
   * Returns current, past, and all project deployments
   */
  async getEmploymentHistory(profileId: string) {
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
    const current = assignments.filter(
      (a) => a.status === 'deployed' || a.status === 'allocated'
    );

    const past = assignments.filter((a) => a.status === 'completed' || a.status === 'terminated');

    const mapAssignment = (assignment: any) => {
      let daysWorked = null;
      if (assignment.deployment_date) {
        const startDate = new Date(assignment.deployment_date);
        const endDate = assignment.actual_end_date
          ? new Date(assignment.actual_end_date)
          : now;
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

  /**
   * Get candidate's full profile with all details
   * Includes personal info, addresses, qualifications, skills, documents, bank accounts
   */
  async getProfile(profileId: string) {
    const profile = await prisma.profiles.findFirst({
      where: {
        id: profileId,
        deleted_at: null,
      },
      include: {
        addresses: {
          orderBy: { created_at: 'desc' },
        },
        profile_skills: {
          include: {
            skill_categories: true,
          },
          orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
        },
        qualifications: {
          include: {
            qualification_types: true,
            documents: true,
          },
          orderBy: { created_at: 'desc' },
        },
        documents: {
          include: {
            document_categories: true,
          },
          orderBy: { created_at: 'desc' },
        },
        bank_accounts: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
        },
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Get current stage
    const currentStage = (profile as any).stage_transitions[0]?.to_stage || null;

    return {
      ...profile,
      current_stage: currentStage,
      stage_transitions: undefined, // Remove from response
    };
  }

  /**
   * Get candidate's dashboard summary
   * Returns counts and recent activities
   */
  async getDashboardSummary(profileId: string) {
    // Get counts
    const [matchedProjectsCount, trainingEnrollmentsCount, employmentCount] = await Promise.all([
      prisma.project_matched_profiles.count({
        where: { profile_id: profileId },
      }),
      prisma.batch_enrollments.count({
        where: { profile_id: profileId },
      }),
      prisma.project_assignments.count({
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
            skill_categories: {
              select: {
                name: true,
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
    const currentEmployment = await prisma.project_assignments.findFirst({
      where: {
        profile_id: profileId,
        status: 'deployed',
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
      orderBy: {
        deployment_date: 'desc',
      },
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
            trainer_name: currentTraining.training_batches?.trainer_name,
            start_date: currentTraining.training_batches?.start_date,
            end_date: currentTraining.training_batches?.end_date,
            days_left: trainingDaysLeft,
            status: currentTraining.status,
            skill_category: currentTraining.training_batches?.skill_categories?.name || null,
          }
        : null,
      current_employment: currentEmployment
        ? {
            project_name: currentEmployment.projects?.name,
            project_location: currentEmployment.projects?.location,
            employer_name: currentEmployment.projects?.employers?.company_name,
            deployment_date: currentEmployment.deployment_date,
            expected_end_date: currentEmployment.expected_end_date,
            status: currentEmployment.status,
          }
        : null,
    };
  }
}

export default new CandidatePortalService();
