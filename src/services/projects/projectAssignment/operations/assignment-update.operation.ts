import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  ProjectAssignment,
  UpdateProjectAssignmentDto,
} from '@/models/projects/projectAssignment.model';
import {
  PROJECT_ASSIGNMENT_STATUSES,
  ProjectAssignmentStatus,
  mapProjectAssignmentStatusToProfileStage,
} from '@/types/enums';

export class AssignmentUpdateOperation {
  static async update(id: string, data: UpdateProjectAssignmentDto): Promise<ProjectAssignment> {
    const updateData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) updateData[key] = value;
    });

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    if (
      data.status &&
      !PROJECT_ASSIGNMENT_STATUSES.includes(data.status as ProjectAssignmentStatus)
    ) {
      throw new AppError(
        `Invalid status: ${data.status}. Must be one of: ${PROJECT_ASSIGNMENT_STATUSES.join(', ')}`,
        400
      );
    }

    try {
      if (data.status) {
        return await prisma.$transaction(async (tx) => {
          const currentAssignment = await tx.project_assignments.findUnique({ where: { id } });

          if (!currentAssignment) {
            throw new AppError('Assignment not found', 404);
          }

          const assignment = await tx.project_assignments.update({
            where: { id },
            data: updateData,
          });

          if (data.status !== currentAssignment.status && assignment.profile_id) {
            const newStage = mapProjectAssignmentStatusToProfileStage(
              data.status as ProjectAssignmentStatus
            );

            if (newStage) {
              const latestTransition = await tx.stage_transitions.findFirst({
                where: { profile_id: assignment.profile_id },
                orderBy: { transitioned_at: 'desc' },
                select: { to_stage: true },
              });

              await tx.stage_transitions.create({
                data: {
                  profile_id: assignment.profile_id,
                  from_stage: latestTransition?.to_stage || null,
                  to_stage: newStage,
                  notes: `Assignment status changed to: ${data.status}`,
                },
              });
            }
          }

          return assignment;
        });
      } else {
        return await prisma.project_assignments.update({
          where: { id },
          data: updateData,
        });
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Assignment not found', 404);
      }
      throw error;
    }
  }
}
