import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  ASSIGNMENT_STATUSES,
  HOLD_ATTRIBUTIONS,
  PROFILE_STAGES,
  PROJECT_STAGES,
  getHoldWorkerStage,
} from '@/constants/stages';
import {
  CancelProjectRequest,
  CompleteProjectRequest,
  HoldProjectRequest,
  ProjectResponseDto,
  ResumeProjectRequest,
  ShareProjectRequest,
  ShortCloseProjectRequest,
  StartPlanningRequest,
  StartProjectRequest,
  TerminateProjectRequest,
} from '@/dtos/project';
import { nextWorkerStageService } from '@/services/profile/nextWorkerStage.service';
import {
  getProjectOrThrow,
  logProjectStageChange,
  updateProfileStageWithHistory,
} from './helpers/project.helpers';

/**
 * Helper function to link documents to a stage history record
 */
async function linkDocumentsToStageHistory(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  stageHistoryId: string,
  documentIds: string[]
): Promise<void> {
  if (!documentIds || documentIds.length === 0) return;

  await tx.projectDocument.updateMany({
    where: { id: { in: documentIds } },
    data: { stageHistoryId },
  });
}

export class ProjectStatusService {
  /**
   * Start planning for a project
   * Transition: APPROVED → PLANNING
   */
  async startPlanning(
    id: string,
    data: StartPlanningRequest
  ): Promise<ProjectResponseDto> {
    try {
      const existingProject = await getProjectOrThrow(id);

      if (existingProject.stage !== PROJECT_STAGES.APPROVED) {
        throw new Error(
          `Cannot start planning. Project must be in APPROVED stage. Current stage: ${existingProject.stage}`
        );
      }

      const previousStage = existingProject.stage;
      const now = new Date();

      const result = await prisma.$transaction(async (tx) => {
        const project = await tx.project.update({
          where: { id },
          data: {
            stage: PROJECT_STAGES.PLANNING,
            stageChangedAt: now,
            stageChangeReason: data.changeReason,
            updatedAt: now,
          },
        });

        const stageHistory = await logProjectStageChange(
          tx,
          id,
          previousStage,
          PROJECT_STAGES.PLANNING,
          data.userId,
          data.changeReason
        );

        // Link documents to stage history
        if (data.documentIds && data.documentIds.length > 0 && stageHistory) {
          await linkDocumentsToStageHistory(tx, stageHistory.id, data.documentIds);
        }

        return project;
      });

      logger.info('Project moved to planning', { id, previousStage });
      return result as ProjectResponseDto;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error starting project planning', { error, id });
      throw new Error(message || 'Failed to start project planning');
    }
  }

