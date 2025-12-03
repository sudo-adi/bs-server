import prisma from '@/config/prisma';
import { AssignmentValidationResult } from '@/types';

/**
 * Validation Operation for Worker-Project Assignments
 * Implements Rules 2-4:
 * - Rule 2: Worker must be trained or benched
 * - Rule 3: Cannot add if in training
 * - Rule 4: No overlapping project dates
 */
export class ValidateAssignmentOperation {
  /**
   * Validate if a worker can be assigned to a project
   * @param profileId - Worker profile ID
   * @param projectId - Project ID
   * @returns ValidationResult with conflicts if any
   */
  async validateWorkerAssignment(
    profileId: string,
    projectId: string
  ): Promise<AssignmentValidationResult> {
    // Get worker's current stage
    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        current_stage: true,
        candidate_code: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!profile) {
      return {
        valid: false,
        error: 'Worker profile not found',
      };
    }

    // Rule 2: Check worker stage - must be trained or benched
    if (!profile.current_stage || !['trained', 'benched'].includes(profile.current_stage)) {
      return {
        valid: false,
        error: `Worker must be in 'trained' or 'benched' stage. Current stage: ${profile.current_stage || 'unknown'}`,
      };
    }

    // Get project details
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        start_date: true,
        end_date: true,
      },
    });

    if (!project) {
      return {
        valid: false,
        error: 'Project not found',
      };
    }

    // Check project status - cannot be completed/terminated/short_closed
    if (project.status && ['completed', 'terminated', 'short_closed'].includes(project.status)) {
      return {
        valid: false,
        error: `Cannot add workers to ${project.status} projects`,
      };
    }

    // Check if worker is already assigned to THIS project
    const existingAssignment = await prisma.project_worker_assignments.findFirst({
      where: {
        project_id: projectId,
        profile_id: profileId,
        removed_at: null,
      },
    });

    if (existingAssignment) {
      return {
        valid: false,
        error: `Worker is already assigned to this project`,
      };
    }

    // Rule 4: Check for overlapping project assignments
    const overlappingProjects = await prisma.$queryRaw<
      {
        project_id: string;
        project_code: string;
        project_name: string;
        start_date: Date;
        end_date: Date;
      }[]
    >`
      SELECT
        p.id as project_id,
        p.code as project_code,
        p.name as project_name,
        p.start_date,
        p.end_date
      FROM project_worker_assignments pwa
      JOIN projects p ON pwa.project_id = p.id
      WHERE pwa.profile_id = ${profileId}::uuid
        AND pwa.removed_at IS NULL
        AND p.start_date <= ${project.end_date || new Date()}
        AND p.end_date >= ${project.start_date || new Date()}
    `;

    if (overlappingProjects.length > 0) {
      const conflicts = overlappingProjects.map((proj) => {
        const overlapStart = new Date(
          Math.max(proj.start_date.getTime(), project.start_date!.getTime())
        );
        const overlapEnd = new Date(
          Math.min(proj.end_date.getTime(), project.end_date!.getTime())
        );
        const overlapDays = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          type: 'project' as const,
          id: proj.project_id,
          code: proj.project_code,
          name: proj.project_name,
          start_date: proj.start_date,
          end_date: proj.end_date,
          overlap_days: overlapDays,
        };
      });

      return {
        valid: false,
        error: `Worker has overlapping project assignments`,
        conflicts,
      };
    }

    // Rule 3: Check for training conflicts
    const overlappingTraining = await prisma.$queryRaw<
      {
        batch_id: string;
        batch_code: string;
        batch_name: string;
        start_date: Date;
        end_date: Date;
      }[]
    >`
      SELECT
        tb.id as batch_id,
        tb.code as batch_code,
        tb.name as batch_name,
        tb.start_date,
        tb.end_date
      FROM batch_enrollments be
      JOIN training_batches tb ON be.batch_id = tb.id
      WHERE be.profile_id = ${profileId}::uuid
        AND be.status IN ('enrolled', 'in_progress')
        AND tb.start_date <= ${project.end_date || new Date()}
        AND tb.end_date >= ${project.start_date || new Date()}
    `;

    if (overlappingTraining.length > 0) {
      const conflicts = overlappingTraining.map((batch) => {
        const overlapStart = new Date(
          Math.max(batch.start_date.getTime(), project.start_date!.getTime())
        );
        const overlapEnd = new Date(
          Math.min(batch.end_date.getTime(), project.end_date!.getTime())
        );
        const overlapDays = Math.ceil(
          (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          type: 'training' as const,
          id: batch.batch_id,
          code: batch.batch_code,
          name: batch.batch_name,
          start_date: batch.start_date,
          end_date: batch.end_date,
          overlap_days: overlapDays,
        };
      });

      return {
        valid: false,
        error: `Worker is in training during project dates`,
        conflicts,
      };
    }

    // All validations passed
    return {
      valid: true,
    };
  }
  
  async validateBulkAssignments(
    profileIds: string[],
    projectId: string
  ): Promise<Map<string, AssignmentValidationResult>> {
    const results = new Map<string, AssignmentValidationResult>();

    for (const profileId of profileIds) {
      const result = await this.validateWorkerAssignment(profileId, projectId);
      results.set(profileId, result);
    }

    return results;
  }
}

export default ValidateAssignmentOperation;
