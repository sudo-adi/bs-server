import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { CODE_ENTITY_TYPES } from '@/constants/codes';
import {
  ASSIGNMENT_STATUSES,
  PROFILE_STAGES,
  canAllocateToProject,
} from '@/constants/stages';
import {
  AssignWorkerToProjectRequest,
  RemoveWorkerFromProjectRequest,
} from '@/dtos/project';
import codeManagerService from '@/services/code/codeManager.service';
import { nextWorkerStageService } from '@/services/profile/nextWorkerStage.service';
import {
  checkWorkerAvailability,
  logAvailabilityEvent,
  removeAvailabilityEvent,
} from '@/utils/workerAvailability';
import { isValidUUID, updateProfileStageWithHistory } from '../helpers';
import { WORKER_PROFILE_SELECT } from '../helpers/worker.helpers';

/**
 * Response type for worker assignment with potential BSC→BSW conversion
 */
export interface WorkerAssignmentResult {
  id: string;
  projectId: string | null;
  profileId: string | null;
  stage: string | null;
  matchedAt: Date | null;
  convertedToWorker: boolean;
  previousStage: string | null;
  newWorkerCode: string | null;
  profile: any;
}

/**
 * Assign a worker to a project
 * If the profile is a TRAINED candidate with only BSC code, auto-converts to worker (BSW)
 */
export async function assignWorkerToProject(
  projectId: string,
  data: AssignWorkerToProjectRequest,
  assignedByProfileId: string
): Promise<WorkerAssignmentResult> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const profile = await prisma.profile.findUnique({
      where: { id: data.profileId, deletedAt: null },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (!canAllocateToProject(profile.currentStage)) {
      throw new Error(
        `Only benched workers or trained candidates can be allocated. Current stage: ${profile.currentStage}`
      );
    }

    // Check if profile is blue-collar
    if (profile.workerType !== 'blue') {
      throw new Error(
        `Only blue-collar workers can be assigned to projects. Worker type: ${profile.workerType}`
      );
    }

    const existingAssignment = await prisma.projectWorkerAssignment.findFirst({
      where: { projectId, profileId: data.profileId, removedAt: null },
    });

    if (existingAssignment) {
      throw new Error('Profile is already assigned to this project');
    }

    if (project.startDate && project.endDate) {
      const availability = await checkWorkerAvailability(
        data.profileId,
        project.startDate,
        project.endDate,
        projectId
      );

      if (!availability.isAvailable) {
        const conflicts = availability.blockingEvents.map((event) => {
          const startStr = event.startDate.toISOString().split('T')[0];
          const endStr = event.endDate.toISOString().split('T')[0];
          return `${event.type}: ${event.entityName} (${startStr} - ${endStr})`;
        });
        throw new Error(`Profile has overlapping commitments:\n${conflicts.join('\n')}`);
      }
    }

    const now = new Date();
    const previousStage = profile.currentStage;

    // Check if we need to convert BSC (candidate) to BSW (worker)
    const needsConversion: boolean =
      profile.currentStage === PROFILE_STAGES.TRAINED &&
      !!profile.candidateCode &&
      !profile.workerCode;

    let newWorkerCode: string | null = null;

    // Generate worker code if conversion is needed
    if (needsConversion) {
      newWorkerCode = await codeManagerService.generateNextCode(CODE_ENTITY_TYPES.WORKER);
      logger.info('Converting candidate to worker', {
        profileId: data.profileId,
        candidateCode: profile.candidateCode,
        newWorkerCode,
      });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      // If conversion needed, update profile with worker code and change profileType
      if (needsConversion && newWorkerCode) {
        await tx.profile.update({
          where: { id: data.profileId },
          data: {
            profileType: 'worker', // Convert candidate to worker
            workerCode: newWorkerCode,
            workerCodeAssignedAt: now,
            workerConvertedAt: now,
          },
        });

        // Log the conversion in stage history
        // Only use assignedByProfileId if it's a valid UUID, otherwise use null
        const validAssignedById = isValidUUID(assignedByProfileId) ? assignedByProfileId : null;
        await tx.profileStageHistory.create({
          data: {
            profileId: data.profileId,
            previousStage: PROFILE_STAGES.TRAINED,
            newStage: PROFILE_STAGES.TRAINED, // Stage stays same, code changes
            changedByProfileId: validAssignedById,
            changedAt: now,
            reason: `Converted to worker: ${newWorkerCode} for project ${project.name}`,
            metadata: {
              projectId,
              conversionType: 'BSC_TO_BSW',
              candidateCode: profile.candidateCode,
              workerCode: newWorkerCode,
            },
          },
        });
      }

      // Create the assignment
      // Only use assignedByProfileId if it's a valid UUID
      const validAssignedByIdForAssignment = isValidUUID(assignedByProfileId) ? assignedByProfileId : null;
      const created = await tx.projectWorkerAssignment.create({
        data: {
          projectId,
          profileId: data.profileId,
          matchedAt: now,
          assignedByProfileId: validAssignedByIdForAssignment,
          stage: ASSIGNMENT_STATUSES.MATCHED,
        },
        include: {
          profile: { select: WORKER_PROFILE_SELECT },
        },
      });

      // Update profile stage to MATCHED
      await updateProfileStageWithHistory(
        tx,
        data.profileId,
        previousStage || PROFILE_STAGES.BENCHED,
        PROFILE_STAGES.MATCHED,
        assignedByProfileId,
        `Matched to project: ${project.name}${needsConversion ? ` (converted to worker ${newWorkerCode})` : ''}`,
        { projectId, convertedToWorker: needsConversion, newWorkerCode }
      );

      return created;
    });

    if (project.startDate && project.endDate) {
      await logAvailabilityEvent(data.profileId, 'PROJECT', projectId, project.startDate, project.endDate, 'ASSIGNED');
    }

    logger.info('Worker assigned to project', {
      projectId,
      profileId: data.profileId,
      assignmentId: assignment.id,
      convertedToWorker: needsConversion,
      newWorkerCode,
    });

    return {
      ...assignment,
      convertedToWorker: needsConversion,
      previousStage: previousStage || null,
      newWorkerCode,
    };
  } catch (error: any) {
    logger.error('Error assigning worker to project', { error, projectId, profileId: data.profileId });
    throw new Error(error.message || 'Failed to assign worker to project');
  }
}

