import prisma from '@/config/prisma';
import { UpdateTrainingBatchRequest } from '@/dtos/training/trainingBatch.dto';
import { Prisma, TrainingBatch } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class TrainingBatchUpdateOperation {
  async updateTrainingBatch(id: string, data: UpdateTrainingBatchRequest): Promise<TrainingBatch> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const updateData: Prisma.TrainingBatchUpdateInput = {};

      if (data.code !== undefined) updateData.code = data.code;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.programName !== undefined) updateData.programName = data.programName;
      if (data.provider !== undefined) updateData.provider = data.provider;
      if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
      if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
      if (data.durationDays !== undefined) updateData.durationDays = data.durationDays;
      if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.shift !== undefined) updateData.shift = data.shift;

      // Update batch
      const batch = await prisma.trainingBatch.update({
        where: { id },
        data: updateData,
      });

      // If status is being updated, cascade to enrollments
      if (data.status) {
        await this.updateEnrollmentStatuses(id, data.status);
      }

      return batch;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Training batch not found', 404);
      }
      throw error;
    }
  }

  /**
   * Update enrollment statuses based on batch status change
   */
  private async updateEnrollmentStatuses(batchId: string, batchStatus: string): Promise<void> {
    const now = new Date();

    switch (batchStatus) {
      case 'upcoming': {
        // Get enrollments to update profile stages
        const upcomingEnrollments = await prisma.trainingBatchEnrollment.findMany({
          where: {
            batchId: batchId,
            status: { not: 'dropped' },
          },
          select: {
            profileId: true,
          },
        });

        // Set all enrollments to 'enrolled' status
        await prisma.trainingBatchEnrollment.updateMany({
          where: {
            batchId: batchId,
            status: { not: 'dropped' },
          },
          data: {
            status: 'enrolled',
            updatedAt: now,
          },
        });

        // Update profile stages to 'training' for upcoming batches
        await this.updateProfileStages(upcomingEnrollments, 'training', 'Training batch upcoming - enrolled');
        break;
      }

      case 'ongoing': {
        // Get enrollments to update profile stages
        const ongoingEnrollments = await prisma.trainingBatchEnrollment.findMany({
          where: {
            batchId: batchId,
            status: { notIn: ['dropped', 'completed'] },
          },
          select: {
            profileId: true,
          },
        });

        // Set non-dropped enrollments to 'ongoing'
        await prisma.trainingBatchEnrollment.updateMany({
          where: {
            batchId: batchId,
            status: { notIn: ['dropped', 'completed'] },
          },
          data: {
            status: 'ongoing',
            updatedAt: now,
          },
        });

        // Update profile stages to 'training' for ongoing batches
        await this.updateProfileStages(ongoingEnrollments, 'training', 'Training batch ongoing - in progress');
        break;
      }

      case 'completed': {
        // Get all non-dropped enrollments to update profile stages
        const completedEnrollments = await prisma.trainingBatchEnrollment.findMany({
          where: {
            batchId: batchId,
            status: { not: 'dropped' },
          },
          select: {
            profileId: true,
          },
        });

        // Mark all non-dropped enrollments as completed with completion date
        await prisma.trainingBatchEnrollment.updateMany({
          where: {
            batchId: batchId,
            status: { not: 'dropped' },
          },
          data: {
            status: 'completed',
            completionDate: now,
            updatedAt: now,
          },
        });

        // Update profile stages to 'trained' for all completed enrollments
        await this.updateProfileStages(completedEnrollments, 'trained', 'Training batch completed');
        break;
      }

      case 'cancelled': {
        // Mark all ongoing enrollments as dropped
        await prisma.trainingBatchEnrollment.updateMany({
          where: {
            batchId: batchId,
            status: { notIn: ['completed', 'dropped'] },
          },
          data: {
            status: 'dropped',
            updatedAt: now,
          },
        });
        break;
      }
    }
  }

  /**
   * Update profile stages and create stage history records
   */
  private async updateProfileStages(
    enrollments: { profileId: string | null }[],
    newStage: string,
    reason: string
  ): Promise<void> {
    const now = new Date();
    const profileIds = enrollments.map((e) => e.profileId).filter((id): id is string => id !== null);

    if (profileIds.length === 0) return;

    for (const profileId of profileIds) {
      // Get current profile stage
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { currentStage: true },
      });

      const currentStage = profile?.currentStage || 'NEW_REGISTRATION';

      // Only update if stage is different
      if (currentStage !== newStage) {
        // Update profile (Profile only has currentStage, history tracks previous)
        await prisma.profile.update({
          where: { id: profileId },
          data: {
            currentStage: newStage,
          },
        });

        // Create stage history record
        await prisma.profileStageHistory.create({
          data: {
            profileId: profileId,
            previousStage: currentStage,
            newStage: newStage,
            reason: reason,
            changedAt: now,
          },
        });
      }
    }
  }
}
