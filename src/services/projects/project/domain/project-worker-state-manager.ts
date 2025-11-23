import prisma from '@/config/prisma';
import logger from '@/config/logger';
import { ProfileStage, ProjectHoldAttributableTo, ProjectStatus } from '@/types/enums';
import type { WorkerStateChangeResult } from '@/types/project-status.types';

export class ProjectWorkerStateManager {
  /**
   * Handle worker state changes when project status changes
   */
  static async handleStatusChange(
    projectId: string,
    toStatus: ProjectStatus,
    attributableTo?: ProjectHoldAttributableTo
  ): Promise<WorkerStateChangeResult[]> {
    const results: WorkerStateChangeResult[] = [];

    try {
      // Get all active assignments for this project
      const assignments = await prisma.project_assignments.findMany({
        where: {
          project_id: projectId,
          status: { in: ['assigned', 'active'] },
        },
        include: {
          profiles: true,
        },
      });

      logger.info(`Found ${assignments.length} active assignments for project ${projectId}`);

      // Handle different status transitions
      switch (toStatus) {
        case ProjectStatus.ON_HOLD:
          return await this.handleOnHold(assignments, attributableTo);

        case ProjectStatus.COMPLETED:
          return await this.handleCompleted(assignments);

        case ProjectStatus.SHORT_CLOSED:
          return await this.handleShortClosed(assignments);

        case ProjectStatus.TERMINATED:
          return await this.handleTerminated(assignments);

        case ProjectStatus.ONGOING:
          // Resume from ON_HOLD - workers go back to DEPLOYED
          return await this.handleResume(assignments);

        default:
          logger.info(`No worker state changes required for status: ${toStatus}`);
          return results;
      }
    } catch (error) {
      logger.error('Error handling worker state changes', { error, projectId, toStatus });
      throw error;
    }
  }

