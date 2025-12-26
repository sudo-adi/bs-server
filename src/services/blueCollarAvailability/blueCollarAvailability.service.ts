/**
 * Blue Collar Profile Availability Service
 * Checks availability of blue collar profiles (workers/candidates) for projects and training
 */

import prisma from '@/config/prisma';
import {
  ENROLLMENT_STATUSES,
  PROFILE_STAGES,
  PROJECT_ALLOCATABLE_STAGES,
  PROJECT_STAGES,
  TRAINING_BATCH_STATUSES,
} from '@/constants/stages';
import { Prisma } from '@/generated/prisma';
import {
  BlueCollarAvailabilityFilters,
  BlueCollarProfileInfo,
  BlockingEvent,
  ProfileAvailabilityResponse,
  SingleProfileAvailabilityResult,
  SkillInfo,
} from './types';

// Stages eligible for training enrollment
const TRAINING_ELIGIBLE_STAGES = [
  PROFILE_STAGES.APPROVED,
  PROFILE_STAGES.SCREENING,
];

// Active project stages that block availability
const ACTIVE_PROJECT_STAGES = [
  PROJECT_STAGES.APPROVED,
  PROJECT_STAGES.PLANNING,
  PROJECT_STAGES.SHARED,
  PROJECT_STAGES.ONGOING,
  PROJECT_STAGES.ON_HOLD,
];

// Active training batch statuses that block availability
const ACTIVE_TRAINING_STATUSES = [
  TRAINING_BATCH_STATUSES.UPCOMING,
  TRAINING_BATCH_STATUSES.ONGOING,
];

/**
 * Calculate overlap days between two date ranges
 */
function calculateOverlapDays(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): number {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
  const diffTime = overlapEnd.getTime() - overlapStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays + 1);
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Build full name from parts
 */