  /**
   * Put a project on hold
   * Transition: ONGOING → ON_HOLD
   */
  async holdProject(
    id: string,
    data: HoldProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const existingProject = await getProjectOrThrow(id);

      // BUG FIX: Only allow hold from ONGOING stage
      if (existingProject.stage !== PROJECT_STAGES.ONGOING) {
        throw new Error(
          `Cannot put project on hold. Project must be in ONGOING stage. Current stage: ${existingProject.stage}`
        );
      }

      // BUG FIX: Validate attributableTo value
      const validAttributions = Object.values(HOLD_ATTRIBUTIONS);
      if (!validAttributions.includes(data.attributableTo as any)) {
        throw new Error(
          `Invalid attributableTo value: ${data.attributableTo}. Must be one of: ${validAttributions.join(', ')}`
        );
      }

      const previousStage = existingProject.stage;
      const changedByProfileId = data.userId;

      const result = await prisma.$transaction(async (tx) => {
        const project = await tx.project.update({
          where: { id },
          data: {
            stage: PROJECT_STAGES.ON_HOLD,
            onHoldAttributableTo: data.attributableTo,
            stageChangedAt: new Date(),
            stageChangeReason: data.changeReason,
            updatedAt: new Date(),
          },
        });

        const newWorkerStage = getHoldWorkerStage(data.attributableTo);
        const newAssignmentStatus =
          data.attributableTo === HOLD_ATTRIBUTIONS.EMPLOYER
            ? ASSIGNMENT_STATUSES.ON_SITE
            : ASSIGNMENT_STATUSES.ON_HOLD;

        const assignments = await tx.projectWorkerAssignment.findMany({
          where: { projectId: id, removedAt: null },
          select: { id: true, profileId: true },
        });

        await tx.projectWorkerAssignment.updateMany({
          where: { projectId: id, removedAt: null },
          data: { stage: newAssignmentStatus },
        });

        for (const assignment of assignments) {
          if (assignment.profileId) {
            await updateProfileStageWithHistory(
              tx,
              assignment.profileId,
              PROFILE_STAGES.ON_SITE,
              newWorkerStage,
              changedByProfileId,
              `Project ${project.name} put on hold - ${data.attributableTo}`,
              { projectId: id, attributableTo: data.attributableTo }
            );
          }
        }

        const stageHistory = await logProjectStageChange(
          tx,
          id,
          previousStage,
          PROJECT_STAGES.ON_HOLD,
          changedByProfileId,
          data.changeReason,
          { attributableTo: data.attributableTo }
        );

        // Link documents to stage history
        if (data.documentIds && data.documentIds.length > 0) {
          await linkDocumentsToStageHistory(tx, stageHistory.id, data.documentIds);
        }

        return project;
      });

      logger.info('Project put on hold', { id, previousStage, attributableTo: data.attributableTo });
      return result as ProjectResponseDto;
    } catch (error: any) {
      logger.error('Error putting project on hold', { error, id });
      throw new Error(error.message || 'Failed to put project on hold');
    }
  }

  /**
   * Terminate a project
   * Transition: ONSITE → TERMINATED
   */
  async terminateProject(
    id: string,
    data: TerminateProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const now = new Date();
      return await this.endProject(
        id,
        PROJECT_STAGES.TERMINATED,
        ASSIGNMENT_STATUSES.REMOVED,
        data,
        data.userId,
        {
          extraProjectData: {
            terminationDate: data.terminationDate ? new Date(data.terminationDate) : now,
            actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : now,
          },
          assignmentRemovalReason: `Project terminated: ${data.changeReason}`,
          documentIds: data.documentIds,
        }
      );
    } catch (error: any) {
      logger.error('Error terminating project', { error, id });
      throw new Error(error.message || 'Failed to terminate project');
    }
  }

  /**
   * Short-close a project
   * Transition: ONSITE → SHORT_CLOSED
   */
  async shortCloseProject(
    id: string,
    data: ShortCloseProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      return await this.endProject(
        id,
        PROJECT_STAGES.SHORT_CLOSED,
        ASSIGNMENT_STATUSES.COMPLETED,
        data,
        data.userId,
        {
          extraProjectData: {
            shortCloseDate: new Date(),
            actualEndDate: new Date(data.actualEndDate),
          },
          assignmentRemovalReason: `Project short-closed: ${data.changeReason}`,
          documentIds: data.documentIds,
        }
      );
    } catch (error: any) {
      logger.error('Error short-closing project', { error, id });
      throw new Error(error.message || 'Failed to short-close project');
    }
  }

  /**
   * Complete a project
   * Transition: ONSITE → COMPLETED
   */
  async completeProject(
    id: string,
    data: CompleteProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const now = new Date();
      return await this.endProject(
        id,
        PROJECT_STAGES.COMPLETED,
        ASSIGNMENT_STATUSES.COMPLETED,
        { ...data, changeReason: data.changeReason || 'Project completed' },
        data.userId,
        {
          extraProjectData: {
            completionDate: now,
            actualEndDate: data.actualEndDate ? new Date(data.actualEndDate) : now,
          },
          assignmentRemovalReason: `Project completed: ${data.changeReason || 'Project completed'}`,
          documentIds: data.documentIds,
        }
      );
    } catch (error: any) {
      logger.error('Error completing project', { error, id });
      throw new Error(error.message || 'Failed to complete project');
    }
  }

  /**
   * Cancel a project
   * Transition: APPROVED/PLANNING/SHARED → CANCELLED
   * IMPORTANT: Can only cancel projects that have NEVER started (never reached ONGOING)
   */
  async cancelProject(
    id: string,
    data: CancelProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const existingProject = await getProjectOrThrow(id);

      // Only allow cancellation for projects that have never started
      const neverStartedStages = [
        PROJECT_STAGES.APPROVED,
        PROJECT_STAGES.PLANNING,
        PROJECT_STAGES.SHARED,
      ];

      if (!neverStartedStages.includes(existingProject.stage as any)) {
        throw new Error(
          `Cannot cancel project after it has started. Current stage: ${existingProject.stage}. ` +
          `Use 'terminate' for ending a started project, or 'short-close' for early completion.`
        );
      }

      // Additional check: if project has actualStartDate, it means it was started at some point
      if (existingProject.actualStartDate) {
        throw new Error(
          'Cannot cancel project that has already started. Use terminate or short-close instead.'
        );
      }

      return await this.endProject(
        id,
        PROJECT_STAGES.CANCELLED,
        ASSIGNMENT_STATUSES.REMOVED,
        data,
        data.userId,
        {
          assignmentRemovalReason: `Project cancelled: ${data.changeReason}`,
          documentIds: data.documentIds,
        }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error cancelling project', { error, id });
      throw new Error(message || 'Failed to cancel project');
    }
  }

  /**
   * Resume a project from on_hold status
   * Transition: ON_HOLD → ONSITE
   */
  async resumeProject(
    id: string,
    data: ResumeProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const existingProject = await getProjectOrThrow(id);
      const changedByProfileId = data.userId;

      if (existingProject.stage !== PROJECT_STAGES.ON_HOLD) {
        throw new Error(
          `Cannot resume project. Project must be in ON_HOLD stage. Current stage: ${existingProject.stage}`
        );
      }

      const previousStage = existingProject.stage;
      const resumeToStage = data.resumeToStage || PROJECT_STAGES.ONGOING;
      const reason = data.changeReason || 'Project resumed';

      const result = await prisma.$transaction(async (tx) => {
        const project = await tx.project.update({
          where: { id },
          data: {
            stage: resumeToStage,
            onHoldAttributableTo: null,
            stageChangedAt: new Date(),
            stageChangeReason: reason,
            updatedAt: new Date(),
          },
        });

        const assignments = await tx.projectWorkerAssignment.findMany({
          where: { projectId: id, removedAt: null, stage: ASSIGNMENT_STATUSES.ON_HOLD },
        });

        for (const assignment of assignments) {
          await tx.projectWorkerAssignment.update({
            where: { id: assignment.id },
            data: { stage: ASSIGNMENT_STATUSES.ON_SITE },
          });

          if (assignment.profileId) {
            await updateProfileStageWithHistory(
              tx,
              assignment.profileId,
              PROFILE_STAGES.ON_HOLD,
              PROFILE_STAGES.ON_SITE,
              changedByProfileId,
              `Project ${project.name} resumed`,
              { projectId: id }
            );
          }
        }

        const stageHistory = await logProjectStageChange(tx, id, previousStage, resumeToStage, changedByProfileId, reason);

        // Link documents to stage history
        if (data.documentIds && data.documentIds.length > 0) {
          await linkDocumentsToStageHistory(tx, stageHistory.id, data.documentIds);
        }

        return project;
      });

      logger.info('Project resumed', { id, previousStage, resumeToStage });
      return result as ProjectResponseDto;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error resuming project', { error, id });
      throw new Error(message || 'Failed to resume project');
    }
  }

  /**
   * Share project worker details with employer
   * Transition: PLANNING → SHARED, Workers MATCHED → ASSIGNED
   */
  async shareProjectToEmployer(
    id: string,
    data: ShareProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const existingProject = await getProjectOrThrow(id);
      const sharedByProfileId = data.userId;

      if (existingProject.stage !== PROJECT_STAGES.PLANNING) {
        throw new Error(
          `Cannot share project. Project must be in PLANNING stage. Current stage: ${existingProject.stage}`
        );
      }

      const previousStage = existingProject.stage;
      const now = new Date();
      const reason = data.changeReason || 'Worker details shared with employer';

      const result = await prisma.$transaction(async (tx) => {
        const project = await tx.project.update({
          where: { id },
          data: {
            stage: PROJECT_STAGES.SHARED,
            stageChangedAt: now,
            stageChangeReason: reason,
            updatedAt: now,
          },
        });

        const assignments = await tx.projectWorkerAssignment.findMany({
          where: { projectId: id, removedAt: null, stage: ASSIGNMENT_STATUSES.MATCHED },
          include: { profile: true },
        });

        for (const assignment of assignments) {
          await tx.projectWorkerAssignment.update({
            where: { id: assignment.id },
            data: { stage: ASSIGNMENT_STATUSES.ASSIGNED, sharedAt: now, sharedByProfileId },
          });

          if (assignment.profileId) {
            await updateProfileStageWithHistory(
              tx,
              assignment.profileId,
              PROFILE_STAGES.MATCHED,
              PROFILE_STAGES.ASSIGNED,
              sharedByProfileId,
              `Shared with employer for project: ${project.name}`,
              { projectId: id }
            );
          }
        }

        const stageHistory = await logProjectStageChange(tx, id, previousStage, PROJECT_STAGES.SHARED, sharedByProfileId, reason);

        // Link documents to stage history
        if (data.documentIds && data.documentIds.length > 0) {
          await linkDocumentsToStageHistory(tx, stageHistory.id, data.documentIds);
        }

        return project;
      });

      logger.info('Project shared with employer', { id, previousStage });
      return result as ProjectResponseDto;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sharing project with employer', { error, id });
      throw new Error(message || 'Failed to share project with employer');
    }
  }

  /**
   * Start a project
   * Transition: SHARED → ONSITE, Workers ASSIGNED → ON_SITE
   */
  async startProject(
    id: string,
    data: StartProjectRequest
  ): Promise<ProjectResponseDto> {
    try {
      const existingProject = await getProjectOrThrow(id);
      const startedByProfileId = data.userId;

      if (existingProject.stage !== PROJECT_STAGES.SHARED) {
        throw new Error(
          `Cannot start project. Project must be in SHARED stage. Current stage: ${existingProject.stage}`
        );
      }

      const previousStage = existingProject.stage;
      const now = new Date();
      const reason = data.changeReason || 'Project started';

      const result = await prisma.$transaction(
        async (tx) => {
          const project = await tx.project.update({
            where: { id },
            data: {
              stage: PROJECT_STAGES.ONGOING,
              stageChangedAt: now,
              stageChangeReason: reason,
              actualStartDate: data.actualStartDate ? new Date(data.actualStartDate) : now,
              updatedAt: now,
            },
          });

          const assignments = await tx.projectWorkerAssignment.findMany({
            where: { projectId: id, removedAt: null, stage: ASSIGNMENT_STATUSES.ASSIGNED },
            include: { profile: true },
          });

          for (const assignment of assignments) {
            await tx.projectWorkerAssignment.update({
              where: { id: assignment.id },
              data: { stage: ASSIGNMENT_STATUSES.ON_SITE, deployedAt: now },
            });

            if (assignment.profileId) {
              await updateProfileStageWithHistory(
                tx,
                assignment.profileId,
                PROFILE_STAGES.ASSIGNED,
                PROFILE_STAGES.ON_SITE,
                startedByProfileId,
                `Project started: ${project.name}`,
                { projectId: id }
              );
            }
          }

          const stageHistory = await logProjectStageChange(tx, id, previousStage, PROJECT_STAGES.ONGOING, startedByProfileId, reason);

          // Link documents to stage history
          if (data.documentIds && data.documentIds.length > 0) {
            await linkDocumentsToStageHistory(tx, stageHistory.id, data.documentIds);
          }

          return project;
        },
        { timeout: 30000 }
      );

      logger.info('Project started', { id, previousStage });
      return result as ProjectResponseDto;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error starting project', { error, id });
      throw new Error(message || 'Failed to start project');
    }
  }

  /**
   * End a project (shared logic for terminate, short-close, complete, cancel)
   */
  private async endProject(
    id: string,
    targetStage: string,
    assignmentStatus: string,
    data: { changeReason?: string; actualEndDate?: string; userId: string; documentIds?: string[] },
    changedByProfileId: string,
    options: {
      setInactive?: boolean;
      extraProjectData?: Record<string, any>;
      assignmentRemovalReason?: string;
      documentIds?: string[];
    } = {}
  ): Promise<ProjectResponseDto> {
    const existingProject = await getProjectOrThrow(id);
    const previousStage = existingProject.stage;
    const now = new Date();
    const isBeforeStart = existingProject.startDate ? now < existingProject.startDate : false;

    const result = await prisma.$transaction(async (tx) => {
      const projectUpdateData: any = {
        stage: targetStage,
        stageChangedAt: now,
        stageChangeReason: data.changeReason,
        updatedAt: now,
      };

      if (options.setInactive !== false) {
        projectUpdateData.isActive = false;
      }

      if (data.actualEndDate) {
        projectUpdateData.actualEndDate = new Date(data.actualEndDate);
      }

      if (options.extraProjectData) {
        Object.assign(projectUpdateData, options.extraProjectData);
      }

      const project = await tx.project.update({
        where: { id },
        data: projectUpdateData,
      });

      const assignments = await tx.projectWorkerAssignment.findMany({
        where: { projectId: id, removedAt: null },
        include: { profile: true },
      });

      for (const assignment of assignments) {
        const assignmentUpdateData: any = { stage: assignmentStatus };

        if (
          assignmentStatus === ASSIGNMENT_STATUSES.REMOVED ||
          assignmentStatus === ASSIGNMENT_STATUSES.COMPLETED
        ) {
          assignmentUpdateData.removedAt = now;
          if (assignmentStatus === ASSIGNMENT_STATUSES.REMOVED) {
            assignmentUpdateData.removedByProfileId = changedByProfileId;
          }
          assignmentUpdateData.removalReason =
            options.assignmentRemovalReason || `Project ${targetStage}: ${data.changeReason}`;
        }

        await tx.projectWorkerAssignment.update({
          where: { id: assignment.id },
          data: assignmentUpdateData,
        });

        if (assignment.profileId) {
          // Use the new nextWorkerStageService for consistent stage determination
          const newStage = await nextWorkerStageService.getNextStageSimple(
            tx,
            assignment.profileId,
            id,
            isBeforeStart
          );

          await updateProfileStageWithHistory(
            tx,
            assignment.profileId,
            assignment.profile?.currentStage || PROFILE_STAGES.ON_SITE,
            newStage,
            changedByProfileId,
            `Project ${project.name} ${targetStage}`,
            { projectId: id, ...(isBeforeStart ? { isBeforeStart } : {}) }
          );
        }
      }

      const stageHistory = await logProjectStageChange(tx, id, previousStage, targetStage, changedByProfileId, data.changeReason);

      // Link documents to stage history
      const docIds = options.documentIds || data.documentIds;
      if (docIds && docIds.length > 0) {
        await linkDocumentsToStageHistory(tx, stageHistory.id, docIds);
      }

      return project;
    });

    logger.info(`Project ${targetStage}`, { id, previousStage, isBeforeStart });
    return result as ProjectResponseDto;
  }
}

export default new ProjectStatusService();
