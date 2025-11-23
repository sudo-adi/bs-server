import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectAssignment } from '@/models/projects/projectAssignment.model';
import { ProjectAssignmentStatus } from '@/types/enums';

export class AssignmentActivateOperation {
  static async activate(id: string): Promise<ProjectAssignment> {
    const assignment = await prisma.project_assignments.findUnique({
      where: { id },
      include: { profiles: true, projects: true },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (assignment.status !== ProjectAssignmentStatus.ASSIGNED) {
      throw new AppError(
        `Cannot activate assignment with status '${assignment.status}'. Must be '${ProjectAssignmentStatus.ASSIGNED}'`,
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.project_assignments.update({
        where: { id },
        data: { status: ProjectAssignmentStatus.ACTIVE },
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
            to_stage: 'deployed',
            notes: 'Assignment activated for project',
          },
        });
      }

      return updatedAssignment;
    });
  }
}