function buildFullName(
  firstName: string | null,
  middleName: string | null,
  lastName: string | null
): string {
  return [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Unknown';
}

export class BlueCollarAvailabilityService {
  /**
   * Check if a single profile is available within a date range
   */
  async checkAvailability(
    profileId: string,
    startDate: Date,
    endDate: Date,
    options?: { excludeProjectId?: string; excludeBatchId?: string }
  ): Promise<SingleProfileAvailabilityResult> {
    const blockingEvents: BlockingEvent[] = [];
    const { excludeProjectId, excludeBatchId } = options || {};

    // 1. Check for overlapping project assignments
    const projectAssignments = await prisma.projectWorkerAssignment.findMany({
      where: {
        profileId,
        removedAt: null,
        project: {
          deletedAt: null,
          isActive: true,
          ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
          startDate: { not: null },
          endDate: { not: null },
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
          stage: { in: ACTIVE_PROJECT_STAGES },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            startDate: true,
            endDate: true,
            stage: true,
            location: true,
            employer: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
      },
    });

    for (const assignment of projectAssignments) {
      if (assignment.project?.startDate && assignment.project?.endDate) {
        blockingEvents.push({
          type: 'PROJECT',
          id: assignment.project.id,
          code: assignment.project.projectCode,
          name: assignment.project.name,
          startDate: assignment.project.startDate,
          endDate: assignment.project.endDate,
          status: assignment.project.stage,
          location: assignment.project.location,
          overlapDays: calculateOverlapDays(
            startDate,
            endDate,
            assignment.project.startDate,
            assignment.project.endDate
          ),
          employer: assignment.project.employer
            ? {
                id: assignment.project.employer.id,
                name: assignment.project.employer.companyName,
              }
            : undefined,
        });
      }
    }

    // 2. Check for overlapping training enrollments
    const trainingEnrollments = await prisma.trainingBatchEnrollment.findMany({
      where: {
        profileId,
        status: ENROLLMENT_STATUSES.ENROLLED,
        batch: {
          ...(excludeBatchId ? { id: { not: excludeBatchId } } : {}),
          startDate: { not: null },
          endDate: { not: null },
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
          status: { in: ACTIVE_TRAINING_STATUSES },
        },
      },
      include: {
        batch: {
          select: {
            id: true,
            code: true,
            name: true,
            programName: true,
            startDate: true,
            endDate: true,
            status: true,
            location: true,
          },
        },
      },
    });

    for (const enrollment of trainingEnrollments) {
      if (enrollment.batch?.startDate && enrollment.batch?.endDate) {
        blockingEvents.push({
          type: 'TRAINING',
          id: enrollment.batch.id,
          code: enrollment.batch.code,
          name: enrollment.batch.name,
          startDate: enrollment.batch.startDate,
          endDate: enrollment.batch.endDate,
          status: enrollment.batch.status,
          location: enrollment.batch.location,
          overlapDays: calculateOverlapDays(
            startDate,
            endDate,
            enrollment.batch.startDate,
            enrollment.batch.endDate
          ),
          programName: enrollment.batch.programName,
        });
      }
    }

    return {
      isAvailable: blockingEvents.length === 0,
      blockingEvents,
    };
  }

  /**
   * Get all profiles with their availability status
   * Main API function
   */
  async getProfilesWithAvailability(
    filters: BlueCollarAvailabilityFilters
  ): Promise<ProfileAvailabilityResponse> {
    const {
      startDate,
      endDate,
      purpose = 'all',
      availabilityStatus = 'all',
      skillCategoryIds,
      gender,
      minAge,
      maxAge,
      stages,
      districts,
      states,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20,
      excludeProjectId,
      excludeBatchId,
    } = filters;

    // 1. Build profile WHERE clause
    const where: Prisma.ProfileWhereInput = {
      deletedAt: null,
      isActive: true,
      workerType: 'blue',
    };

    // Purpose-based stage filter
    if (purpose === 'project') {
      where.currentStage = { in: PROJECT_ALLOCATABLE_STAGES };
    } else if (purpose === 'training') {
      where.currentStage = { in: TRAINING_ELIGIBLE_STAGES };
    } else if (stages && stages.length > 0) {
      where.currentStage = { in: stages };
    }

    // Gender filter
    if (gender) {
      where.gender = gender;
    }

    // Age filter - needs special handling via dateOfBirth
    if (minAge || maxAge) {
      const today = new Date();
      if (maxAge) {
        const minBirthDate = new Date(
          today.getFullYear() - maxAge - 1,
          today.getMonth(),
          today.getDate()
        );
        where.dateOfBirth = { ...((where.dateOfBirth as any) || {}), gte: minBirthDate };
      }
      if (minAge) {
        const maxBirthDate = new Date(
          today.getFullYear() - minAge,
          today.getMonth(),
          today.getDate()
        );
        where.dateOfBirth = { ...((where.dateOfBirth as any) || {}), lte: maxBirthDate };
      }
    }

    // Skill filter
    if (skillCategoryIds && skillCategoryIds.length > 0) {
      where.skills = {
        some: {
          skillCategoryId: { in: skillCategoryIds },
        },
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
        { workerCode: { contains: search, mode: 'insensitive' } },
        { candidateCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Address filter (district/state)
    if ((districts && districts.length > 0) || (states && states.length > 0)) {
      where.addresses = {
        some: {
          ...(districts && districts.length > 0 ? { district: { in: districts } } : {}),
          ...(states && states.length > 0 ? { state: { in: states } } : {}),
        },
      };
    }

    // 2. Fetch all matching profiles
    const profiles = await prisma.profile.findMany({
      where,
      select: {
        id: true,
        workerCode: true,
        candidateCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        profilePhotoURL: true,
        phone: true,
        currentStage: true,
        skills: {
          include: {
            skillCategory: {
              select: {
                id: true,
                name: true,
                categoryType: true,
              },
            },
          },
        },
        addresses: {
          where: {
            addressType: 'permanent',
          },
          take: 1,
          select: {
            district: true,
            state: true,
          },
        },
      },
      orderBy: this.buildOrderBy(sortBy, sortOrder),
    });

    // 3. Get profile IDs for batch fetching blocking events
    const profileIds = profiles.map((p) => p.id);

    // 4. Batch fetch project assignments in date range
    const projectAssignments = await prisma.projectWorkerAssignment.findMany({
      where: {
        profileId: { in: profileIds },
        removedAt: null,
        project: {
          deletedAt: null,
          isActive: true,
          ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
          startDate: { not: null },
          endDate: { not: null },
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
          stage: { in: ACTIVE_PROJECT_STAGES },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            name: true,
            startDate: true,
            endDate: true,
            stage: true,
            location: true,
            employer: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        },
      },
    });

    // 5. Batch fetch training enrollments in date range
    const trainingEnrollments = await prisma.trainingBatchEnrollment.findMany({
      where: {
        profileId: { in: profileIds },
        status: ENROLLMENT_STATUSES.ENROLLED,
        batch: {
          ...(excludeBatchId ? { id: { not: excludeBatchId } } : {}),
          startDate: { not: null },
          endDate: { not: null },
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
          status: { in: ACTIVE_TRAINING_STATUSES },
        },
      },
      include: {
        batch: {
          select: {
            id: true,
            code: true,
            name: true,
            programName: true,
            startDate: true,
            endDate: true,
            status: true,
            location: true,
          },
        },
      },
    });

    // 6. Group by profile ID
    const projectsByProfile = new Map<string, typeof projectAssignments>();
    for (const assignment of projectAssignments) {
      if (!assignment.profileId) continue;
      if (!projectsByProfile.has(assignment.profileId)) {
        projectsByProfile.set(assignment.profileId, []);
      }
      projectsByProfile.get(assignment.profileId)!.push(assignment);
    }

    const trainingsByProfile = new Map<string, typeof trainingEnrollments>();
    for (const enrollment of trainingEnrollments) {
      if (!enrollment.profileId) continue;
      if (!trainingsByProfile.has(enrollment.profileId)) {
        trainingsByProfile.set(enrollment.profileId, []);
      }
      trainingsByProfile.get(enrollment.profileId)!.push(enrollment);
    }

    // 7. Partition into available and unavailable
    const available: BlueCollarProfileInfo[] = [];
    const unavailable: BlueCollarProfileInfo[] = [];
    let unavailableByProject = 0;
    let unavailableByTraining = 0;

    for (const profile of profiles) {
      const blockingEvents: BlockingEvent[] = [];

      // Check project assignments
      const profileProjects = projectsByProfile.get(profile.id) || [];
      for (const assignment of profileProjects) {
        if (assignment.project?.startDate && assignment.project?.endDate) {
          blockingEvents.push({
            type: 'PROJECT',
            id: assignment.project.id,
            code: assignment.project.projectCode,
            name: assignment.project.name,
            startDate: assignment.project.startDate,
            endDate: assignment.project.endDate,
            status: assignment.project.stage,
            location: assignment.project.location,
            overlapDays: calculateOverlapDays(
              startDate,
              endDate,
              assignment.project.startDate,
              assignment.project.endDate
            ),
            employer: assignment.project.employer
              ? {
                  id: assignment.project.employer.id,
                  name: assignment.project.employer.companyName,
                }
              : undefined,
          });
        }
      }

      // Check training enrollments
      const profileTrainings = trainingsByProfile.get(profile.id) || [];
      for (const enrollment of profileTrainings) {
        if (enrollment.batch?.startDate && enrollment.batch?.endDate) {
          blockingEvents.push({
            type: 'TRAINING',
            id: enrollment.batch.id,
            code: enrollment.batch.code,
            name: enrollment.batch.name,
            startDate: enrollment.batch.startDate,
            endDate: enrollment.batch.endDate,
            status: enrollment.batch.status,
            location: enrollment.batch.location,
            overlapDays: calculateOverlapDays(
              startDate,
              endDate,
              enrollment.batch.startDate,
              enrollment.batch.endDate
            ),
            programName: enrollment.batch.programName,
          });
        }
      }

      // Build profile info
      const profileInfo: BlueCollarProfileInfo = {
        id: profile.id,
        code: profile.workerCode || profile.candidateCode,
        fullName: buildFullName(profile.firstName, profile.middleName, profile.lastName),
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        gender: profile.gender,
        age: calculateAge(profile.dateOfBirth),
        dateOfBirth: profile.dateOfBirth,
        profilePhotoURL: profile.profilePhotoURL,
        phone: profile.phone,
        currentStage: profile.currentStage,
        skills: profile.skills.map(
          (s): SkillInfo => ({
            id: s.skillCategory?.id || s.id,
            name: s.skillCategory?.name || null,
            categoryType: s.skillCategory?.categoryType || null,
            yearsOfExperience: s.yearsOfExperience,
            isPrimary: s.isPrimary,
          })
        ),
        address: profile.addresses[0]
          ? {
              district: profile.addresses[0].district,
              state: profile.addresses[0].state,
            }
          : null,
      };

      if (blockingEvents.length === 0) {
        available.push(profileInfo);
      } else {
        profileInfo.blockingEvents = blockingEvents;
        unavailable.push(profileInfo);

        // Count by type
        const hasProject = blockingEvents.some((e) => e.type === 'PROJECT');
        const hasTraining = blockingEvents.some((e) => e.type === 'TRAINING');
        if (hasProject) unavailableByProject++;
        if (hasTraining) unavailableByTraining++;
      }
    }

    // 8. Filter by availability status if specified
    let filteredAvailable = available;
    let filteredUnavailable = unavailable;

    if (availabilityStatus === 'available') {
      filteredUnavailable = [];
    } else if (availabilityStatus === 'unavailable') {
      filteredAvailable = [];
    }

    // 9. Apply pagination
    const skip = (page - 1) * limit;
    const paginatedAvailable = filteredAvailable.slice(skip, skip + limit);
    const paginatedUnavailable = filteredUnavailable.slice(skip, skip + limit);

    return {
      available: paginatedAvailable,
      unavailable: paginatedUnavailable,
      summary: {
        totalAvailable: filteredAvailable.length,
        totalUnavailable: filteredUnavailable.length,
        unavailableByProject,
        unavailableByTraining,
      },
      pagination: {
        page,
        limit,
        totalAvailable: filteredAvailable.length,
        totalUnavailable: filteredUnavailable.length,
        totalPagesAvailable: Math.ceil(filteredAvailable.length / limit),
        totalPagesUnavailable: Math.ceil(filteredUnavailable.length / limit),
      },
    };
  }

  /**
   * Get profiles available for a specific project
   */
  async getAvailableForProject(
    projectId: string,
    filters: Omit<BlueCollarAvailabilityFilters, 'purpose' | 'excludeProjectId' | 'startDate' | 'endDate'>
  ): Promise<ProfileAvailabilityResponse> {
    // Get project dates
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { startDate: true, endDate: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (!project.startDate || !project.endDate) {
      throw new Error('Project must have start and end dates');
    }

    return this.getProfilesWithAvailability({
      ...filters,
      startDate: project.startDate,
      endDate: project.endDate,
      purpose: 'project',
      excludeProjectId: projectId,
    });
  }

  /**
   * Get profiles available for a specific training batch
   */
  async getAvailableForTraining(
    batchId: string,
    filters: Omit<BlueCollarAvailabilityFilters, 'purpose' | 'excludeBatchId' | 'startDate' | 'endDate'>
  ): Promise<ProfileAvailabilityResponse> {
    // Get batch dates
    const batch = await prisma.trainingBatch.findUnique({
      where: { id: batchId },
      select: { startDate: true, endDate: true },
    });

    if (!batch) {
      throw new Error('Training batch not found');
    }

    if (!batch.startDate || !batch.endDate) {
      throw new Error('Training batch must have start and end dates');
    }

    return this.getProfilesWithAvailability({
      ...filters,
      startDate: batch.startDate,
      endDate: batch.endDate,
      purpose: 'training',
      excludeBatchId: batchId,
    });
  }

  /**
   * Build order by clause
   */
  private buildOrderBy(
    sortBy: 'name' | 'code' | 'age',
    sortOrder: 'asc' | 'desc'
  ): Prisma.ProfileOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'code':
        return [
          { workerCode: sortOrder },
          { candidateCode: sortOrder },
        ];
      case 'age':
        // Older people have earlier birth dates, so reverse the order
        return [{ dateOfBirth: sortOrder === 'asc' ? 'desc' : 'asc' }];
      case 'name':
      default:
        return [
          { firstName: sortOrder },
          { lastName: sortOrder },
        ];
    }
  }
}

export const blueCollarAvailabilityService = new BlueCollarAvailabilityService();
