import prisma from '@/config/prisma';

export class PortalTrainingQuery {
  /**
   * Get candidate's training batch enrollments
   * Returns current, upcoming, and past trainings
   */
  static async getTrainingEnrollments(profileId: string) {
    const enrollments = await prisma.batch_enrollments.findMany({
      where: {
        profile_id: profileId,
      },
      include: {
        training_batches: {
          include: {},
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
}
