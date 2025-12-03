import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { BatchEnrollment, CreateBatchEnrollmentDto } from '@/types';
import {
  BATCH_ENROLLMENT_STATUSES,
  BatchEnrollmentStatus,
  mapBatchEnrollmentStatusToProfileStage,
} from '@/types/enums';
import { CodeGenerator } from '@/utils/codeGenerator';

export class BatchEnrollmentCreateOperation {
  static async create(data: CreateBatchEnrollmentDto): Promise<BatchEnrollment> {
    return await prisma.$transaction(async (tx) => {
      const batch = await tx.training_batches.findUnique({
        where: { id: data.batch_id ?? undefined },
        select: { max_capacity: true },
      });

      if (!batch) {
        throw new AppError('Training batch not found', 404);
      }

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

      const enrollmentStatus = data.status || BatchEnrollmentStatus.ENROLLED;
      if (!BATCH_ENROLLMENT_STATUSES.includes(enrollmentStatus as BatchEnrollmentStatus)) {
        throw new AppError(
          `Invalid status: ${enrollmentStatus}. Must be one of: ${BATCH_ENROLLMENT_STATUSES.join(', ')}`,
          400
        );
      }

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

      // Update candidate code from BSC to BST when enrolling in training
      if (data.profile_id) {
        const profile = await tx.profiles.findUnique({
          where: { id: data.profile_id },
          select: { candidate_code: true },
        });

        // Check if the candidate has a BSC code (candidate code)
        if (profile?.candidate_code?.startsWith('BSC-')) {
          // Generate new trainee code (BST)
          const newCode = await CodeGenerator.generate('trainee');

          // Update the profile with the new code
          await tx.profiles.update({
            where: { id: data.profile_id },
            data: { candidate_code: newCode },
          });
        }
      }

      const newStage = mapBatchEnrollmentStatusToProfileStage(
        enrollmentStatus as BatchEnrollmentStatus
      );
      if (newStage && data.profile_id) {
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: data.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

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
}
