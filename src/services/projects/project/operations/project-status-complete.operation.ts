import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

/**
 * Complete Project Operation
 * Transitions project to completed status
 * Business Rule 15: All deployed workers become benched
 */
export class CompleteProjectOperation {
  /**
   * Complete a project and bench all deployed workers
   */
  async completeProject(
    projectId: string,
    userId: string,
    actualEndDate: Date,
    completionNotes?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get and validate project
      const project = await tx.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Validate current status - can only complete ongoing or on_hold projects
      if (project.status && !['ongoing', 'on_hold'].includes(project.status)) {
        throw new AppError(
          `Cannot complete project from ${project.status} status. Must be ongoing or on_hold.`,
          400
        );
      }

      // 2. Get all active workers assigned to this project
      const assignments = await tx.project_worker_assignments.findMany({
        where: {
          project_id: projectId,
          removed_at: null,
        },
        include: {
          profiles: {
            select: {
              id: true,
              current_stage: true,
            },
          },
        },
      });

      // 3. Update project status to completed
      const updatedProject = await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'completed',
          actual_end_date: actualEndDate,
        },
      });

      const profileIds = assignments.map((a) => a.profile_id);

      if (profileIds.length > 0) {
        // 4. Update all workers to benched stage
        await tx.profiles.updateMany({
          where: { id: { in: profileIds } },
          data: { current_stage: 'benched' },
        });

        // 5. Create stage transitions for each worker
        const stageTransitions = assignments.map((assignment) => ({
          profile_id: assignment.profile_id,
          from_stage: assignment.profiles.current_stage,
          to_stage: 'benched' as const,
          transitioned_by_user_id: userId,
          transitioned_at: new Date(),
          notes: `Auto-transitioned: Project ${project.code} completed`,
        }));

        await tx.stage_transitions.createMany({ data: stageTransitions });
      }

      // 6. Create project status history
      await tx.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status,
          to_status: 'completed',
          changed_by_user_id: userId,
          status_date: actualEndDate,
          change_reason: completionNotes || `Project completed`,
        },
      });

      return {
        project: updatedProject,
        workers_updated: {
          count: profileIds.length,
          profile_ids: profileIds,
          new_stage: 'benched',
        },
      };
    });
  }
}

export default new CompleteProjectOperation();
