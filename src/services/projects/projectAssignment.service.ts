import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateProjectAssignmentDto,
  ProjectAssignment,
  ProjectAssignmentWithDetails,
  UpdateProjectAssignmentDto,
} from '@/models/projects/projectAssignment.model';
import {
  PROJECT_ASSIGNMENT_STATUSES,
  ProjectAssignmentStatus,
  mapProjectAssignmentStatusToProfileStage,
} from '@/types/enums';

export class ProjectAssignmentService {
  async getAllAssignments(filters?: {
    project_id?: string;
    profile_id?: string;
    limit?: number;
    offset?: number;
    include_details?: boolean;
  }): Promise<{ assignments: ProjectAssignmentWithDetails[]; total: number }> {
    const where: any = {};

    if (filters?.project_id) {
      where.project_id = filters.project_id;
    }

    if (filters?.profile_id) {
      where.profile_id = filters.profile_id;
    }

    // Get total count
    const total = await prisma.project_assignments.count({ where });

    // Build include object
    const include = filters?.include_details
      ? {
          profiles: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              phone: true,
              profile_skills: {
                where: {
                  is_primary: true,
                },
                take: 1,
                include: {
                  skill_categories: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          projects: true,
        }
      : undefined;

    // Get assignments with pagination
    const assignments = await prisma.project_assignments.findMany({
      where,
      include,
      orderBy: {
        deployment_date: 'desc',
      },
      take: filters?.limit,
      skip: filters?.offset,
    });

    // Transform to match expected format
    const transformedAssignments = assignments.map((assignment: any) => {
      if (filters?.include_details && assignment.profiles) {
        const profile = assignment.profiles;
        // Add primary_skill to profile
        if (profile.profile_skills && profile.profile_skills.length > 0) {
          profile.primary_skill = profile.profile_skills[0].skill_categories?.name;
        }
        // Remove profile_skills from the final profile object
        delete profile.profile_skills;

        return {
          ...assignment,
          profile: profile,
          project: assignment.projects,
          profiles: undefined,
          projects: undefined,
        };
      }
      return assignment;
    });

    return {
      assignments: transformedAssignments,
      total,
    };
  }

  async getAssignmentById(
    id: string,
    includeDetails = false
  ): Promise<ProjectAssignmentWithDetails> {
    const assignment = await prisma.project_assignments.findUnique({
      where: { id },
      include: includeDetails
        ? {
            profiles: true,
            projects: true,
          }
        : undefined,
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    // Transform to match expected format
    if (includeDetails) {
      return {
        ...assignment,
        profile: (assignment as any).profiles,
        project: (assignment as any).projects,
        profiles: undefined,
        projects: undefined,
      } as any;
    }

    return assignment;
  }

  async createAssignment(data: CreateProjectAssignmentDto): Promise<ProjectAssignment> {
    // Check for existing active assignment for this profile
    const existingAssignment = await prisma.project_assignments.findFirst({
      where: {
        profile_id: data.profile_id,
        status: {
          in: [ProjectAssignmentStatus.ASSIGNED, ProjectAssignmentStatus.ACTIVE],
        },
      },
      select: {
        id: true,
        project_id: true,
      },
    });

    if (existingAssignment) {
      throw new AppError(
        `Profile already has an active assignment on project ${existingAssignment.project_id}. Only one active assignment per worker is allowed.`,
        409
      );
    }

    // Validate and set default status
    const status = data.status || ProjectAssignmentStatus.ASSIGNED;
    if (!PROJECT_ASSIGNMENT_STATUSES.includes(status as ProjectAssignmentStatus)) {
      throw new AppError(
        `Invalid status: ${status}. Must be one of: ${PROJECT_ASSIGNMENT_STATUSES.join(', ')}`,
        400
      );
    }

    // Use transaction to create assignment and update profile stage
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

      // Update profile stage based on assignment status
      const newStage = mapProjectAssignmentStatusToProfileStage(status as ProjectAssignmentStatus);
      if (newStage && data.profile_id) {
        // Get current stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: data.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        // Create stage transition (this is the source of truth for current stage)
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

  async updateAssignment(id: string, data: UpdateProjectAssignmentDto): Promise<ProjectAssignment> {
    // Filter out undefined values
    const updateData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Validate status if provided
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
      // Use transaction if status is being changed
      if (data.status) {
        return await prisma.$transaction(async (tx) => {
          // Get current assignment
          const currentAssignment = await tx.project_assignments.findUnique({
            where: { id },
          });

          if (!currentAssignment) {
            throw new AppError('Assignment not found', 404);
          }

          // Update assignment
          const assignment = await tx.project_assignments.update({
            where: { id },
            data: updateData,
          });

          // If status changed, update profile stage
          if (data.status !== currentAssignment.status && assignment.profile_id) {
            const newStage = mapProjectAssignmentStatusToProfileStage(
              data.status as ProjectAssignmentStatus
            );

            if (newStage) {
              // Get current stage from stage_transitions
              const latestTransition = await tx.stage_transitions.findFirst({
                where: { profile_id: assignment.profile_id },
                orderBy: { transitioned_at: 'desc' },
                select: { to_stage: true },
              });

              // Create stage transition for audit trail
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
        // No status change, simple update
        const assignment = await prisma.project_assignments.update({
          where: { id },
          data: updateData,
        });

        return assignment;
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Assignment not found', 404);
      }
      throw error;
    }
  }

  async deleteAssignment(id: string): Promise<void> {
    // Note: Database triggers automatically handle:
    // - Clearing assignment info from profile
    // - Setting stage to 'benched'
    // - Updating project worker count
    try {
      await prisma.project_assignments.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Assignment not found', 404);
      }
      throw error;
    }
  }

  async activateAssignment(id: string): Promise<ProjectAssignment> {
    // This is called when project start date arrives
    // Changes assignment status from 'assigned' to 'active'
    // And transitions profile stage to 'deployed'

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

    // Use transaction to update assignment and create stage transition
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment status to active
      const updatedAssignment = await tx.project_assignments.update({
        where: { id },
        data: {
          status: ProjectAssignmentStatus.ACTIVE,
        },
      });

      // Update profile stage to deployed
      if (assignment.profile_id) {
        // Get current stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: assignment.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        // Create stage transition for audit trail
        await tx.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: 'deployed',
            notes: `Assignment activated for project`,
          },
        });
      }

      return updatedAssignment;
    });

    return result;
  }

  async completeAssignment(id: string, actualEndDate?: Date): Promise<ProjectAssignment> {
    // This is called when project ends
    // Changes assignment status to 'completed'
    // And transitions profile stage from 'deployed' to 'benched'

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

    // Use transaction to update assignment and create stage transition
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment status to completed
      const updatedAssignment = await tx.project_assignments.update({
        where: { id },
        data: {
          status: ProjectAssignmentStatus.COMPLETED,
          actual_end_date: actualEndDate || new Date(),
        },
      });

      // Update profile stage to benched
      if (assignment.profile_id) {
        // Get current stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: assignment.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        // Create stage transition for audit trail
        await tx.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: 'benched',
            notes: `Assignment completed`,
          },
        });
      }

      return updatedAssignment;
    });

    return result;
  }

  async terminateAssignment(id: string, reason?: string): Promise<ProjectAssignment> {
    // This can be called at any time to terminate an assignment
    // Changes assignment status to 'terminated'
    // And transitions profile stage to 'benched'

    const assignment = await prisma.project_assignments.findUnique({
      where: { id },
      include: { profiles: true, projects: true },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (
      assignment.status === ProjectAssignmentStatus.COMPLETED ||
      assignment.status === ProjectAssignmentStatus.TERMINATED
    ) {
      throw new AppError(`Cannot terminate assignment with status '${assignment.status}'`, 400);
    }

    // Use transaction to update assignment and create stage transition
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment status to terminated
      const updatedAssignment = await tx.project_assignments.update({
        where: { id },
        data: {
          status: ProjectAssignmentStatus.TERMINATED,
          actual_end_date: new Date(),
        },
      });

      // Update profile stage to benched
      if (assignment.profile_id) {
        // Get current stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: assignment.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        // Create stage transition for audit trail
        await tx.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: 'benched',
            notes: reason || 'Assignment terminated',
          },
        });
      }

      return updatedAssignment;
    });

    return result;
  }

  async cancelAssignment(id: string, reason?: string): Promise<ProjectAssignment> {
    // This can be called before project starts to cancel an assignment
    // Changes assignment status to 'cancelled' or 'terminated'
    // And transitions profile stage to 'benched'

    const assignment = await prisma.project_assignments.findUnique({
      where: { id },
      include: { profiles: true, projects: true },
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (
      assignment.status === ProjectAssignmentStatus.COMPLETED ||
      assignment.status === ProjectAssignmentStatus.TERMINATED
    ) {
      throw new AppError(`Cannot cancel assignment with status '${assignment.status}'`, 400);
    }

    // Use transaction to update assignment and create stage transition
    const result = await prisma.$transaction(async (tx) => {
      // Update assignment status to terminated (using same status as terminate)
      const updatedAssignment = await tx.project_assignments.update({
        where: { id },
        data: {
          status: ProjectAssignmentStatus.TERMINATED,
          actual_end_date: new Date(),
        },
      });

      // Update profile stage to benched
      if (assignment.profile_id) {
        // Get current stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: assignment.profile_id },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        // Create stage transition for audit trail
        await tx.stage_transitions.create({
          data: {
            profile_id: assignment.profile_id,
            from_stage: latestTransition?.to_stage || null,
            to_stage: 'benched',
            notes: reason || 'Assignment cancelled',
          },
        });
      }

      return updatedAssignment;
    });

    return result;
  }
}

export default new ProjectAssignmentService();
