import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { generateUuid } from '@/utils/uuidHelper';

export class BatchEnrollmentCreateOperation {
  static async create(data: {
    batch_id?: string;
    profileId?: string;
    enrollment_date?: Date;
    status?: string;
    notes?: string;
    enrolled_by_user_id?: string;
  }): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      const batch = await tx.trainingBatch.findUnique({
        where: { id: data.batch_id ?? undefined },
        select: { maxCapacity: true },
      });

      if (!batch) {
        throw new AppError('Training batch not found', 404);
      }

      const currentEnrolled = await tx.trainingBatchEnrollment.count({
        where: {
          batchId: data.batch_id,
          status: {
            notIn: ['dropped', 'failed'],
          },
        },
      });

      if (batch.maxCapacity && currentEnrolled >= batch.maxCapacity) {
        throw new AppError('Training batch is full', 400);
      }

      const existing = await tx.trainingBatchEnrollment.findFirst({
        where: {
          batchId: data.batch_id,
          profileId: data.profileId,
          status: {
            notIn: ['dropped', 'failed'],
          },
        },
      });

      if (existing) {
        throw new AppError('Profile is already enrolled in this batch', 400);
      }

      const enrollmentStatus = data.status || 'enrolled';

      const enrollment = await tx.trainingBatchEnrollment.create({
        data: {
          id: generateUuid(),
          batchId: data.batch_id,
          profileId: data.profileId,
          enrollmentDate: data.enrollment_date || new Date(),
          status: enrollmentStatus,
          notes: data.notes,
          enrolledByProfileId: data.enrolled_by_user_id,
        },
      });

      // Update candidate code from BSC to BST when enrolling in training
      if (data.profileId) {
        const profile = await tx.profile.findUnique({
          where: { id: data.profileId },
          select: { candidateCode: true, currentStage: true },
        });

        // Check if the candidate has a BSC code (candidate code)
        if (profile?.candidateCode?.startsWith('BSC-')) {
          // Generate new trainee code (BST)
          const lastTrainee = await tx.profile.findFirst({
            where: { candidateCode: { startsWith: 'BST-' } },
            orderBy: { candidateCode: 'desc' },
            select: { candidateCode: true },
          });

          let nextNum = 1;
          if (lastTrainee?.candidateCode) {
            const match = lastTrainee.candidateCode.match(/BST-(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
          }
          const newCode = `BST-${String(nextNum).padStart(5, '0')}`;

          // Update the profile with the new code
          await tx.profile.update({
            where: { id: data.profileId },
            data: { candidateCode: newCode },
          });
        }

        // Create stage history record
        await tx.profileStageHistory.create({
          data: {
            id: generateUuid(),
            profileId: data.profileId,
            previousStage: profile?.currentStage || null,
            newStage: 'training',
            reason: `Enrolled in training batch with status: ${enrollmentStatus}`,
            changedByProfileId: data.enrolled_by_user_id,
            changedAt: new Date(),
          },
        });

        // Update profile current stage
        await tx.profile.update({
          where: { id: data.profileId },
          data: { currentStage: 'training' },
        });
      }

      return enrollment;
    });
  }
}
