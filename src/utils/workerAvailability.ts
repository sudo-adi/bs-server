/**
 * Worker Availability Utility
 * Global functions to check worker availability for projects and training
 */

import prisma from '@/config/prisma';
import {
  ENROLLMENT_STATUSES,
  PROFILE_STAGES,
  PROJECT_ALLOCATABLE_STAGES,
  PROJECT_STAGES,
} from '@/constants/stages';

/**
 * Types for availability checking
 */
export interface BlockingEvent {
  type: 'PROJECT' | 'TRAINING';
  entityId: string;
  entityName: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface WorkerAvailabilityResult {
  isAvailable: boolean;
  blockingEvents: BlockingEvent[];
}

export interface UnavailableWorkerInfo {
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  workerCode: string | null;
  candidateCode: string | null;
  currentStage: string | null;
  blockingEvents: BlockingEvent[];
}

/**
 * Check if a worker is available within a given date range
 * Checks for:
 * 1. Overlapping project assignments (not removed)
 * 2. Overlapping training enrollments (enrolled status)
 *
 * @param profileId - The worker's profile ID
 * @param startDate - Start date of the period to check
 * @param endDate - End date of the period to check
 * @param excludeProjectId - Optional project ID to exclude from collision check
 * @returns WorkerAvailabilityResult with availability status and blocking events
 */
export async function checkWorkerAvailability(
  profileId: string,
  startDate: Date,
  endDate: Date,
  excludeProjectId?: string
): Promise<WorkerAvailabilityResult> {
  const blockingEvents: BlockingEvent[] = [];

  // 1. Check for overlapping project assignments
  const overlappingProjects = await prisma.projectWorkerAssignment.findMany({
    where: {
      profileId,
      removedAt: null, // Only active assignments
      project: {
        deletedAt: null,
        isActive: true,
        ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
        // Project must have dates
        startDate: { not: null },
        endDate: { not: null },
        // Date overlap check: project.startDate <= endDate AND project.endDate >= startDate
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
        // Only active project stages
        stage: {
          in: [
            PROJECT_STAGES.APPROVED,
            PROJECT_STAGES.PLANNING,
            PROJECT_STAGES.SHARED,
            PROJECT_STAGES.ONGOING,
            PROJECT_STAGES.ON_HOLD,
          ],
        },
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          stage: true,
        },
      },
    },
  });

  for (const assignment of overlappingProjects) {
    if (assignment.project?.startDate && assignment.project?.endDate) {
      blockingEvents.push({
        type: 'PROJECT',
        entityId: assignment.project.id,
        entityName: assignment.project.name || 'Unnamed Project',
        startDate: assignment.project.startDate,
        endDate: assignment.project.endDate,
        status: assignment.stage || assignment.project.stage || 'UNKNOWN',
      });
    }
  }

  // 2. Check for overlapping training enrollments
  const overlappingTrainings = await prisma.trainingBatchEnrollment.findMany({
    where: {
      profileId,
      status: ENROLLMENT_STATUSES.ENROLLED,
      batch: {
        // Batch must have dates
        startDate: { not: null },
        endDate: { not: null },
        // Date overlap check
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
        // Only upcoming or ongoing training
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
    },
    include: {
      batch: {
        select: {
          id: true,
          name: true,
          code: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });

  for (const enrollment of overlappingTrainings) {
    if (enrollment.batch?.startDate && enrollment.batch?.endDate) {
      blockingEvents.push({
        type: 'TRAINING',
        entityId: enrollment.batch.id,
        entityName: enrollment.batch.name || enrollment.batch.code || 'Unnamed Training',
        startDate: enrollment.batch.startDate,
        endDate: enrollment.batch.endDate,
        status: enrollment.batch.status || 'UNKNOWN',
      });
    }
  }

  return {
    isAvailable: blockingEvents.length === 0,
    blockingEvents,
  };
}

/**
 * Check if a worker's profile is eligible for project allocation
 * Must be:
 * - profileType: 'worker'
 * - workerType: 'blue' (optional filter)
 * - currentStage: 'TRAINED' or 'BENCHED'
 * - Not deleted, is active
 */
export async function isWorkerEligibleForProject(
  profileId: string,
  requireBlueWorker: boolean = true
): Promise<{ eligible: boolean; reason?: string }> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId, deletedAt: null },
    select: {
      id: true,
      profileType: true,
      workerType: true,
      currentStage: true,
      isActive: true,
    },
  });

