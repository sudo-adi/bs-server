import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { RemoveAssignmentDto } from '@/types';

/**
 * Remove Worker Operation
 * Implements Rule 19: Worker removed from project goes back to previous stage
 */
export class RemoveWorkerOperation {
  /**
   * Remove a worker from a project
   * Restores worker to previous stage (trained or benched)
   */
  async removeWorkerFromProject(
    assignmentId: string,
    dto: RemoveAssignmentDto
  ): Promise<{ success: boolean; message: string }> {
    // Get the assignment with relations
    const assignment = await prisma.project_worker_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        profiles: {
          select: {
            id: true,
            candidate_code: true,
            first_name: true,
            last_name: true,
            current_stage: true,
          },
        },
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.removed_at) {
      throw new AppError('Worker already removed from this project', 400);
    }

    // Determine previous stage
    // Get the stage transition that happened when worker was assigned to this project
    const assignmentTransition = await prisma.stage_transitions.findFirst({
      where: {
        profile_id: assignment.profile_id,
        transitioned_at: {
          gte: assignment.created_at,
        },
        notes: {
          contains: assignment.projects.code,
        },
      },
      orderBy: {
        transitioned_at: 'asc',
      },
      select: {
        from_stage: true,
        to_stage: true,
      },
    });

    // Default to 'benched' if we can't determine previous stage
    let previousStage: string = 'benched';

    if (assignmentTransition && assignmentTransition.from_stage) {
      previousStage = assignmentTransition.from_stage;
    } else {
      // If no transition found, check if worker was benched or trained before
      // by looking at stage transitions before assignment creation
      const priorTransition = await prisma.stage_transitions.findFirst({
        where: {
          profile_id: assignment.profile_id,
          transitioned_at: {
            lt: assignment.created_at,
          },
        },
        orderBy: {
          transitioned_at: 'desc',
        },
        select: {
          to_stage: true,
        },
      });

      if (priorTransition && ['trained', 'benched'].includes(priorTransition.to_stage)) {
        previousStage = priorTransition.to_stage;
      }
    }

    // Remove worker and restore stage in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark assignment as removed
      await tx.project_worker_assignments.update({
        where: { id: assignmentId },
        data: {
          removed_at: new Date(),
          removed_by_user_id: dto.removed_by_user_id,
          removal_reason: dto.removal_reason || null,
        },
      });

      // Check if worker has other active assignments
      const otherActiveAssignments = await tx.project_worker_assignments.count({
        where: {
          profile_id: assignment.profile_id,
          removed_at: null,
          id: {
            not: assignmentId,
          },
        },
      });

      // Only restore stage if no other active assignments
      if (otherActiveAssignments === 0) {
        // Update worker stage to previous stage
        await tx.profiles.update({
          where: { id: assignment.profile_id },
          data: { current_stage: previousStage },
        });

        // Create stage transition record
        await tx.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id,
            from_stage: assignment.profiles.current_stage,
            to_stage: previousStage,
            transitioned_by_user_id: dto.removed_by_user_id,
            transitioned_at: new Date(),
            notes: `Removed from project ${assignment.projects.code} (${assignment.projects.name}). Reason: ${dto.removal_reason || 'Not specified'}`,
          },
        });
      }

      return {
        workerRestored: otherActiveAssignments === 0,
        previousStage,
      };
    });

    const message = result.workerRestored
      ? `Worker removed from project and restored to '${result.previousStage}' stage`
      : `Worker removed from project but remains in current stage (has other active assignments)`;

    return {
      success: true,
      message,
    };
  }

  /**
   * Remove multiple workers from a project
   */
  async bulkRemoveWorkers(
    assignmentIds: string[],
    dto: RemoveAssignmentDto
  ): Promise<{
    success: number;
    failed: number;
    errors: { assignment_id: string; error: string }[];
  }> {
    const errors: { assignment_id: string; error: string }[] = [];
    let successCount = 0;

    for (const assignmentId of assignmentIds) {
      try {
        await this.removeWorkerFromProject(assignmentId, dto);
        successCount++;
      } catch (error) {
        errors.push({
          assignment_id: assignmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }
}

export default RemoveWorkerOperation;
