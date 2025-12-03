import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

/**
 * Start Project Operation
 * Transitions project from planning/workers_shared to ongoing
 * Business Rule 12: All allocated/onboarded workers become deployed
 */
export class StartProjectOperation {
  /**
   * Start a project and deploy all assigned workers
   */
  async startProject(
    projectId: string,
    userId: string,
    startDate: Date,
    notes?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get and validate project
      const project = await tx.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Validate current status
      if (project.status && !['planning', 'workers_shared'].includes(project.status)) {
        throw new AppError(
          `Cannot start project from ${project.status} status. Must be in planning or workers_shared status.`,
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

      // 3. Update project status to ongoing
      const updatedProject = await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'ongoing',
          start_date: startDate,
        },
      });

      const profileIds = assignments.map((a) => a.profile_id);

      if (profileIds.length > 0) {
        // 4. Update all workers to deployed stage
        await tx.profiles.updateMany({
          where: { id: { in: profileIds } },
          data: { current_stage: 'deployed' },
        });

        // 5. Set deployed_date on assignments (only for those not yet deployed)
        await tx.project_worker_assignments.updateMany({
          where: {
            project_id: projectId,
            removed_at: null,
            deployed_date: null,
          },
          data: { deployed_date: new Date() },
        });

        // 6. Create stage transitions for each worker
        const stageTransitions = assignments.map((assignment) => ({
          profile_id: assignment.profile_id,
          from_stage: assignment.profiles.current_stage,
          to_stage: 'deployed' as const,
          transitioned_by_user_id: userId,
          transitioned_at: new Date(),
          notes: `Auto-transitioned: Project ${project.code} started`,
        }));

        await tx.stage_transitions.createMany({ data: stageTransitions });
      }

      // 7. Create project status history
      await tx.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status || 'planning',
          to_status: 'ongoing',
          changed_by_user_id: userId,
          status_date: startDate,
          change_reason: notes || `Project started`,
        },
      });

      return {
        project: updatedProject,
        workers_updated: {
          count: profileIds.length,
          profile_ids: profileIds,
          new_stage: 'deployed',
        },
      };
    });
  }
}

export default new StartProjectOperation();
