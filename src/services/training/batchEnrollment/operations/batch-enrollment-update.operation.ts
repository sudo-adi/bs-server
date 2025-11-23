import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  BatchEnrollment,
  UpdateBatchEnrollmentDto,
} from '@/models/training/batchEnrollment.model';
import { Prisma } from '@/generated/prisma';
import {
  BatchEnrollmentStatus,
  BATCH_ENROLLMENT_STATUSES,
  mapBatchEnrollmentStatusToProfileStage,
} from '@/types/enums';

export class BatchEnrollmentUpdateOperation {
  static async update(id: string, data: UpdateBatchEnrollmentDto): Promise<BatchEnrollment> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    if (data.status && !BATCH_ENROLLMENT_STATUSES.includes(data.status as BatchEnrollmentStatus)) {
      throw new AppError(
        `Invalid status: ${data.status}. Must be one of: ${BATCH_ENROLLMENT_STATUSES.join(', ')}`,
        400
      );
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const currentEnrollment = await tx.batch_enrollments.findUnique({
          where: { id },
        });

        if (!currentEnrollment) {
          throw new AppError('Enrollment not found', 404);
        }

        const enrollment = await tx.batch_enrollments.update({
          where: { id },
          data,
        });

        if (data.status && data.status !== currentEnrollment.status && enrollment.profile_id) {
          const newStage = mapBatchEnrollmentStatusToProfileStage(data.status as BatchEnrollmentStatus);

          if (newStage) {
            const latestTransition = await tx.stage_transitions.findFirst({
              where: { profile_id: enrollment.profile_id },
              orderBy: { transitioned_at: 'desc' },
              select: { to_stage: true },
            });

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
}