  /**
   * Handle ON_HOLD status
   * - attributable_to EMPLOYER → workers remain DEPLOYED
   * - attributable_to BUILDSEWA or FORCE_MAJEURE → workers go to ON_HOLD
   */
  private static async handleOnHold(
    assignments: any[],
    attributableTo?: ProjectHoldAttributableTo
  ): Promise<WorkerStateChangeResult[]> {
    const results: WorkerStateChangeResult[] = [];

    if (!attributableTo) {
      logger.warn('No attributable_to provided for ON_HOLD status');
      return results;
    }

    // If attributable to employer, workers remain deployed
    if (attributableTo === ProjectHoldAttributableTo.EMPLOYER) {
      logger.info('Project on hold attributable to EMPLOYER - workers remain DEPLOYED');
      // No state change needed, just log
      for (const assignment of assignments) {
        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: assignment.profiles?.candidate_code || 'unknown',
          from_stage: ProfileStage.DEPLOYED,
          to_stage: ProfileStage.DEPLOYED,
          success: true,
        });
      }
      return results;
    }

    // For BUILDSEWA or FORCE_MAJEURE, workers go to ON_HOLD
    logger.info('Project on hold - moving workers to ON_HOLD status');

    for (const assignment of assignments) {
      try {
        const profile = assignment.profiles;
        if (!profile) continue;

        // Save current stage as previous_stage
        await prisma.profiles.update({
          where: { id: assignment.profile_id! },
          data: {
            previous_stage: profile.stage || ProfileStage.DEPLOYED,
          },
        });

        // Update profile stage to ON_HOLD
        await prisma.$executeRaw`
          UPDATE profiles
          SET stage = ${ProfileStage.ON_HOLD}
          WHERE id = ${assignment.profile_id}
        `;

        // Create stage transition record
        await prisma.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id!,
            from_stage: profile.stage || ProfileStage.DEPLOYED,
            to_stage: ProfileStage.ON_HOLD,
            notes: `Project put on hold (${attributableTo})`,
          },
        });

        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: profile.candidate_code,
          from_stage: profile.stage,
          to_stage: ProfileStage.ON_HOLD,
          success: true,
        });
      } catch (error) {
        logger.error('Error updating worker state to ON_HOLD', {
          error,
          profile_id: assignment.profile_id,
        });
        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: assignment.profiles?.candidate_code || 'unknown',
          from_stage: assignment.profiles?.stage || null,
          to_stage: ProfileStage.ON_HOLD,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Handle COMPLETED status - all workers go to BENCHED
   */
  private static async handleCompleted(assignments: any[]): Promise<WorkerStateChangeResult[]> {
    const results: WorkerStateChangeResult[] = [];

    logger.info('Project completed - moving all workers to BENCHED');

    for (const assignment of assignments) {
      try {
        const profile = assignment.profiles;
        if (!profile) continue;

        const fromStage = profile.stage || ProfileStage.DEPLOYED;

        // Update assignment status
        await prisma.project_assignments.update({
          where: { id: assignment.id },
          data: {
            status: 'completed',
            actual_end_date: new Date(),
          },
        });

        // Update profile stage to BENCHED
        await prisma.$executeRaw`
          UPDATE profiles
          SET stage = ${ProfileStage.BENCHED}
          WHERE id = ${assignment.profile_id}
        `;

        // Create stage transition record
        await prisma.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id!,
            from_stage: fromStage,
            to_stage: ProfileStage.BENCHED,
            notes: 'Project completed',
          },
        });

        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: profile.candidate_code,
          from_stage: fromStage,
          to_stage: ProfileStage.BENCHED,
          success: true,
        });
      } catch (error) {
        logger.error('Error updating worker state on completion', {
          error,
          profile_id: assignment.profile_id,
        });
        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: assignment.profiles?.candidate_code || 'unknown',
          from_stage: assignment.profiles?.stage || null,
          to_stage: ProfileStage.BENCHED,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Handle SHORT_CLOSED status - ALL workers go to BENCHED (no previous_stage check)
   */
  private static async handleShortClosed(assignments: any[]): Promise<WorkerStateChangeResult[]> {
    const results: WorkerStateChangeResult[] = [];

    logger.info('Project short closed - moving ALL workers to BENCHED (exceptional case)');

    for (const assignment of assignments) {
      try {
        const profile = assignment.profiles;
        if (!profile) continue;

        const fromStage = profile.stage || ProfileStage.DEPLOYED;

        // Update assignment status
        await prisma.project_assignments.update({
          where: { id: assignment.id },
          data: {
            status: 'completed',
            actual_end_date: new Date(),
          },
        });

        // Update profile stage to BENCHED (no previous_stage check for short close)
        await prisma.$executeRaw`
          UPDATE profiles
          SET stage = ${ProfileStage.BENCHED},
              previous_stage = NULL
          WHERE id = ${assignment.profile_id}
        `;

        // Create stage transition record
        await prisma.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id!,
            from_stage: fromStage,
            to_stage: ProfileStage.BENCHED,
            notes: 'Project short closed - exceptional termination',
          },
        });

        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: profile.candidate_code,
          from_stage: fromStage,
          to_stage: ProfileStage.BENCHED,
          success: true,
        });
      } catch (error) {
        logger.error('Error updating worker state on short close', {
          error,
          profile_id: assignment.profile_id,
        });
        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: assignment.profiles?.candidate_code || 'unknown',
          from_stage: assignment.profiles?.stage || null,
          to_stage: ProfileStage.BENCHED,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Handle TERMINATED status - workers return to previous_stage
   */
  private static async handleTerminated(assignments: any[]): Promise<WorkerStateChangeResult[]> {
    const results: WorkerStateChangeResult[] = [];

    logger.info('Project terminated - returning workers to previous stages');

    for (const assignment of assignments) {
      try {
        const profile = assignment.profiles;
        if (!profile) continue;

        const fromStage = profile.stage || ProfileStage.DEPLOYED;
        const toStage = (profile.previous_stage as ProfileStage) || ProfileStage.BENCHED;

        // Update assignment status
        await prisma.project_assignments.update({
          where: { id: assignment.id },
          data: {
            status: 'terminated',
            actual_end_date: new Date(),
          },
        });

        // Update profile stage to previous_stage or BENCHED
        await prisma.$executeRaw`
          UPDATE profiles
          SET stage = ${toStage},
              previous_stage = NULL
          WHERE id = ${assignment.profile_id}
        `;

        // Create stage transition record
        await prisma.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id!,
            from_stage: fromStage,
            to_stage: toStage,
            notes: `Project terminated - returned to ${toStage}`,
          },
        });

        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: profile.candidate_code,
          from_stage: fromStage,
          to_stage: toStage,
          success: true,
        });
      } catch (error) {
        logger.error('Error updating worker state on termination', {
          error,
          profile_id: assignment.profile_id,
        });
        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: assignment.profiles?.candidate_code || 'unknown',
          from_stage: assignment.profiles?.stage || null,
          to_stage: ProfileStage.BENCHED,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Handle resume from ON_HOLD - workers go back to DEPLOYED
   */
  private static async handleResume(assignments: any[]): Promise<WorkerStateChangeResult[]> {
    const results: WorkerStateChangeResult[] = [];

    logger.info('Project resumed from ON_HOLD - returning workers to DEPLOYED');

    for (const assignment of assignments) {
      try {
        const profile = assignment.profiles;
        if (!profile) continue;

        const fromStage = profile.stage || ProfileStage.ON_HOLD;
        const toStage = (profile.previous_stage as ProfileStage) || ProfileStage.DEPLOYED;

        // Update profile stage back to previous stage or DEPLOYED
        await prisma.$executeRaw`
          UPDATE profiles
          SET stage = ${toStage},
              previous_stage = NULL
          WHERE id = ${assignment.profile_id}
        `;

        // Create stage transition record
        await prisma.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id!,
            from_stage: fromStage,
            to_stage: toStage,
            notes: 'Project resumed from hold',
          },
        });

        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: profile.candidate_code,
          from_stage: fromStage,
          to_stage: toStage,
          success: true,
        });
      } catch (error) {
        logger.error('Error updating worker state on resume', {
          error,
          profile_id: assignment.profile_id,
        });
        results.push({
          profile_id: assignment.profile_id!,
          candidate_code: assignment.profiles?.candidate_code || 'unknown',
          from_stage: assignment.profiles?.stage || null,
          to_stage: ProfileStage.DEPLOYED,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}
