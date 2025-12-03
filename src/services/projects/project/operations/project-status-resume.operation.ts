import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

/**
 * Resume Project Operation
 * Resumes project from on_hold status
 * Business Rule: When resuming, all on_hold workers return to deployed
 */
export class ResumeProjectOperation {
  /**
   * Resume a project from on hold status and update worker stages
   */
  async resumeProject(projectId: string, userId: string, resumeReason: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get and validate project
      const project = await tx.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Validate current status - can only resume on_hold projects
      if (project.status !== 'on_hold') {
        throw new AppError(
          `Cannot resume project from ${project.status} status. Must be on_hold.`,
          400
        );
      }

      // 2. Get all on_hold workers assigned to this project
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

      // Filter only on_hold workers
      const onHoldAssignments = assignments.filter((a) => a.profiles.current_stage === 'on_hold');

      const profileIds = onHoldAssignments.map((a) => a.profile_id);

      let workersUpdated = {
        count: 0,
        profile_ids: [] as string[],
        new_stage: '',
      };

      if (profileIds.length > 0) {
        // Update all on_hold workers back to deployed
        await tx.profiles.updateMany({
          where: { id: { in: profileIds } },
          data: { current_stage: 'deployed' },
        });

        // Create stage transitions for each worker
        const stageTransitions = onHoldAssignments.map((assignment) => ({
          profile_id: assignment.profile_id,
          from_stage: 'on_hold' as const,
          to_stage: 'deployed' as const,
          transitioned_by_user_id: userId,
          transitioned_at: new Date(),
          notes: `Auto-transitioned: Project ${project.code} resumed from hold`,
        }));

        await tx.stage_transitions.createMany({ data: stageTransitions });

        workersUpdated = {
          count: profileIds.length,
          profile_ids: profileIds,
          new_stage: 'deployed',
        };
      }

      // 3. Update project status back to ongoing
      const updatedProject = await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'ongoing',
          on_hold_reason: null, // Clear the hold reason
        },
      });

      // 4. Create project status history
      await tx.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status,
          to_status: 'ongoing',
          changed_by_user_id: userId,
          status_date: new Date(),
          change_reason: resumeReason || 'Project resumed from hold',
        },
      });

      return {
        project: updatedProject,
        workers_updated: workersUpdated,
      };
    });
  }
}

export default new ResumeProjectOperation();