  if (!profile) {
    return { eligible: false, reason: 'Profile not found' };
  }

  if (!profile.isActive) {
    return { eligible: false, reason: 'Profile is not active' };
  }

  if (profile.profileType !== 'worker') {
    return {
      eligible: false,
      reason: `Profile type must be 'worker', got: ${profile.profileType}`,
    };
  }

  if (requireBlueWorker && profile.workerType !== 'blue') {
    return { eligible: false, reason: `Worker type must be 'blue', got: ${profile.workerType}` };
  }

  if (!profile.currentStage || !PROJECT_ALLOCATABLE_STAGES.includes(profile.currentStage as any)) {
    return {
      eligible: false,
      reason: `Worker stage must be TRAINED or BENCHED, got: ${profile.currentStage}`,
    };
  }

  return { eligible: true };
}

/**
 * Get all available workers for a specific project
 * Filters by:
 * - profileType: 'worker'
 * - workerType: 'blue' (optional)
 * - currentStage: 'TRAINED' or 'BENCHED'
 * - No overlapping projects or training during project timeline
 *
 * @param projectId - The project to check availability for
 * @param options - Filter options
 */
export async function getAvailableWorkersForProject(
  projectId: string,
  options: {
    requireBlueWorker?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<{
  data: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    workerCode: string | null;
    candidateCode: string | null;
    currentStage: string | null;
    workerType: string | null;
    profileType: string | null;
    phone: string | null;
    profilePhotoURL: string | null;
    skills: Array<{ skillCategory: { id: string; name: string | null } | null }>;
  }>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const { requireBlueWorker = true, page = 1, limit = 20, search } = options;

  // 1. Get project details
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { id: true, startDate: true, endDate: true },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (!project.startDate || !project.endDate) {
    throw new Error('Project must have start and end dates to check availability');
  }

  // 2. Build base filter for eligible workers
  // Include both:
  // 1. Workers (profileType: 'worker') with stage TRAINED or BENCHED
  // 2. Candidates (profileType: 'candidate') with stage TRAINED (will be converted to workers when matched)
  const baseWhere: any = {
    deletedAt: null,
    isActive: true,
    OR: [
      // Existing workers who are trained or benched
      {
        profileType: 'worker',
        currentStage: { in: [PROFILE_STAGES.TRAINED, PROFILE_STAGES.BENCHED] },
      },
      // Candidates who completed training (will become workers when matched)
      {
        profileType: 'candidate',
        currentStage: PROFILE_STAGES.TRAINED,
      },
    ],
  };

  if (requireBlueWorker) {
    baseWhere.workerType = 'blue';
  }

  if (search) {
    baseWhere.AND = [
      {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { workerCode: { contains: search, mode: 'insensitive' } },
          { candidateCode: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  // 3. Get all potentially eligible workers
  const allEligibleWorkers = await prisma.profile.findMany({
    where: baseWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      workerCode: true,
      candidateCode: true,
      currentStage: true,
      workerType: true,
      profileType: true,
      phone: true,
      profilePhotoURL: true,
      skills: {
        include: {
          skillCategory: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ workerCode: 'asc' }, { firstName: 'asc' }],
  });

  // 4. Filter out unavailable workers (those with conflicts)
  const availableWorkers: typeof allEligibleWorkers = [];

  for (const worker of allEligibleWorkers) {
    const availability = await checkWorkerAvailability(
      worker.id,
      project.startDate,
      project.endDate,
      projectId // Exclude current project from collision check
    );

    if (availability.isAvailable) {
      availableWorkers.push(worker);
    }
  }

  // 5. Apply pagination
  const total = availableWorkers.length;
  const skip = (page - 1) * limit;
  const paginatedWorkers = availableWorkers.slice(skip, skip + limit);

  return {
    data: paginatedWorkers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all unavailable workers with their blocking reasons
 * Returns workers who have conflicts in the given date range
 *
 * @param startDate - Start date of the period to check
 * @param endDate - End date of the period to check
 * @param options - Filter options
 */
export async function getUnavailableWorkers(
  startDate: Date,
  endDate: Date,
  options: {
    requireBlueWorker?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<{
  data: UnavailableWorkerInfo[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const { requireBlueWorker = true, page = 1, limit = 20, search } = options;

  // 1. Build base filter for eligible workers (TRAINED or BENCHED only for clarity)
  const baseWhere: any = {
    deletedAt: null,
    isActive: true,
    profileType: 'worker',
    // Include workers who might be assigned to projects (any allocatable or project-related stage)
    currentStage: {
      in: [
        PROFILE_STAGES.TRAINED,
        PROFILE_STAGES.BENCHED,
        PROFILE_STAGES.MATCHED,
        PROFILE_STAGES.ASSIGNED,
        PROFILE_STAGES.ONBOARDED,
        PROFILE_STAGES.ON_SITE,
        PROFILE_STAGES.ON_HOLD,
        PROFILE_STAGES.IN_TRAINING,
        PROFILE_STAGES.TRAINING_SCHEDULED,
      ],
    },
  };

  if (requireBlueWorker) {
    baseWhere.workerType = 'blue';
  }

  if (search) {
    baseWhere.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { workerCode: { contains: search, mode: 'insensitive' } },
      { candidateCode: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 2. Get all workers
  const allWorkers = await prisma.profile.findMany({
    where: baseWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      workerCode: true,
      candidateCode: true,
      currentStage: true,
    },
    orderBy: [{ workerCode: 'asc' }, { firstName: 'asc' }],
  });

  // 3. Filter to only unavailable workers
  const unavailableWorkers: UnavailableWorkerInfo[] = [];

  for (const worker of allWorkers) {
    const availability = await checkWorkerAvailability(worker.id, startDate, endDate);

    if (!availability.isAvailable) {
      unavailableWorkers.push({
        profileId: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        workerCode: worker.workerCode,
        candidateCode: worker.candidateCode,
        currentStage: worker.currentStage,
        blockingEvents: availability.blockingEvents,
      });
    }
  }

  // 4. Apply pagination
  const total = unavailableWorkers.length;
  const skip = (page - 1) * limit;
  const paginatedWorkers = unavailableWorkers.slice(skip, skip + limit);

  return {
    data: paginatedWorkers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Log an availability event to calendar_events table
 * Used when creating projects or training batches to track occupancy
 *
 * @param profileId - Worker profile ID
 * @param eventType - 'PROJECT' or 'TRAINING'
 * @param referenceId - Project ID or Training Batch ID
 * @param startDate - Event start date
 * @param endDate - Event end date
 * @param status - Event status (e.g., 'ASSIGNED', 'ENROLLED')
 */
export async function logAvailabilityEvent(
  profileId: string,
  eventType: 'PROJECT' | 'TRAINING',
  referenceId: string,
  startDate: Date,
  endDate: Date,
  status: string = 'ACTIVE'
): Promise<void> {
  await prisma.calendarEvent.create({
    data: {
      profileId,
      eventType,
      referenceTable: eventType === 'PROJECT' ? 'projects' : 'training_batches',
      referenceId,
      startDate,
      endDate,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Remove/update availability event when assignment is removed
 *
 * @param profileId - Worker profile ID
 * @param eventType - 'PROJECT' or 'TRAINING'
 * @param referenceId - Project ID or Training Batch ID
 */
export async function removeAvailabilityEvent(
  profileId: string,
  eventType: 'PROJECT' | 'TRAINING',
  referenceId: string
): Promise<void> {
  await prisma.calendarEvent.updateMany({
    where: {
      profileId,
      eventType,
      referenceId,
    },
    data: {
      status: 'REMOVED',
      updatedAt: new Date(),
    },
  });
}

export default {
  checkWorkerAvailability,
  isWorkerEligibleForProject,
  getAvailableWorkersForProject,
  getUnavailableWorkers,
  logAvailabilityEvent,
  removeAvailabilityEvent,
};
