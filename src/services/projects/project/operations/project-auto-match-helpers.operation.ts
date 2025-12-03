import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { AddWorkerOperation } from '../../projectWorkerAssignment/operations/add-worker.operation';
import { ProjectMatchableWorkersQuery } from '../queries/project-matchable-workers.query';

/**
 * Auto-Match Helpers Operation
 * Automatically matches workers with "Helper" skill category to a project
 * Only works for the Helper skill category - other skills must be manually assigned
 */
export class ProjectAutoMatchHelpersOperation {
  private addWorkerOperation: AddWorkerOperation;

  constructor() {
    this.addWorkerOperation = new AddWorkerOperation();
  }

  /**
   * Auto-match helpers to a project based on project requirements
   * @param projectId - Project ID to auto-match helpers for
   * @param userId - User ID performing the auto-match
   * @returns Results with success/failure counts and assignments
   */
  async autoMatchHelpers(
    projectId: string,
    userId: string
  ): Promise<{
    success: number;
    failed: number;
    required_count: number;
    available_count: number;
    assignments: any[];
    errors: { profile_id: string; worker_name: string; error: string }[];
    message: string;
  }> {
    // Step 1: Get project with requirements
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Step 2: Find the "Helper" skill category requirement
    const helperRequirement = project.project_resource_requirements.find(
      (req) => req.skill_categories?.name?.toLowerCase() === 'helper'
    );

    if (!helperRequirement) {
      throw new AppError(
        'No Helper skill category requirement found for this project. Please add Helper requirement first.',
        404
      );
    }

    if (!helperRequirement.skill_category_id) {
      throw new AppError('Invalid skill category ID for Helper requirement', 400);
    }

    const requiredCount = helperRequirement.required_count;

    // Step 3: Check how many helpers are already assigned
    const existingHelperAssignments = await prisma.project_worker_assignments.count({
      where: {
        project_id: projectId,
        skill_category_id: helperRequirement.skill_category_id,
        removed_at: null,
      },
    });

    const remainingNeeded = requiredCount - existingHelperAssignments;

    if (remainingNeeded <= 0) {
      return {
        success: 0,
        failed: 0,
        required_count: requiredCount,
        available_count: 0,
        assignments: [],
        errors: [],
        message: `All ${requiredCount} helper positions are already filled. ${existingHelperAssignments} helpers currently assigned.`,
      };
    }

    // Step 4: Get available helper workers
    const { workers: availableHelpers, total } =
      await ProjectMatchableWorkersQuery.getMatchableWorkersForSkill(
        projectId,
        helperRequirement.skill_category_id,
        {
          limit: remainingNeeded, // Only get the number we need
        }
      );

    if (availableHelpers.length === 0) {
      return {
        success: 0,
        failed: 0,
        required_count: requiredCount,
        available_count: 0,
        assignments: [],
        errors: [],
        message: `No available helper workers found. Need ${remainingNeeded} more helpers, but 0 are available.`,
      };
    }

    // Step 5: Auto-assign helpers
    const workersToAssign = availableHelpers.slice(0, remainingNeeded).map((worker) => ({
      profile_id: worker.id,
      skill_category_id: helperRequirement.skill_category_id!,
    }));

    const result = await this.addWorkerOperation.bulkAddWorkers(
      projectId,
      userId,
      workersToAssign
    );

    // Step 6: Enhance error messages with worker names
    const enhancedErrors = result.errors.map((error) => {
      const worker = availableHelpers.find((w) => w.id === error.profile_id);
      return {
        ...error,
        worker_name: worker
          ? `${worker.first_name} ${worker.last_name || ''}`.trim()
          : 'Unknown',
      };
    });

    // Step 7: Build result message
    let message = '';
    if (result.success > 0 && result.failed === 0) {
      message = `Successfully auto-matched ${result.success} helper(s) to the project.`;
    } else if (result.success > 0 && result.failed > 0) {
      message = `Partially completed: ${result.success} helper(s) matched successfully, ${result.failed} failed.`;
    } else {
      message = `Failed to match any helpers. ${result.failed} worker(s) could not be assigned.`;
    }

    return {
      success: result.success,
      failed: result.failed,
      required_count: requiredCount,
      available_count: total,
      assignments: result.assignments,
      errors: enhancedErrors,
      message,
    };
  }

  /**
   * Get auto-match preview - shows what would happen without actually matching
   * @param projectId - Project ID
   * @returns Preview information
   */
  async getAutoMatchPreview(projectId: string): Promise<{
    can_auto_match: boolean;
    required_count: number;
    already_assigned: number;
    remaining_needed: number;
    available_count: number;
    workers_to_match: any[];
    message: string;
  }> {
    // Get project with requirements
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Find the "Helper" skill category requirement
    const helperRequirement = project.project_resource_requirements.find(
      (req) => req.skill_categories?.name?.toLowerCase() === 'helper'
    );

    if (!helperRequirement || !helperRequirement.skill_category_id) {
      return {
        can_auto_match: false,
        required_count: 0,
        already_assigned: 0,
        remaining_needed: 0,
        available_count: 0,
        workers_to_match: [],
        message: 'No Helper skill category requirement found for this project.',
      };
    }

    const requiredCount = helperRequirement.required_count;

    // Check existing assignments
    const existingHelperAssignments = await prisma.project_worker_assignments.count({
      where: {
        project_id: projectId,
        skill_category_id: helperRequirement.skill_category_id,
        removed_at: null,
      },
    });

    const remainingNeeded = requiredCount - existingHelperAssignments;

    // Get available helpers
    const { workers: availableHelpers, total } =
      await ProjectMatchableWorkersQuery.getMatchableWorkersForSkill(
        projectId,
        helperRequirement.skill_category_id,
        {
          limit: remainingNeeded,
        }
      );

    const canAutoMatch = remainingNeeded > 0 && availableHelpers.length > 0;

    let message = '';
    if (remainingNeeded <= 0) {
      message = `All ${requiredCount} helper positions are already filled.`;
    } else if (availableHelpers.length === 0) {
      message = `Need ${remainingNeeded} helper(s), but no eligible workers are available.`;
    } else if (availableHelpers.length < remainingNeeded) {
      message = `Can match ${availableHelpers.length} helper(s) out of ${remainingNeeded} needed.`;
    } else {
      message = `Ready to match ${remainingNeeded} helper(s) from ${total} available workers.`;
    }

    return {
      can_auto_match: canAutoMatch,
      required_count: requiredCount,
      already_assigned: existingHelperAssignments,
      remaining_needed: Math.max(0, remainingNeeded),
      available_count: total,
      workers_to_match: availableHelpers.slice(0, remainingNeeded),
      message,
    };
  }
}

export default ProjectAutoMatchHelpersOperation;
