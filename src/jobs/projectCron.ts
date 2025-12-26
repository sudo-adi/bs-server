/**
 * Project Auto-Start and Auto-Complete Cron Job
 * - Auto-starts projects when their start date arrives (SHARED → ONGOING)
 * - Auto-completes projects when their end date has passed (ONGOING → COMPLETED)
 * - Updates worker stages accordingly
 * Runs daily at midnight by default
 */

import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  ASSIGNMENT_STATUSES,
  PROFILE_STAGES,
  ProfileStage,
  PROJECT_STAGES,
} from '@/constants/stages';
import * as cron from 'node-cron';

class ProjectCron {
  private cronJob: ReturnType<typeof cron.schedule> | null = null;

  // Initialize cron job
  init() {
    // Default: Run every day at 12:00 AM IST (midnight)
    const cronExpression = process.env.PROJECT_CRON_SCHEDULE || '0 0 * * *';
    const timezone = process.env.PROJECT_CRON_TIMEZONE || 'Asia/Kolkata';

    logger.info('Initializing project cron job', {
      schedule: cronExpression,
      timezone,
    });

    // Schedule the cron job
    this.cronJob = cron.schedule(
      cronExpression,
      async () => {
        await this.runProjectJob();
      },
      {
        timezone,
      }
    );

    logger.info('Project cron job initialized successfully');
  }

  // Main job runner
  async runProjectJob() {
    const startTime = new Date();
    logger.info('========================================');
    logger.info('PROJECT CRON JOB STARTED', { startTime });
    logger.info('========================================');

    try {
      const results = {
        autoStarted: await this.autoStartProjects(),
        autoCompleted: await this.autoCompleteProjects(),
      };

      logger.info('========================================');
      logger.info('PROJECT CRON JOB COMPLETED', {
        startTime,
        endTime: new Date(),
        duration: `${(Date.now() - startTime.getTime()) / 1000}s`,
        results,
      });
      logger.info('========================================');

      return results;
    } catch (error) {
      logger.error('========================================');
      logger.error('PROJECT CRON JOB FAILED', {
        startTime,
        endTime: new Date(),
        error,
      });
      logger.error('========================================');
      throw error;
    }
  }