/**
 * Remove a worker from a project
 */
export async function removeWorkerFromProject(
  projectId: string,
  assignmentId: string,
  data: RemoveWorkerFromProjectRequest,
  removedByProfileId: string
): Promise<void> {
  try {
    const assignment = await prisma.projectWorkerAssignment.findUnique({
      where: { id: assignmentId },
      include: { profile: true, project: true },
    });

    if (!assignment || assignment.projectId !== projectId) {
      throw new Error('Assignment not found');
    }

    if (assignment.removedAt) {
      throw new Error('Worker is already removed from this project');
    }

    const now = new Date();
    const isBeforeStart = assignment.project?.actualStartDate
      ? now < assignment.project.actualStartDate
      : true;

    await prisma.$transaction(async (tx) => {
      await tx.projectWorkerAssignment.update({
        where: { id: assignmentId },
        data: {
          removedAt: now,
          removedByProfileId,
          removalReason: data.reason,
          stage: ASSIGNMENT_STATUSES.REMOVED,
        },
      });

      if (assignment.profileId) {
        // Use the new nextWorkerStageService for consistent stage determination
        const newStage = await nextWorkerStageService.getNextStageSimple(
          tx,
          assignment.profileId,
          projectId,
          isBeforeStart
        );

        await updateProfileStageWithHistory(
          tx,
          assignment.profileId,
          assignment.profile?.currentStage || PROFILE_STAGES.ON_SITE,
          newStage,
          removedByProfileId,
          `Removed from project: ${assignment.project?.name} - ${data.reason}`,
          { projectId, nextStage: newStage }
        );
      }
    });

    if (assignment.profileId) {
      await removeAvailabilityEvent(assignment.profileId, 'PROJECT', projectId);
    }

    logger.info('Worker removed from project', { projectId, assignmentId });
  } catch (error: any) {
    logger.error('Error removing worker from project', { error, projectId, assignmentId });
    throw new Error(error.message || 'Failed to remove worker from project');
  }
}

/**
 * Bulk assign workers to a project
 */
export async function bulkAssignWorkersToProject(
  projectId: string,
  workers: { profileId: string; skillCategoryId?: string }[],
  assignedByProfileId: string
): Promise<{ success: number; failed: number; assignments: any[]; errors: { profileId: string; error: string }[] }> {
  const assignments: any[] = [];
  const errors: { profileId: string; error: string }[] = [];

  for (const worker of workers) {
    try {
      const assignment = await assignWorkerToProject(projectId, { profileId: worker.profileId }, assignedByProfileId);
      assignments.push(assignment);
    } catch (error) {
      errors.push({ profileId: worker.profileId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { success: assignments.length, failed: errors.length, assignments, errors };
}

/**
 * Bulk remove workers from a project
 */
export async function bulkRemoveWorkersFromProject(
  projectId: string,
  assignmentIds: string[],
  reason: string,
  removedByProfileId: string
): Promise<{ success: number; failed: number; errors: { assignmentId: string; error: string }[] }> {
  const errors: { assignmentId: string; error: string }[] = [];
  let successCount = 0;

  for (const assignmentId of assignmentIds) {
    try {
      await removeWorkerFromProject(projectId, assignmentId, { reason }, removedByProfileId);
      successCount++;
    } catch (error) {
      errors.push({ assignmentId, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { success: successCount, failed: errors.length, errors };
}
