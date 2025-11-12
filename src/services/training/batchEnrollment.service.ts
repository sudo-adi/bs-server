import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  BatchEnrollment,
  BatchEnrollmentWithDetails,
  CreateBatchEnrollmentDto,
  UpdateBatchEnrollmentDto,
} from '@/models/training/batchEnrollment.model';
import { Prisma } from '@/generated/prisma';
import {
  BatchEnrollmentStatus,
  BATCH_ENROLLMENT_STATUSES,
  mapBatchEnrollmentStatusToProfileStage,
} from '@/types/enums';

export class BatchEnrollmentService {
  async getAllEnrollments(
    filters?: {
      batch_id?: string;
      profile_id?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
    includeDetails = false
  ): Promise<{ enrollments: BatchEnrollmentWithDetails[]; total: number }> {
    const where: Prisma.batch_enrollmentsWhereInput = {};

    if (filters?.batch_id) {
      where.batch_id = filters.batch_id;
    }

    if (filters?.profile_id) {
      where.profile_id = filters.profile_id;
    }

    if (filters?.status) {
      // Validate status
      if (!BATCH_ENROLLMENT_STATUSES.includes(filters.status as BatchEnrollmentStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${BATCH_ENROLLMENT_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.batch_enrollments.findMany({
        where,
        include: includeDetails
          ? {
              profiles: {
                include: {
                  profile_skills: {
                    where: { is_primary: true },
                    take: 1,
                    include: {
                      skill_categories: true,
                    },
                  },
                },
              },
              training_batches: true,
            }
          : undefined,
        orderBy: { enrollment_date: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.batch_enrollments.count({ where }),
    ]);

    // Add primary skill info to enrollment objects if details are included
    const enrichedEnrollments = enrollments.map((enrollment) => {
      const enriched = enrollment as BatchEnrollmentWithDetails;
      if (includeDetails && enriched.profiles?.profile_skills?.[0]) {
        const primarySkill = enriched.profiles.profile_skills[0];
        enriched.primary_skill_category_id = primarySkill.skill_category_id || undefined;
        enriched.primary_skill_category_name = primarySkill.skill_categories?.name || undefined;
      }
      return enriched;
    });

    return {
      enrollments: enrichedEnrollments,
      total,
    };
  }

  async getEnrollmentById(id: string, includeDetails = false): Promise<BatchEnrollmentWithDetails> {
    const enrollment = await prisma.batch_enrollments.findUnique({
      where: { id },
      include: includeDetails
        ? {
            profiles: {
              include: {
                profile_skills: {
                  where: { is_primary: true },
                  take: 1,
                  include: {
                    skill_categories: true,
                  },
                },
              },
            },
            training_batches: true,
          }
        : undefined,
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    // Add primary skill info if details are included
    const enriched = enrollment as BatchEnrollmentWithDetails;
    if (includeDetails && enriched.profiles?.profile_skills?.[0]) {
      const primarySkill = enriched.profiles.profile_skills[0];
      enriched.primary_skill_category_id = primarySkill.skill_category_id || undefined;
      enriched.primary_skill_category_name = primarySkill.skill_categories?.name || undefined;
    }

    return enriched;
  }

  async createEnrollment(data: CreateBatchEnrollmentDto): Promise<BatchEnrollment> {
    // Use Prisma transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // Check if batch exists and has capacity
      const batch = await tx.training_batches.findUnique({
        where: { id: data.batch_id },
        select: { max_capacity: true },
      });

      if (!batch) {
        throw new AppError('Training batch not found', 404);
      }

      // Get current enrollment count (active enrollments only)
      const currentEnrolled = await tx.batch_enrollments.count({
        where: {
          batch_id: data.batch_id,
          status: {
            notIn: [BatchEnrollmentStatus.DROPPED, BatchEnrollmentStatus.FAILED],
          },
        },
      });

      if (batch.max_capacity && currentEnrolled >= batch.max_capacity) {
        throw new AppError('Training batch is full', 400);
      }

      // Check if profile is already enrolled
      const existing = await tx.batch_enrollments.findFirst({
        where: {
          batch_id: data.batch_id,
          profile_id: data.profile_id,
          status: {
            notIn: [BatchEnrollmentStatus.DROPPED, BatchEnrollmentStatus.FAILED],
          },
        },
      });

      if (existing) {
        throw new AppError('Profile is already enrolled in this batch', 400);
      }

      // Validate status if provided
      const enrollmentStatus = data.status || BatchEnrollmentStatus.ENROLLED;
      if (!BATCH_ENROLLMENT_STATUSES.includes(enrollmentStatus as BatchEnrollmentStatus)) {
        throw new AppError(
          `Invalid status: ${enrollmentStatus}. Must be one of: ${BATCH_ENROLLMENT_STATUSES.join(', ')}`,
          400
        );
      }

      // Create the enrollment
      const enrollment = await tx.batch_enrollments.create({
        data: {
          batch_id: data.batch_id,
          profile_id: data.profile_id,
          enrollment_date: data.enrollment_date || new Date(),
          status: enrollmentStatus,
          notes: data.notes,
          enrolled_by_user_id: data.enrolled_by_user_id,
        },
      });

      // Update profile stage based on enrollment status
      const newStage = mapBatchEnrollmentStatusToProfileStage(enrollmentStatus as BatchEnrollmentStatus);
      if (newStage && data.profile_id) {
        // Get current stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: data.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        // Create stage transition (this is the source of truth for current stage)
        await tx.stage_transitions.create({
          data: {
            profile_id: data.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: newStage,
            transitioned_by_user_id: data.enrolled_by_user_id,
            notes: `Enrolled in training batch with status: ${enrollmentStatus}`,
          },
        });
      }

      return enrollment;
    });
  }

  async updateEnrollment(id: string, data: UpdateBatchEnrollmentDto): Promise<BatchEnrollment> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Validate status if provided
    if (data.status && !BATCH_ENROLLMENT_STATUSES.includes(data.status as BatchEnrollmentStatus)) {
      throw new AppError(
        `Invalid status: ${data.status}. Must be one of: ${BATCH_ENROLLMENT_STATUSES.join(', ')}`,
        400
      );
    }

    try {
      // Use transaction to update enrollment and sync profile stage
      const result = await prisma.$transaction(async (tx) => {
        // Get current enrollment to check for status change
        const currentEnrollment = await tx.batch_enrollments.findUnique({
          where: { id },
        });

        if (!currentEnrollment) {
          throw new AppError('Enrollment not found', 404);
        }

        // Update the enrollment
        const enrollment = await tx.batch_enrollments.update({
          where: { id },
          data,
        });

        // If status changed, update profile stage accordingly
        if (data.status && data.status !== currentEnrollment.status && enrollment.profile_id) {
          const newStage = mapBatchEnrollmentStatusToProfileStage(data.status as BatchEnrollmentStatus);

          if (newStage) {
            // Get current stage from stage_transitions
            const latestTransition = await tx.stage_transitions.findFirst({
              where: { profile_id: enrollment.profile_id },
              orderBy: { transitioned_at: 'desc' },
              select: { to_stage: true },
            });

            // Create stage transition (this is the source of truth for current stage)
            await tx.stage_transitions.create({
              data: {
                profile_id: enrollment.profile_id,
                from_stage: latestTransition?.to_stage || null,
                to_stage: newStage,
                notes: `Batch enrollment status changed to: ${data.status}`,
              },
            });
          }
        }

        return enrollment;
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Enrollment not found', 404);
      }
      throw error;
    }
  }

  async deleteEnrollment(id: string): Promise<void> {
    try {
      await prisma.batch_enrollments.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Enrollment not found', 404);
      }
      throw error;
    }
  }
}

export default new BatchEnrollmentService();
