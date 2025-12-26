import prisma from '@/config/prisma';
import {
  ASSIGNMENT_STATUSES,
  ENROLLMENT_STATUSES,
  PROFILE_STAGES,
  PROJECT_STAGES,
  TRAINING_BATCH_STATUSES,
} from '@/constants/stages';
import { Prisma } from '@/generated/prisma';

/**
 * Response for next stage calculation
 */
export interface NextStageResult {
  profileId: string;
  workerCode: string | null;
  candidateCode: string | null;
  currentStage: string | null;
  currentProject: {
    id: string;
    projectCode: string | null;
    name: string | null;
    stage: string | null;
    endDate: Date | null;
  } | null;
  nextStage: string;
  reason: string;
  nextProject: {
    id: string;
    projectCode: string | null;
    name: string | null;
    stage: string | null;
    assignmentStage: string | null;
    startDate: Date | null;
    endDate: Date | null;
  } | null;
  nextTraining: {
    id: string;
    batchCode: string | null;
    programName: string | null;
    startDate: Date | null;
    endDate: Date | null;
  } | null;
  upcomingAssignments: Array<{
    projectId: string;
    projectCode: string | null;
    projectName: string | null;
    assignmentStage: string | null;
    startDate: Date | null;
  }>;
}

/**
 * Response for upcoming assignments
 */
export interface UpcomingAssignmentsResult {
  profileId: string;
  workerCode: string | null;
  currentStage: string | null;
  assignments: Array<{
    id: string;
    type: 'project';
    projectId: string;
    projectCode: string | null;
    projectName: string | null;
    projectStage: string | null;
    assignmentStage: string | null;
    startDate: Date | null;
    endDate: Date | null;
    isCurrent: boolean;
  }>;
  trainings: Array<{
    id: string;
    type: 'training';
    batchId: string;
    batchCode: string | null;
    programName: string | null;
    status: string | null;
    startDate: Date | null;
    endDate: Date | null;
  }>;
}

/**
 * Service to determine the next stage for a worker based on upcoming commitments
 */
export class NextWorkerStageService {
  /**
   * Determine the next stage for a worker after current project ends
   * Priority: ON_SITE > ASSIGNED > MATCHED > BENCHED
   */
  async getNextStage(
    profileId: string,
    excludeProjectId?: string,
    referenceDate?: Date
  ): Promise<NextStageResult> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
      select: {
        id: true,
        workerCode: true,
        candidateCode: true,
        currentStage: true,
      },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get current project (if any)
    const currentProject = await this.getCurrentProject(profileId, excludeProjectId);

    // Get next project assignment
    const nextAssignment = await this.getNextProjectAssignment(
      profileId,
      excludeProjectId,
      referenceDate
    );

    // Get next training enrollment
    const nextTraining = await this.getNextTrainingEnrollment(profileId, referenceDate);

    // Get all upcoming assignments for response
    const upcomingAssignments = await this.getUpcomingProjectAssignments(
      profileId,
      excludeProjectId,
      referenceDate
    );

    // Determine next stage based on priority
    let nextStage: string;
    let reason: string;

    if (nextAssignment) {
      const assignmentStage = nextAssignment.stage;

      if (assignmentStage === ASSIGNMENT_STATUSES.ON_SITE) {
        nextStage = PROFILE_STAGES.ON_SITE;
        reason = `Currently on site for project ${nextAssignment.project?.projectCode}`;
      } else if (assignmentStage === ASSIGNMENT_STATUSES.ASSIGNED) {
        nextStage = PROFILE_STAGES.ASSIGNED;
        reason = `Assigned to upcoming project ${nextAssignment.project?.projectCode}`;
      } else if (assignmentStage === ASSIGNMENT_STATUSES.MATCHED) {
        nextStage = PROFILE_STAGES.MATCHED;
        reason = `Matched to upcoming project ${nextAssignment.project?.projectCode}`;
      } else {
        nextStage = PROFILE_STAGES.BENCHED;
        reason = 'No active project assignments';
      }
    } else if (nextTraining) {
      // If enrolled in upcoming training
      nextStage = PROFILE_STAGES.TRAINING_SCHEDULED;
      reason = `Enrolled in upcoming training ${nextTraining.code}`;
    } else {
      // Check if worker has ever completed a project
      const hasCompletedProjects = await this.hasCompletedProjects(profileId, excludeProjectId);

      if (hasCompletedProjects) {
        nextStage = PROFILE_STAGES.BENCHED;
        reason = 'No upcoming project or training assignments';
      } else {
        // Never completed a project - return to TRAINED
        nextStage = PROFILE_STAGES.TRAINED;
        reason = 'No completed projects, returning to trained status';
      }
    }

