import prisma from '@/config/prisma';
import logger from '@/config/logger';
import type { projects } from '@/generated/prisma';
import type { ChangeProjectStatusDto, ProjectStatusChangeResponse } from '@/types/project-status.types';
import type {
  CompleteProjectDto,
  HoldProjectDto,
  ResumeProjectDto,
  ShortCloseProjectDto,
  StartProjectDto,
  StatusTransitionRequestDto,
  TerminateProjectDto,
} from '@/dtos/project-status.dto';
import { ProjectStatusValidator } from '../domain/project-status-validator';
import { ProjectWorkerStateManager } from '../domain/project-worker-state-manager';
import { ProjectStatus } from '@/types/enums';

export class ProjectStatusTransitionOperation {
  /**
   * Transition project to a new status
   */
  static async transition(
    projectId: string,
    dto: ChangeProjectStatusDto
  ): Promise<ProjectStatusChangeResponse> {
    try {
      // Get current project
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Validate transition
      const validation = ProjectStatusValidator.validateTransition(
        project,
        dto.to_status! as any,
        dto.attributable_to as any,
        dto.documents
      );

      if (!validation.valid) {
        throw new Error(`Status transition validation failed: ${validation.errors.join(', ')}`);
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        logger.warn('Status transition warnings', {
          projectId,
          warnings: validation.warnings,
        });
      }

      // Create status history record
      const statusHistory = await prisma.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status,
          to_status: dto.to_status!,
          change_reason: dto.change_reason,
          attributable_to: dto.attributable_to,
          status_date: dto.status_date!,
          changed_by_user_id: dto.changed_by_user_id!,
        },
      });

      logger.info('Created status history record', { statusHistoryId: statusHistory.id });

      // Create documents if provided
      const documents = [];
      if (dto.documents && dto.documents.length > 0) {
        for (const doc of dto.documents) {
          const document = await prisma.project_status_documents.create({
            data: {
              project_status_history_id: statusHistory.id,
              project_id: projectId,
              status: dto.to_status!,
              document_title: doc.document_title,
              file_url: doc.file_url,
              uploaded_by_user_id: doc.uploaded_by_user_id || dto.changed_by_user_id,
            },
          });
          documents.push(document);
        }
        logger.info(`Created ${documents.length} status documents`);
      }

      // Update project status and metadata
      const updateData: any = {
        status: dto.to_status,
        status_changed_at: new Date(),
        status_change_reason: dto.change_reason,
        updated_at: new Date(),
      };

      // Update attributable_to for ON_HOLD
      if (dto.to_status === ProjectStatus.ON_HOLD) {
        updateData.current_attributable_to = dto.attributable_to;
      } else {
        // Clear attributable_to when leaving ON_HOLD
        updateData.current_attributable_to = null;
      }

      const updatedProject = await prisma.projects.update({
        where: { id: projectId },
        data: updateData,
      });

      logger.info('Updated project status', {
        projectId,
        fromStatus: project.status,
        toStatus: dto.to_status,
      });

      // Handle worker state changes
      const workerResults = await ProjectWorkerStateManager.handleStatusChange(
        projectId,
        dto.to_status,
        dto.attributable_to
      );

      logger.info(`Processed ${workerResults.length} worker state changes`, {
        projectId,
        successful: workerResults.filter((r) => r.success).length,
        failed: workerResults.filter((r) => !r.success).length,
      });

      return {
        success: true,
        project: updatedProject,
        status_history: statusHistory,
        documents,
        affected_workers: workerResults.length,
      };
    } catch (error) {
      logger.error('Error transitioning project status', { error, projectId, dto });
      throw error;
    }
  }

  /**
   * Start project (move from WORKERS_SHARED to ONGOING)
   */
  static async start(
    projectId: string,
    actualStartDate: Date,
    changedByUserId: string
  ): Promise<ProjectStatusChangeResponse> {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    if (project.status !== ProjectStatus.WORKERS_SHARED) {
      throw new Error(
        `Project must be in WORKERS_SHARED status to start. Current status: ${project.status}`
      );
    }

    // Update actual start date
    await prisma.projects.update({
      where: { id: projectId },
      data: { actual_start_date: actualStartDate },
    });

    // Update assignments to active
    await prisma.project_worker_assignments.updateMany({
      where: {
        project_id: projectId,
        status: 'assigned',
      },
      data: {
        status: 'active',
        deployed_date: actualStartDate,
      },
    });

    return this.transition(projectId, {
      to_status: ProjectStatus.ONGOING,
      change_reason: 'Project started',
      status_date: actualStartDate,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Update actual dates for project
   */
  static async updateActualDates(
    projectId: string,
    actualStartDate?: Date,
    actualEndDate?: Date
  ): Promise<projects> {
    const updateData: any = {};

    if (actualStartDate) {
      updateData.actual_start_date = actualStartDate;
    }

    if (actualEndDate) {
      updateData.actual_end_date = actualEndDate;
    }

    if (Object.keys(updateData).length === 0) {
      const project = await prisma.projects.findUnique({ where: { id: projectId } });
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
      return project;
    }

    updateData.updated_at = new Date();

    return await prisma.projects.update({
      where: { id: projectId },
      data: updateData,
    });
  }

  // ==================== Convenience Methods for Specific Transitions ====================

  /**
   * Generic status transition with full DTO
   */
  static async transitionStatus(
    projectId: string,
    data: StatusTransitionRequestDto
  ): Promise<ProjectStatusChangeResponse> {
    return this.transition(projectId, {
      to_status: data.to_status,
      change_reason: data.change_reason,
      attributable_to: data.attributable_to,
      status_date: data.status_date,
      documents: data.documents,
      changed_by_user_id: data.changed_by_user_id,
    });
  }

  /**
   * Hold project with documents and attributable party
   */
  static async holdProject(
    projectId: string,
    data: HoldProjectDto & { changed_by_user_id: string }
  ): Promise<ProjectStatusChangeResponse> {
    return this.transition(projectId, {
      to_status: ProjectStatus.ON_HOLD,
      change_reason: data.change_reason,
      attributable_to: data.attributable_to,
      status_date: data.status_date,
      documents: data.documents,
      changed_by_user_id: data.changed_by_user_id,
    });
  }

  /**
   * Resume project from hold
   */
  static async resumeProject(
    projectId: string,
    data: ResumeProjectDto & { changed_by_user_id: string }
  ): Promise<ProjectStatusChangeResponse> {
    return this.transition(projectId, {
      to_status: ProjectStatus.ONGOING,
      change_reason: data.change_reason,
      status_date: data.status_date,
      changed_by_user_id: data.changed_by_user_id,
    });
  }

  /**
   * Start project (transition to ONGOING from WORKERS_SHARED)
   */
  static async startProject(
    projectId: string,
    data: StartProjectDto & { changed_by_user_id: string }
  ): Promise<ProjectStatusChangeResponse> {
    // Update actual start date
    await prisma.projects.update({
      where: { id: projectId },
      data: { actual_start_date: data.actual_start_date },
    });

    // Update assignments to active
    await prisma.project_worker_assignments.updateMany({
      where: {
        project_id: projectId,
        status: 'assigned',
      },
      data: {
        status: 'active',
        deployed_date: data.actual_start_date,
      },
    });

    return this.transition(projectId, {
      to_status: ProjectStatus.ONGOING,
      change_reason: 'Project started',
      status_date: data.status_date,
      changed_by_user_id: data.changed_by_user_id,
    });
  }

  /**
   * Complete project
   */
  static async completeProject(
    projectId: string,
    data: CompleteProjectDto & { changed_by_user_id: string }
  ): Promise<ProjectStatusChangeResponse> {
    // Update actual end date
    await prisma.projects.update({
      where: { id: projectId },
      data: { actual_end_date: data.actual_end_date },
    });

    return this.transition(projectId, {
      to_status: ProjectStatus.COMPLETED,
      change_reason: data.change_reason,
      status_date: data.status_date,
      documents: data.documents,
      changed_by_user_id: data.changed_by_user_id,
    });
  }

  /**
   * Short close project (early completion - all workers to BENCHED)
   */
  static async shortCloseProject(
    projectId: string,
    data: ShortCloseProjectDto & { changed_by_user_id: string }
  ): Promise<ProjectStatusChangeResponse> {
    // Update actual end date
    await prisma.projects.update({
      where: { id: projectId },
      data: { actual_end_date: data.actual_end_date },
    });

    return this.transition(projectId, {
      to_status: ProjectStatus.SHORT_CLOSED,
      change_reason: data.change_reason,
      status_date: data.status_date,
      documents: data.documents,
      changed_by_user_id: data.changed_by_user_id,
    });
  }

  /**
   * Terminate project with worker rollback to previous stage
   */
  static async terminateProject(
    projectId: string,
    data: TerminateProjectDto & { changed_by_user_id: string }
  ): Promise<ProjectStatusChangeResponse> {
    // Update actual end date if provided
    if (data.actual_end_date) {
      await prisma.projects.update({
        where: { id: projectId },
        data: { actual_end_date: data.actual_end_date },
      });
    }

    return this.transition(projectId, {
      to_status: ProjectStatus.TERMINATED,
      change_reason: data.change_reason,
      status_date: data.status_date,
      documents: data.documents,
      changed_by_user_id: data.changed_by_user_id,
    });
  }
}
