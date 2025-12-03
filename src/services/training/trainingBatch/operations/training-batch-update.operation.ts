import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { TrainingBatch, UpdateTrainingBatchDto } from '@/types';

export class TrainingBatchUpdateOperation {
  async updateTrainingBatch(id: string, data: UpdateTrainingBatchDto): Promise<TrainingBatch> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      // Convert date strings to Date objects for Prisma
      const updateData: Prisma.training_batchesUpdateInput = { ...data };
      if (updateData.start_date) {
        updateData.start_date = new Date(updateData.start_date as string | Date);
      }
      if (updateData.end_date) {
        updateData.end_date = new Date(updateData.end_date as string | Date);
      }

      // Update batch
      const batch = await prisma.training_batches.update({
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
        const upcomingEnrollments = await prisma.batch_enrollments.findMany({
          where: {
            batch_id: batchId,
            status: { not: 'dropped' },
          },
          select: {
            profile_id: true,
          },
        });

        // Set all enrollments to 'enrolled' status
        await prisma.batch_enrollments.updateMany({
          where: {
            batch_id: batchId,
            status: { not: 'dropped' }, // Don't update dropped enrollments
          },
          data: {
            status: 'enrolled',
            updated_at: now,
          },
        });

        // Update profile stages to 'training' for upcoming batches
        if (upcomingEnrollments.length > 0) {
          const profileIds = upcomingEnrollments
            .map((e) => e.profile_id)
            .filter((id): id is string => id !== null);

          if (profileIds.length > 0) {
            // Update each profile individually and create stage transitions
            for (const profileId of profileIds) {
              // Get current stage from latest stage_transition
              const latestTransition = await prisma.stage_transitions.findFirst({
                where: { profile_id: profileId },
                orderBy: { transitioned_at: 'desc' },
                select: { to_stage: true },
              });

              const currentStage = latestTransition?.to_stage || 'new_registration';

              // Only create transition if not already in training stage
              if (currentStage !== 'training') {
                // Update profile
                await prisma.profiles.update({
                  where: { id: profileId },
                  data: {
                    previous_stage: currentStage,
                    current_stage: 'training',
                    updated_at: now,
                  },
                });

                // Create stage transition record
                await prisma.stage_transitions.create({
                  data: {
                    profile_id: profileId,
                    from_stage: currentStage,
                    to_stage: 'training',
                    transitioned_at: now,
                    notes: 'Training batch upcoming - enrolled',
                  },
                });
              }
            }
          }
        }
        break;
      }

      case 'ongoing': {
        // Get enrollments to update profile stages
        const ongoingEnrollments = await prisma.batch_enrollments.findMany({
          where: {
            batch_id: batchId,
            status: { notIn: ['dropped', 'completed'] },
          },
          select: {
            profile_id: true,
          },
        });

        // Set non-dropped enrollments to 'ongoing' or 'in_progress'
        await prisma.batch_enrollments.updateMany({
          where: {
            batch_id: batchId,
            status: { notIn: ['dropped', 'completed'] }, // Don't update dropped or already completed
          },
          data: {
            status: 'ongoing',
            updated_at: now,
          },
        });

        // Update profile stages to 'training' for ongoing batches
        if (ongoingEnrollments.length > 0) {
          const profileIds = ongoingEnrollments
            .map((e) => e.profile_id)
            .filter((id): id is string => id !== null);

          if (profileIds.length > 0) {
            // Update each profile individually and create stage transitions
            for (const profileId of profileIds) {
              // Get current stage from latest stage_transition
              const latestTransition = await prisma.stage_transitions.findFirst({
                where: { profile_id: profileId },
                orderBy: { transitioned_at: 'desc' },
                select: { to_stage: true },
              });

              const currentStage = latestTransition?.to_stage || 'new_registration';

              // Only create transition if not already in training stage
              if (currentStage !== 'training') {
                // Update profile
                await prisma.profiles.update({
                  where: { id: profileId },
                  data: {
                    previous_stage: currentStage,
                    current_stage: 'training',
                    updated_at: now,
                  },
                });

                // Create stage transition record
                await prisma.stage_transitions.create({
                  data: {
                    profile_id: profileId,
                    from_stage: currentStage,
                    to_stage: 'training',
                    transitioned_at: now,
                    notes: 'Training batch ongoing - in progress',
                  },
                });
              }
            }
          }
        }
        break;
      }

      case 'completed': {
        // Get all non-dropped enrollments to update profile stages
        const completedEnrollments = await prisma.batch_enrollments.findMany({
          where: {
            batch_id: batchId,
            status: { not: 'dropped' },
          },
          select: {
            profile_id: true,
          },
        });

        // Mark all non-dropped enrollments as completed with completion date
        await prisma.batch_enrollments.updateMany({
          where: {
            batch_id: batchId,
            status: { not: 'dropped' },
          },
          data: {
            status: 'completed',
            completion_date: now,
            updated_at: now,
          },
        });

        // Update profile stages to 'trained' for all completed enrollments
        if (completedEnrollments.length > 0) {
          const profileIds = completedEnrollments
            .map((e) => e.profile_id)
            .filter((id): id is string => id !== null);

          if (profileIds.length > 0) {
            // Update each profile individually to create stage transitions
            for (const profileId of profileIds) {
              // Get current stage from latest stage_transition
              const latestTransition = await prisma.stage_transitions.findFirst({
                where: { profile_id: profileId },
                orderBy: { transitioned_at: 'desc' },
                select: { to_stage: true },
              });

              const currentStage = latestTransition?.to_stage || 'new_registration';

              // Update profile stage
              await prisma.profiles.update({
                where: { id: profileId },
                data: {
                  previous_stage: currentStage,
                  current_stage: 'trained',
                  updated_at: now,
                },
              });

              // Create stage transition record
              await prisma.stage_transitions.create({
                data: {
                  profile_id: profileId,
                  from_stage: currentStage,
                  to_stage: 'trained',
                  transitioned_at: now,
                  notes: 'Training batch completed',
                },
              });
            }
          }
        }
        break;
      }

      case 'cancelled': {
        // Optionally mark all ongoing enrollments as dropped
        await prisma.batch_enrollments.updateMany({
          where: {
            batch_id: batchId,
            status: { notIn: ['completed', 'dropped'] },
          },
          data: {
            status: 'dropped',
            updated_at: now,
          },
        });
        break;
      }
    }
  }
}
