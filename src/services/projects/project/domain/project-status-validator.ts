import {
  isValidProjectStatusTransition,
  ProjectHoldAttributableTo,
  projectStatusRequiresDocuments,
  ProjectStatus,
} from '@/types/enums';
import type { StatusTransitionValidation } from '@/types';
import type { projects } from '@/generated/prisma';

export class ProjectStatusValidator {
  /**
   * Validate status transition
   */
  static validateTransition(
    project: projects,
    toStatus: ProjectStatus,
    attributableTo?: ProjectHoldAttributableTo,
    documents?: { document_title: string; file_url: string }[]
  ): StatusTransitionValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if transition is allowed
    if (!project.status) {
      errors.push('Project does not have a current status');
      return { valid: false, errors, warnings };
    }

    const fromStatus = project.status as ProjectStatus;

    if (!isValidProjectStatusTransition(fromStatus, toStatus)) {
      errors.push(
        `Invalid status transition from '${fromStatus}' to '${toStatus}'. Allowed transitions: ${this.getAllowedTransitions(fromStatus).join(', ')}`
      );
    }

    // Validate ON_HOLD specific requirements
    if (toStatus === ProjectStatus.ON_HOLD) {
      if (!attributableTo) {
        errors.push("'attributable_to' is required when putting project ON_HOLD");
      } else if (
        !Object.values(ProjectHoldAttributableTo).includes(attributableTo)
      ) {
        errors.push(`Invalid attributable_to value: ${attributableTo}`);
      }
    }

    // Validate documents requirement
    if (projectStatusRequiresDocuments(toStatus)) {
      if (!documents || documents.length === 0) {
        errors.push(`Status '${toStatus}' requires at least one document`);
      } else {
        // Validate document structure
        documents.forEach((doc, index) => {
          if (!doc.document_title || doc.document_title.trim() === '') {
            errors.push(`Document ${index + 1}: document_title is required`);
          }
          if (!doc.file_url || doc.file_url.trim() === '') {
            errors.push(`Document ${index + 1}: file_url is required`);
          }
        });
      }
    }

    // Validate WORKERS_SHARED transition - should have workers assigned
    if (toStatus === ProjectStatus.WORKERS_SHARED) {
      // This will be checked in the operation layer with actual worker count
      warnings.push('Ensure workers are assigned before sharing with employer');
    }

    // Validate ONGOING transition - should have start date
    if (toStatus === ProjectStatus.ONGOING) {
      if (!project.start_date) {
        errors.push('Project must have a start_date before going ONGOING');
      }
    }

    // Validate SHORT_CLOSED - actual_end_date must be before planned end_date
    if (toStatus === ProjectStatus.SHORT_CLOSED) {
      if (!project.end_date) {
        errors.push('Project must have an end_date to be SHORT_CLOSED');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get allowed transitions from current status
   */
  private static getAllowedTransitions(fromStatus: ProjectStatus): string[] {
    const transitions: Record<string, ProjectStatus[]> = {
      [ProjectStatus.PLANNING]: [ProjectStatus.APPROVED, ProjectStatus.CANCELLED],
      [ProjectStatus.APPROVED]: [
        ProjectStatus.WORKERS_SHARED,
        ProjectStatus.REQUIREMENT_NOT_FULFILLED,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.WORKERS_SHARED]: [ProjectStatus.ONGOING, ProjectStatus.CANCELLED],
      [ProjectStatus.REQUIREMENT_NOT_FULFILLED]: [
        ProjectStatus.WORKERS_SHARED,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.ONGOING]: [
        ProjectStatus.ON_HOLD,
        ProjectStatus.COMPLETED,
        ProjectStatus.SHORT_CLOSED,
        ProjectStatus.TERMINATED,
      ],
      [ProjectStatus.ON_HOLD]: [ProjectStatus.ONGOING, ProjectStatus.TERMINATED],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.SHORT_CLOSED]: [],
      [ProjectStatus.TERMINATED]: [],
      [ProjectStatus.CANCELLED]: [],
    };

    return transitions[fromStatus]?.map((s) => s.toString()) || [];
  }

  /**
   * Check if project can be started (transition to ONGOING)
   */
  static canStart(project: projects, workersAssignedCount: number): boolean {
    return (
      project.status === ProjectStatus.WORKERS_SHARED &&
      workersAssignedCount > 0 &&
      !!project.start_date
    );
  }

  /**
   * Check if project is delayed
   */
  static isDelayed(project: projects): boolean {
    if (!project.end_date || project.status !== ProjectStatus.ONGOING) {
      return false;
    }
    return new Date() > project.end_date;
  }

  /**
   * Calculate days remaining for project
   */
  static getDaysRemaining(project: projects): number | null {
    if (!project.end_date || project.status !== ProjectStatus.ONGOING) {
      return null;
    }
    const today = new Date();
    const endDate = new Date(project.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