  /**
   * Auto-start projects whose start date has arrived
   * - Finds projects with status 'SHARED' where startDate <= today
   * - Updates project status to 'ONGOING'
   * - Updates ASSIGNED workers to ON_SITE
   */
  async autoStartProjects(): Promise<{ projectsStarted: number; workersUpdated: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectsToStart = await prisma.project.findMany({
      where: {
        stage: PROJECT_STAGES.SHARED,
        startDate: { lte: today },
        deletedAt: null,
        isActive: true,
      },
      include: {
        workerAssignments: {
          where: {
            removedAt: null,
            stage: ASSIGNMENT_STATUSES.ASSIGNED,
          },
          include: {
            profile: true,
          },
        },
      },
    });

    let workersUpdated = 0;
    const now = new Date();

    for (const project of projectsToStart) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update project status to ONGOING
          await tx.project.update({
            where: { id: project.id },
            data: {
              stage: PROJECT_STAGES.ONGOING,
              stageChangedAt: now,
              stageChangeReason: 'Auto-started: Start date reached',
              actualStartDate: project.actualStartDate || now,
              updatedAt: now,
            },
          });

          // Log project stage change
          await tx.projectStageHistory.create({
            data: {
              projectId: project.id,
              previousStage: PROJECT_STAGES.SHARED,
              newStage: PROJECT_STAGES.ONGOING,
              changedAt: now,
              reason: 'Auto-started: Start date reached',
            },
          });

          // Update ASSIGNED workers to ON_SITE
          for (const assignment of project.workerAssignments) {
            // Update assignment stage
            await tx.projectWorkerAssignment.update({
              where: { id: assignment.id },
              data: {
                stage: ASSIGNMENT_STATUSES.ON_SITE,
                deployedAt: now,
              },
            });

            // Update profile stage
            if (assignment.profileId) {
              const previousStage = assignment.profile?.currentStage || PROFILE_STAGES.ASSIGNED;

              await tx.profile.update({
                where: { id: assignment.profileId },
                data: { currentStage: PROFILE_STAGES.ON_SITE },
              });

              // Log profile stage change
              await tx.profileStageHistory.create({
                data: {
                  profileId: assignment.profileId,
                  previousStage,
                  newStage: PROFILE_STAGES.ON_SITE,
                  changedAt: now,
                  reason: `Project ${project.name} auto-started`,
                  metadata: { projectId: project.id },
                },
              });

              workersUpdated++;
            }
          }
        });

        logger.info('Auto-started project', {
          projectId: project.id,
          projectName: project.name,
          workersCount: project.workerAssignments.length,
        });
      } catch (error) {
        logger.error('Failed to auto-start project', { projectId: project.id, error });
      }
    }

    return { projectsStarted: projectsToStart.length, workersUpdated };
  }

  /**
   * Auto-complete projects whose end date has passed
   * - Finds projects with status 'ONGOING' where endDate < today
   * - Updates project status to 'COMPLETED'
   * - Marks all ON_SITE workers as COMPLETED and transitions them to BENCHED
   */
  async autoCompleteProjects(): Promise<{
    projectsCompleted: number;
    assignmentsCompleted: number;
    workersUpdated: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectsToComplete = await prisma.project.findMany({
      where: {
        stage: PROJECT_STAGES.ONGOING,
        endDate: { lt: today },
        deletedAt: null,
        isActive: true,
      },
      include: {
        workerAssignments: {
          where: {
            removedAt: null,
            stage: { in: [ASSIGNMENT_STATUSES.ON_SITE, ASSIGNMENT_STATUSES.ASSIGNED] },
          },
          include: {
            profile: true,
          },
        },
      },
    });

    let assignmentsCompleted = 0;
    let workersUpdated = 0;
    const now = new Date();

    for (const project of projectsToComplete) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update project status to COMPLETED
          await tx.project.update({
            where: { id: project.id },
            data: {
              stage: PROJECT_STAGES.COMPLETED,
              stageChangedAt: now,
              stageChangeReason: 'Auto-completed: End date passed',
              completionDate: now,
              actualEndDate: project.actualEndDate || now,
              isActive: false,
              updatedAt: now,
            },
          });

          // Log project stage change
          await tx.projectStageHistory.create({
            data: {
              projectId: project.id,
              previousStage: PROJECT_STAGES.ONGOING,
              newStage: PROJECT_STAGES.COMPLETED,
              changedAt: now,
              reason: 'Auto-completed: End date passed',
            },
          });

          // Complete all worker assignments and transition to BENCHED
          for (const assignment of project.workerAssignments) {
            // Update assignment to COMPLETED
            await tx.projectWorkerAssignment.update({
              where: { id: assignment.id },
              data: {
                stage: ASSIGNMENT_STATUSES.COMPLETED,
                removedAt: now,
                removalReason: 'Project auto-completed',
              },
            });
            assignmentsCompleted++;

            // Update profile to BENCHED (or check for next project)
            if (assignment.profileId) {
              const previousStage = assignment.profile?.currentStage || PROFILE_STAGES.ON_SITE;

              // Check if worker has another active project
              const nextAssignment = await tx.projectWorkerAssignment.findFirst({
                where: {
                  profileId: assignment.profileId,
                  projectId: { not: project.id },
                  removedAt: null,
                  project: {
                    stage: {
                      in: [
                        PROJECT_STAGES.APPROVED,
                        PROJECT_STAGES.PLANNING,
                        PROJECT_STAGES.SHARED,
                        PROJECT_STAGES.ONGOING,
                      ],
                    },
                    deletedAt: null,
                  },
                },
                include: { project: true },
              });

              let newStage: ProfileStage = PROFILE_STAGES.BENCHED;
              if (nextAssignment) {
                // Has another project - use that assignment's stage
                if (nextAssignment.stage === ASSIGNMENT_STATUSES.MATCHED) {
                  newStage = PROFILE_STAGES.MATCHED;
                } else if (nextAssignment.stage === ASSIGNMENT_STATUSES.ASSIGNED) {
                  newStage = PROFILE_STAGES.ASSIGNED;
                } else if (nextAssignment.stage === ASSIGNMENT_STATUSES.ON_SITE) {
                  newStage = PROFILE_STAGES.ON_SITE;
                }
              }

              await tx.profile.update({
                where: { id: assignment.profileId },
                data: { currentStage: newStage },
              });

              // Log profile stage change
              await tx.profileStageHistory.create({
                data: {
                  profileId: assignment.profileId,
                  previousStage,
                  newStage,
                  changedAt: now,
                  reason: `Project ${project.name} auto-completed`,
                  metadata: { projectId: project.id },
                },
              });

              workersUpdated++;
            }
          }
        });

        logger.info('Auto-completed project', {
          projectId: project.id,
          projectName: project.name,
          assignmentsCompleted: project.workerAssignments.length,
        });
      } catch (error) {
        logger.error('Failed to auto-complete project', { projectId: project.id, error });
      }
    }

    return { projectsCompleted: projectsToComplete.length, assignmentsCompleted, workersUpdated };
  }

  // Manually trigger the job (for testing)
  async triggerManual() {
    logger.info('Manual trigger requested for project cron');
    return await this.runProjectJob();
  }

  // Start the cron job
  start() {
    if (this.cronJob) {
      this.cronJob.start();
      logger.info('Project cron job started');
    } else {
      logger.warn('Project cron job not initialized. Call init() first.');
    }
  }

  // Stop the cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Project cron job stopped');
    }
  }

  // Destroy the cron job
  destroy() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Project cron job destroyed');
    }
  }

  // Get cron job status
  getStatus(): { running: boolean; schedule: string } {
    return {
      running: this.cronJob !== null,
      schedule: process.env.PROJECT_CRON_SCHEDULE || '0 0 * * *',
    };
  }
}

export const projectCron = new ProjectCron();
export default projectCron;
