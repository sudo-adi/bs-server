import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectAssignment } from '@/models/projects/projectAssignment.model';
import { ProjectAssignmentStatus } from '@/types/enums';

export class AssignmentCompleteOperation {
  static async complete(id: string, actualEndDate?: Date): Promise<ProjectAssignment> {
    const assignment = await prisma.project_assignments.findUnique({
      where: { id },
      include: { profiles: true, projects: true },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.status !== ProjectAssignmentStatus.ACTIVE) {
      throw new AppError(
        `Cannot complete assignment with status '${assignment.status}'. Must be '${ProjectAssignmentStatus.ACTIVE}'`,
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.project_assignments.update({
        where: { id },
        data: {
          status: ProjectAssignmentStatus.COMPLETED,
          actual_end_date: actualEndDate || new Date(),
        },
      });

      if (assignment.profile_id) {
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: assignment.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        await tx.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: 'benched',
            notes: 'Assignment completed',
          },
        });
      }

      return updatedAssignment;
    });
  }
}