    return {
      profileId: profile.id,
      workerCode: profile.workerCode,
      candidateCode: profile.candidateCode,
      currentStage: profile.currentStage,
      currentProject: currentProject
        ? {
            id: currentProject.id,
            projectCode: currentProject.project?.projectCode || null,
            name: currentProject.project?.name || null,
            stage: currentProject.project?.stage || null,
            endDate: currentProject.project?.endDate || null,
          }
        : null,
      nextStage,
      reason,
      nextProject: nextAssignment
        ? {
            id: nextAssignment.project?.id || '',
            projectCode: nextAssignment.project?.projectCode || null,
            name: nextAssignment.project?.name || null,
            stage: nextAssignment.project?.stage || null,
            assignmentStage: nextAssignment.stage,
            startDate: nextAssignment.project?.startDate || null,
            endDate: nextAssignment.project?.endDate || null,
          }
        : null,
      nextTraining: nextTraining
        ? {
            id: nextTraining.id,
            batchCode: nextTraining.code,
            programName: nextTraining.programName,
            startDate: nextTraining.startDate,
            endDate: nextTraining.endDate,
          }
        : null,
      upcomingAssignments: upcomingAssignments.map((a) => ({
        projectId: a.project?.id || '',
        projectCode: a.project?.projectCode || null,
        projectName: a.project?.name || null,
        assignmentStage: a.stage,
        startDate: a.project?.startDate || null,
      })),
    };
  }

  /**
   * Get the next stage for a worker, used internally during project transitions
   * This is the simplified version used by project status service
   */
  async getNextStageSimple(
    tx: Prisma.TransactionClient,
    profileId: string,
    excludeProjectId: string,
    isBeforeStart: boolean
  ): Promise<string> {
    // Check for next project assignment
    const nextAssignment = await tx.projectWorkerAssignment.findFirst({
      where: {
        profileId,
        projectId: { not: excludeProjectId },
        removedAt: null,
        project: {
          stage: {
            in: [
              PROJECT_STAGES.APPROVED,
              PROJECT_STAGES.PLANNING,
              PROJECT_STAGES.SHARED,
              PROJECT_STAGES.ONGOING,
            ],
          },
          deletedAt: null,
        },
      },
      include: { project: true },
      orderBy: { project: { startDate: 'asc' } },
    });

    if (nextAssignment) {
      const assignmentStage = nextAssignment.stage;
      if (assignmentStage === ASSIGNMENT_STATUSES.MATCHED) {
        return PROFILE_STAGES.MATCHED;
      } else if (assignmentStage === ASSIGNMENT_STATUSES.ASSIGNED) {
        return PROFILE_STAGES.ASSIGNED;
      } else if (assignmentStage === ASSIGNMENT_STATUSES.ON_SITE) {
        return PROFILE_STAGES.ON_SITE;
      }
    }

    // Check for upcoming training
    const nextTraining = await tx.trainingBatchEnrollment.findFirst({
      where: {
        profileId,
        status: ENROLLMENT_STATUSES.ENROLLED,
        batch: {
          status: { in: [TRAINING_BATCH_STATUSES.UPCOMING, TRAINING_BATCH_STATUSES.ONGOING] },
        },
      },
      include: { batch: true },
    });

    if (nextTraining) {
      if (nextTraining.batch?.status === TRAINING_BATCH_STATUSES.ONGOING) {
        return PROFILE_STAGES.IN_TRAINING;
      }
      return PROFILE_STAGES.TRAINING_SCHEDULED;
    }

    // If project hadn't started yet, check if worker ever completed a project
    if (isBeforeStart) {
      const completedProjectsCount = await tx.projectWorkerAssignment.count({
        where: {
          profileId,
          stage: ASSIGNMENT_STATUSES.COMPLETED,
          projectId: { not: excludeProjectId },
        },
      });

      if (completedProjectsCount > 0) {
        return PROFILE_STAGES.BENCHED;
      } else {
        return PROFILE_STAGES.TRAINED;
      }
    }

    return PROFILE_STAGES.BENCHED;
  }

  /**
   * Get upcoming assignments for a worker
   */
  async getUpcomingAssignments(
    profileId: string,
    includeCompleted: boolean = false
  ): Promise<UpcomingAssignmentsResult> {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
      select: {
        id: true,
        workerCode: true,
        currentStage: true,
      },
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Build project assignment query
    const assignmentWhere: Prisma.ProjectWorkerAssignmentWhereInput = {
      profileId,
      removedAt: null,
      project: { deletedAt: null },
    };

    if (!includeCompleted) {
      assignmentWhere.stage = { not: ASSIGNMENT_STATUSES.COMPLETED };
    }

    const projectAssignments = await prisma.projectWorkerAssignment.findMany({
      where: assignmentWhere,
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            stage: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { project: { startDate: 'asc' } },
    });

    // Get training enrollments
    const trainingEnrollments = await prisma.trainingBatchEnrollment.findMany({
      where: {
        profileId,
        status: includeCompleted
          ? undefined
          : { in: [ENROLLMENT_STATUSES.ENROLLED] },
        batch: {
          status: includeCompleted
            ? undefined
            : { in: [TRAINING_BATCH_STATUSES.UPCOMING, TRAINING_BATCH_STATUSES.ONGOING] },
        },
      },
      include: {
        batch: {
          select: {
            id: true,
            code: true,
            programName: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { batch: { startDate: 'asc' } },
    });

    // Determine current project
    const currentAssignment = projectAssignments.find(
      (a) =>
        a.stage === ASSIGNMENT_STATUSES.ON_SITE &&
        a.project?.stage === PROJECT_STAGES.ONGOING
    );

    return {
      profileId: profile.id,
      workerCode: profile.workerCode,
      currentStage: profile.currentStage,
      assignments: projectAssignments.map((a) => ({
        id: a.id,
        type: 'project' as const,
        projectId: a.project?.id || '',
        projectCode: a.project?.projectCode || null,
        projectName: a.project?.name || null,
        projectStage: a.project?.stage || null,
        assignmentStage: a.stage,
        startDate: a.project?.startDate || null,
        endDate: a.project?.endDate || null,
        isCurrent: currentAssignment?.id === a.id,
      })),
      trainings: trainingEnrollments.map((e) => ({
        id: e.id,
        type: 'training' as const,
        batchId: e.batch?.id || '',
        batchCode: e.batch?.code || null,
        programName: e.batch?.programName || null,
        status: e.status,
        startDate: e.batch?.startDate || null,
        endDate: e.batch?.endDate || null,
      })),
    };
  }

  // ==================== Private Helper Methods ====================

  private async getCurrentProject(profileId: string, excludeProjectId?: string) {
    return prisma.projectWorkerAssignment.findFirst({
      where: {
        profileId,
        removedAt: null,
        stage: ASSIGNMENT_STATUSES.ON_SITE,
        ...(excludeProjectId ? { projectId: { not: excludeProjectId } } : {}),
        project: {
          stage: PROJECT_STAGES.ONGOING,
          deletedAt: null,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            stage: true,
            endDate: true,
          },
        },
      },
    });
  }

  private async getNextProjectAssignment(
    profileId: string,
    excludeProjectId?: string,
    referenceDate?: Date
  ) {
    const refDate = referenceDate || new Date();

    return prisma.projectWorkerAssignment.findFirst({
      where: {
        profileId,
        removedAt: null,
        ...(excludeProjectId ? { projectId: { not: excludeProjectId } } : {}),
        project: {
          stage: {
            in: [
              PROJECT_STAGES.APPROVED,
              PROJECT_STAGES.PLANNING,
              PROJECT_STAGES.SHARED,
              PROJECT_STAGES.ONGOING,
            ],
          },
          deletedAt: null,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            stage: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { project: { startDate: 'asc' } },
    });
  }

  private async getUpcomingProjectAssignments(
    profileId: string,
    excludeProjectId?: string,
    referenceDate?: Date
  ) {
    return prisma.projectWorkerAssignment.findMany({
      where: {
        profileId,
        removedAt: null,
        ...(excludeProjectId ? { projectId: { not: excludeProjectId } } : {}),
        project: {
          stage: {
            in: [
              PROJECT_STAGES.APPROVED,
              PROJECT_STAGES.PLANNING,
              PROJECT_STAGES.SHARED,
              PROJECT_STAGES.ONGOING,
            ],
          },
          deletedAt: null,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            stage: true,
            startDate: true,
          },
        },
      },
      orderBy: { project: { startDate: 'asc' } },
    });
  }

  private async getNextTrainingEnrollment(profileId: string, referenceDate?: Date) {
    const enrollment = await prisma.trainingBatchEnrollment.findFirst({
      where: {
        profileId,
        status: ENROLLMENT_STATUSES.ENROLLED,
        batch: {
          status: { in: [TRAINING_BATCH_STATUSES.UPCOMING, TRAINING_BATCH_STATUSES.ONGOING] },
        },
      },
      include: { batch: true },
      orderBy: { batch: { startDate: 'asc' } },
    });

    return enrollment?.batch || null;
  }

  private async hasCompletedProjects(
    profileId: string,
    excludeProjectId?: string
  ): Promise<boolean> {
    const count = await prisma.projectWorkerAssignment.count({
      where: {
        profileId,
        stage: ASSIGNMENT_STATUSES.COMPLETED,
        ...(excludeProjectId ? { projectId: { not: excludeProjectId } } : {}),
      },
    });

    return count > 0;
  }
}

export const nextWorkerStageService = new NextWorkerStageService();
export default nextWorkerStageService;
