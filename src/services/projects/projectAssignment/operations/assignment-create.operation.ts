import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateProjectAssignmentDto,
  ProjectAssignment,
} from '@/models/projects/projectAssignment.model';
import {
  PROJECT_ASSIGNMENT_STATUSES,
  ProjectAssignmentStatus,
  mapProjectAssignmentStatusToProfileStage,
} from '@/types/enums';

export class AssignmentCreateOperation {
  static async create(data: CreateProjectAssignmentDto): Promise<ProjectAssignment> {
    const existingAssignment = await prisma.project_assignments.findFirst({
      where: {
        profile_id: data.profile_id,
        status: {
          in: [ProjectAssignmentStatus.ASSIGNED, ProjectAssignmentStatus.ACTIVE],
        },
      },
      select: { id: true, project_id: true },
    });

    if (existingAssignment) {
      throw new AppError(
        `Profile already has an active assignment on project ${existingAssignment.project_id}. Only one active assignment per worker is allowed.`,
        409
      );
    }

    const status = data.status || ProjectAssignmentStatus.ASSIGNED;
    if (!PROJECT_ASSIGNMENT_STATUSES.includes(status as ProjectAssignmentStatus)) {
      throw new AppError(
        `Invalid status: ${status}. Must be one of: ${PROJECT_ASSIGNMENT_STATUSES.join(', ')}`,
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.project_assignments.create({
        data: {
          project_id: data.project_id,
          profile_id: data.profile_id,
          deployment_date: data.assignment_date ? new Date(data.assignment_date) : new Date(),
          status,
          expected_end_date: data.expected_end_date ? new Date(data.expected_end_date) : undefined,
          assigned_by_user_id: data.assigned_by_user_id,
        },
      });

      const newStage = mapProjectAssignmentStatusToProfileStage(status as ProjectAssignmentStatus);
      if (newStage && data.profile_id) {
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: data.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        await tx.stage_transitions.create({
          data: {
            profile_id: data.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: newStage,
            transitioned_by_user_id: data.assigned_by_user_id,
            notes: `Assigned to project with status: ${status}`,
          },
        });
      }

      return assignment;
    });
  }
}
