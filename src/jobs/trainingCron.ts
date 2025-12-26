/**
 * Training Batch Auto-Completion Cron Job
 * Automatically completes training batches when their end date has passed
 * Also auto-starts batches when their start date arrives
 * Runs daily at midnight by default
 */

import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ENROLLMENT_STATUSES, PROFILE_STAGES } from '@/constants/stages';
import * as cron from 'node-cron';

class TrainingCron {
  private cronJob: ReturnType<typeof cron.schedule> | null = null;

  // Initialize cron job
  init() {
    // Default: Run every day at 12:00 AM IST (midnight)
    const cronExpression = process.env.TRAINING_CRON_SCHEDULE || '0 0 * * *';
    const timezone = process.env.TRAINING_CRON_TIMEZONE || 'Asia/Kolkata';

    logger.info('Initializing training batch cron job', {
      schedule: cronExpression,
      timezone,
    });

    // Schedule the cron job
    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        await this.runTrainingJob();
      },
      {
        timezone,
      }
    );

    logger.info('Training batch cron job initialized successfully');
  }

  // Main job runner
  async runTrainingJob() {
    const startTime = new Date();
    logger.info('========================================');
    logger.info('TRAINING BATCH CRON JOB STARTED', { startTime });
    logger.info('========================================');

    try {
      const results = {
        autoStarted: await this.autoStartBatches(),
        autoCompleted: await this.autoCompleteBatches(),
      };

      logger.info('========================================');
      logger.info('TRAINING BATCH CRON JOB COMPLETED', {
        startTime,
        endTime: new Date(),
        duration: `${(Date.now() - startTime.getTime()) / 1000}s`,
        results,
      });
      logger.info('========================================');

      return results;
    } catch (error) {
      logger.error('========================================');
      logger.error('TRAINING BATCH CRON JOB FAILED', {
        startTime,
        endTime: new Date(),
        error,
      });
      logger.error('========================================');
      throw error;
    }
  }

  /**
   * Auto-start batches whose start date has arrived
   * - Finds batches with status 'scheduled' where startDate <= today
   * - Updates batch status to 'ongoing'
   * - Updates enrolled profiles to IN_TRAINING
   */
  async autoStartBatches(): Promise<{ batchesStarted: number; profilesUpdated: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const batchesToStart = await prisma.trainingBatch.findMany({
      where: {
        status: 'scheduled',
        startDate: { lte: today },
      },
      include: {
        enrollments: {
          where: { status: ENROLLMENT_STATUSES.ENROLLED },
          select: { profileId: true },
        },
      },
    });

    let profilesUpdated = 0;

    for (const batch of batchesToStart) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update batch status
          await tx.trainingBatch.update({
            where: { id: batch.id },
            data: { status: 'ongoing', updatedAt: new Date() },
          });

          // Update enrolled profiles to IN_TRAINING
          for (const enrollment of batch.enrollments) {
            if (enrollment.profileId) {
              await tx.profile.update({
                where: { id: enrollment.profileId },
                data: { currentStage: PROFILE_STAGES.IN_TRAINING },
              });
              profilesUpdated++;
            }
          }
        });

        logger.info('Auto-started training batch', {
          batchId: batch.id,
          batchName: batch.name,
          enrollmentsCount: batch.enrollments.length,
        });
      } catch (error) {
        logger.error('Failed to auto-start batch', { batchId: batch.id, error });
      }
    }

    return { batchesStarted: batchesToStart.length, profilesUpdated };
  }

  /**
   * Auto-complete batches whose end date has passed
   * - Finds batches with status 'ongoing' where endDate < today
   * - Updates batch status to 'completed'
   * - Marks all ENROLLED enrollments as COMPLETED
   * - Updates enrolled profiles to TRAINED
   */
  async autoCompleteBatches(): Promise<{
    batchesCompleted: number;
    enrollmentsCompleted: number;
    profilesUpdated: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const batchesToComplete = await prisma.trainingBatch.findMany({
      where: {
        status: 'ongoing',
        endDate: { lt: today },
      },
      include: {
        enrollments: {
          where: { status: ENROLLMENT_STATUSES.ENROLLED },
          include: { profile: true },
        },
      },
    });

    let enrollmentsCompleted = 0;
    let profilesUpdated = 0;
    const now = new Date();

    for (const batch of batchesToComplete) {
      try {
        await prisma.$transaction(async (tx) => {
          // Complete all enrolled enrollments
          for (const enrollment of batch.enrollments) {
            await tx.trainingBatchEnrollment.update({
              where: { id: enrollment.id },
              data: {
                status: ENROLLMENT_STATUSES.COMPLETED,
                completionDate: now,
                actualEndDate: now,
              },
            });
            enrollmentsCompleted++;

            // Update profile to TRAINED
            if (enrollment.profileId) {
              await tx.profile.update({
                where: { id: enrollment.profileId },
                data: { currentStage: PROFILE_STAGES.TRAINED },
              });
              profilesUpdated++;
            }
          }

          // Update batch status to completed
          await tx.trainingBatch.update({
            where: { id: batch.id },
            data: { status: 'completed', updatedAt: now },
          });
        });

        logger.info('Auto-completed training batch', {
          batchId: batch.id,
          batchName: batch.name,
          enrollmentsCompleted: batch.enrollments.length,
        });
      } catch (error) {
        logger.error('Failed to auto-complete batch', { batchId: batch.id, error });
      }
    }

    return { batchesCompleted: batchesToComplete.length, enrollmentsCompleted, profilesUpdated };
  }

  // Manually trigger the job (for testing)
  async triggerManual() {
    logger.info('Manual trigger requested for training batch cron');
    return await this.runTrainingJob();
  }

  // Start the cron job
  start() {
    if (this.cronJob) {
      this.cronJob.start();
      logger.info('Training batch cron job started');
    } else {
      logger.warn('Training cron job not initialized. Call init() first.');
    }
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Training batch cron job stopped');
    }
  }

  // Destroy the cron job
  destroy() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Training batch cron job destroyed');
    }
  }

  // Get cron job status
  getStatus(): { running: boolean; schedule: string } {
    return {
      running: this.cronJob !== null,
      schedule: process.env.TRAINING_CRON_SCHEDULE || '0 0 * * *',
    };
  }
}

export const trainingCron = new TrainingCron();
export default trainingCron;
