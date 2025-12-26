import prisma from '@/config/prisma';
import {
  ASSIGNMENT_STATUSES,
  PROFILE_STAGES,
  PROJECT_STAGES,
} from '@/constants/stages';
import { Prisma, ProjectStageHistory } from '@/generated/prisma';

/**
 * Date fields input interface with snake_case alternatives
 */
export interface ProjectDateFieldsInput {
  contactPhone?: string;
  contact_phone?: string;
  deploymentDate?: string | Date;
  deployment_date?: string | Date;
  awardDate?: string | Date;
  award_date?: string | Date;
  startDate?: string | Date;
  start_date?: string | Date;
  endDate?: string | Date;
  end_date?: string | Date;
  revisedCompletionDate?: string | Date;
  revised_completion_date?: string | Date;
  actualStartDate?: string | Date;
  actual_start_date?: string | Date;
  actualEndDate?: string | Date;
  actual_end_date?: string | Date;
  terminationDate?: string | Date;
  termination_date?: string | Date;
}

/**
 * Normalize project date fields from mixed camelCase/snake_case input
 */
export function normalizeProjectDateFields(data: ProjectDateFieldsInput): {
  contactPhone?: string;
  deploymentDate?: Date | null;
  awardDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  revisedCompletionDate?: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  terminationDate?: Date | null;
} {
  const toDate = (value?: string | Date | null): Date | null | undefined => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return new Date(value);
  };

  return {
    contactPhone: data.contactPhone || data.contact_phone,
    deploymentDate: toDate(data.deploymentDate || data.deployment_date),
    awardDate: toDate(data.awardDate || data.award_date),
    startDate: toDate(data.startDate || data.start_date),
    endDate: toDate(data.endDate || data.end_date),
    revisedCompletionDate: toDate(data.revisedCompletionDate || data.revised_completion_date),
    actualStartDate: toDate(data.actualStartDate || data.actual_start_date),
    actualEndDate: toDate(data.actualEndDate || data.actual_end_date),
    terminationDate: toDate(data.terminationDate || data.termination_date),
  };
}

/**
 * Generate the next project code (BSP-XXXX format)
 */
export async function generateProjectCode(tx?: Prisma.TransactionClient): Promise<string> {
  const prismaClient = tx || prisma;

  const lastProject = await prismaClient.project.findFirst({
    where: { projectCode: { startsWith: 'BSP-' } },
    orderBy: { projectCode: 'desc' },
    select: { projectCode: true },
  });

  let nextNum = 1;
  if (lastProject?.projectCode) {
    const match = lastProject.projectCode.match(/BSP-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  return `BSP-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get a project by ID or throw if not found
 */
export async function getProjectOrThrow(
  id: string,
  tx?: Prisma.TransactionClient
): Promise<any> {
  // Validate UUID format before querying
  if (!isValidUUID(id)) {
    throw new Error('Invalid project ID format');
  }

  try {
    const client = tx || prisma;
    const project = await client.project.findUnique({
      where: { id, deletedAt: null },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  } catch (error: any) {
    // Re-throw our own errors
    if (error.message === 'Project not found' || error.message === 'Invalid project ID format') {
      throw error;
    }
    // Wrap Prisma errors with clean message
    throw new Error('Failed to fetch project');
  }
}

/**
 * Log a project stage change to history
 * Returns the created stage history record for document linking
 */
export async function logProjectStageChange(
  tx: Prisma.TransactionClient,
  projectId: string,
  previousStage: string | null,
  newStage: string,
  changedByProfileId?: string,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<ProjectStageHistory> {
  try {
    // Validate changedByProfileId if provided
    if (changedByProfileId) {
      if (!isValidUUID(changedByProfileId)) {
        throw new Error('Invalid user ID format');
      }
      // Check if profile exists
      const profile = await tx.profile.findUnique({
        where: { id: changedByProfileId },
        select: { id: true },
      });
      if (!profile) {
        throw new Error('User profile not found');
      }
    }

    return await tx.projectStageHistory.create({
      data: {
        projectId,
        previousStage,
        newStage,
        changedAt: new Date(),
        changedByProfileId,
        reason,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error: any) {
    // Re-throw our own clean errors
    if (error.message === 'Invalid user ID format' || error.message === 'User profile not found') {
      throw error;
    }
    // Handle FK constraint errors
    if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
      throw new Error('User profile not found');
    }
    // Wrap other Prisma errors
    throw new Error('Failed to log stage change');
  }
}

/**
 * Update a profile's stage and log to history
 */
export async function updateProfileStageWithHistory(
  tx: Prisma.TransactionClient,
  profileId: string,
  previousStage: string,
  newStage: string,
  changedByProfileId: string | null | undefined,
  reason: string,
  metadata?: Record<string, any>
): Promise<void> {
  await tx.profile.update({
    where: { id: profileId },
    data: { currentStage: newStage },
  });

  // Only include changedByProfileId if it's a valid UUID
  const validChangedByProfileId = isValidUUID(changedByProfileId) ? changedByProfileId : null;

  await tx.profileStageHistory.create({
    data: {
      profileId,
      previousStage,
      newStage,
      changedByProfileId: validChangedByProfileId,
      changedAt: new Date(),
      reason,
      metadata,
    },
  });
}

/**
 * Determine the next stage for a worker after a project ends
 */
export async function getWorkerStageAfterProjectEnd(
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
