import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  AssignmentConflict,
  CreateProjectWorkerAssignmentDto,
  ProjectWorkerAssignmentWithRelations,
} from '@/types';
import { ValidateAssignmentOperation } from './validate-assignment.operation';
import { CodeGenerator } from '@/utils/codeGenerator';

/**
 * Add Worker Operation
 * Implements worker stage logic based on project dates and status:
 * - If project.start_date > current date AND status = 'planning' → worker stage = 'onboarded'
 * - If project.start_date <= current date AND project status = 'workers_shared' → worker stage = 'deployed'
 * - If project.start_date > current date AND project status = 'workers_shared' → worker stage = 'allocated'
 * - If project status = 'ongoing' → worker stage = 'deployed'
 * - On_Hold (employer) → deployed
 * - On_Hold (buildsewa/force_majeure) → on_hold
 */
export class AddWorkerOperation {
  private validateOperation: ValidateAssignmentOperation;

  constructor() {
    this.validateOperation = new ValidateAssignmentOperation();
  }

  /**
   * Add a worker to a project
   * Automatically updates worker stage based on project status
   */
  async addWorkerToProject(
    dto: CreateProjectWorkerAssignmentDto
  ): Promise<ProjectWorkerAssignmentWithRelations> {
    // Step 1: Validate the assignment
    const validation = await this.validateOperation.validateWorkerAssignment(
      dto.profile_id,
      dto.project_id
    );

    if (!validation.valid) {
      if (validation.conflicts && validation.conflicts.length > 0) {
        const conflictDetails = validation.conflicts
          .map((c: AssignmentConflict) => {
            const type = c.type === 'project' ? 'Project' : 'Training';
            return `- ${type}: ${c.name} (${c.code || c.id}) - ${c.start_date.toISOString().split('T')[0]} to ${c.end_date.toISOString().split('T')[0]} (${c.overlap_days} days overlap)`;
          })
          .join('\n');

        throw new AppError(`Cannot assign worker to project. Conflicts:\n${conflictDetails}`, 400);
      }
      throw new AppError(validation.error || 'Validation failed', 400);
    }

    // Step 2: Get project and profile
    const [project, profile] = await Promise.all([
      prisma.projects.findUnique({
        where: { id: dto.project_id },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          on_hold_reason: true,
          start_date: true,
          end_date: true,
        },
      }),
      prisma.profiles.findUnique({
        where: { id: dto.profile_id },
        select: {
          id: true,
          candidate_code: true,
          first_name: true,
          last_name: true,
          current_stage: true,
        },
      }),
    ]);

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (!profile) {
      throw new AppError('Worker profile not found', 404);
    }

    // Step 3: Determine new worker stage based on project status and dates
    const currentDate = new Date();
    const projectStartDate = project.start_date ? new Date(project.start_date) : null;

    let newWorkerStage: string;
    let onboardedDate: Date | null = null;
    let deployedDate: Date | null = null;

    // Determine stage based on project status and dates
    if (project.status === 'planning') {
      // Planning project with future start date → onboarded
      if (projectStartDate && projectStartDate > currentDate) {
        newWorkerStage = 'onboarded';
        onboardedDate = new Date();
      } else {
        // Planning project with past/current start date or no date → allocated
        newWorkerStage = 'allocated';
      }
    } else if (project.status === 'workers_shared') {
      // Workers shared with start date in past → deployed
      if (projectStartDate && projectStartDate <= currentDate) {
        newWorkerStage = 'deployed';
        onboardedDate = new Date();
        deployedDate = projectStartDate; // Use project start date
      }
      // Workers shared with future start date → allocated
      else if (projectStartDate && projectStartDate > currentDate) {
        newWorkerStage = 'allocated';
      }
      // Workers shared with no start date → onboarded
      else {
        newWorkerStage = 'onboarded';
        onboardedDate = new Date();
      }
    } else if (project.status === 'ongoing') {
      // Ongoing project → deployed immediately
      newWorkerStage = 'deployed';
      onboardedDate = new Date();
      deployedDate = projectStartDate || new Date();
    } else if (project.status === 'on_hold') {
      // On hold → depends on reason
      if (project.on_hold_reason === 'employer') {
        // Employer reason → deployed
        newWorkerStage = 'deployed';
      } else {
        // BuildSewa/Force majeure → on_hold
        newWorkerStage = 'on_hold';
      }
      onboardedDate = new Date();
      deployedDate = projectStartDate || new Date();
    } else {
      throw new AppError(`Cannot add workers to projects with status: ${project.status}`, 400);
    }

    // Step 4: Create assignment and update worker stage in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the assignment
      const assignment = await tx.project_worker_assignments.create({
        data: {
          project_id: dto.project_id,
          profile_id: dto.profile_id,
          skill_category_id: dto.skill_category_id,
          assigned_by_user_id: dto.assigned_by_user_id,
          onboarded_date: onboardedDate,
          deployed_date: deployedDate,
        },
        include: {
          profiles: {
            select: {
              id: true,
              candidate_code: true,
              first_name: true,
              last_name: true,
              current_stage: true,
              phone: true,
            },
          },
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              start_date: true,
              end_date: true,
            },
          },
          skill_categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update candidate code from BST to BSW when onboarding to project
      if (profile.candidate_code?.startsWith('BST-')) {
        // Generate new worker code (BSW)
        const newCode = await CodeGenerator.generate('worker');

        // Update worker stage and code
        await tx.profiles.update({
          where: { id: dto.profile_id },
          data: {
            current_stage: newWorkerStage,
            candidate_code: newCode,
          },
        });
      } else {
        // Update worker stage only
        await tx.profiles.update({
          where: { id: dto.profile_id },
          data: { current_stage: newWorkerStage },
        });
      }

      // Create stage transition record
      await tx.stage_transitions.create({
        data: {
          profile_id: dto.profile_id,
          from_stage: profile.current_stage,
          to_stage: newWorkerStage,
          transitioned_by_user_id: dto.assigned_by_user_id,
          transitioned_at: new Date(),
          notes: `Assigned to project ${project.code} (${project.name}). Project status: ${project.status}`,
        },
      });

      // Map Prisma result to match expected type structure
      return {
        ...assignment,
        projects: assignment.projects
          ? {
              id: assignment.projects.id,
              project_name: assignment.projects.name,
              project_code: assignment.projects.code,
            }
          : undefined,
        skill_categories: assignment.skill_categories
          ? {
              id: assignment.skill_categories.id,
              category_name: assignment.skill_categories.name,
            }
          : undefined,
      } as ProjectWorkerAssignmentWithRelations;
    });

    return result;
  }

  /**
   * Bulk add workers to a project
   */
  async bulkAddWorkers(
    projectId: string,
    assignedByUserId: string,
    workers: { profile_id: string; skill_category_id: string }[]
  ): Promise<{
    success: number;
    failed: number;
    assignments: ProjectWorkerAssignmentWithRelations[];
    errors: { profile_id: string; error: string }[];
  }> {
    const assignments: ProjectWorkerAssignmentWithRelations[] = [];
    const errors: { profile_id: string; error: string }[] = [];

    for (const worker of workers) {
      try {
        const assignment = await this.addWorkerToProject({
          project_id: projectId,
          profile_id: worker.profile_id,
          skill_category_id: worker.skill_category_id,
          assigned_by_user_id: assignedByUserId,
        });
        assignments.push(assignment);
      } catch (error) {
        errors.push({
          profile_id: worker.profile_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: assignments.length,
      failed: errors.length,
      assignments,
      errors,
    };
  }
}

export default AddWorkerOperation;
