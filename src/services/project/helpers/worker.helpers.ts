import prisma from '@/config/prisma';
import { PROFILE_STAGES } from '@/constants/stages';
import { Prisma } from '@/generated/prisma';

/**
 * Build the base where clause for eligible workers (trained/benched blue collar workers)
 * Also includes TRAINED candidates who can be converted to workers when matched
 */
export function buildEligibleWorkerWhereClause(options: {
  skillCategoryId?: string;
  search?: string;
  excludeProfileIds?: string[];
  requireBlueWorker?: boolean;
}): Prisma.ProfileWhereInput {
  const { skillCategoryId, search, excludeProfileIds = [], requireBlueWorker = true } = options;

  // Include both:
  // 1. Workers (profileType: 'worker') with stage TRAINED or BENCHED
  // 2. Candidates (profileType: 'candidate') with stage TRAINED (will be converted to workers when matched)
  const where: Prisma.ProfileWhereInput = {
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
    where.workerType = 'blue';
  }

  if (search) {
    where.AND = [
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

  if (skillCategoryId) {
    where.skills = { some: { skillCategoryId } };
  }

  if (excludeProfileIds.length > 0) {
    where.id = { notIn: excludeProfileIds };
  }

  return where;
}

/**
 * Standard profile select for worker assignments
 */
export const WORKER_PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  workerCode: true,
  candidateCode: true,
  currentStage: true,
  phone: true,
  email: true,
  profilePhotoURL: true,
} as const;

/**
 * Extended profile select with skills
 */
export const WORKER_PROFILE_WITH_SKILLS_SELECT = {
  ...WORKER_PROFILE_SELECT,
  skills: {
    include: {
      skillCategory: {
        select: { id: true, name: true },
      },
    },
  },
} as const;

/**
 * Standard project select for assignments
 */
export const PROJECT_SELECT = {
  id: true,
  projectCode: true,
  name: true,
  stage: true,
  startDate: true,
  endDate: true,
  location: true,
  employer: {
    select: { id: true, companyName: true },
  },
} as const;

/**
 * Get already assigned profile IDs for a project
 */
export async function getAssignedProfileIds(
  projectId: string,
  tx?: Prisma.TransactionClient
): Promise<string[]> {
  const client = tx || prisma;
  const assignments = await client.projectWorkerAssignment.findMany({
    where: { projectId, removedAt: null },
    select: { profileId: true },
  });
  return assignments.map((a) => a.profileId).filter((id): id is string => id !== null);
}

/**
 * Get helper requirement for a project (for auto-matching)
 */
export async function getHelperRequirement(
  projectId: string,
  tx?: Prisma.TransactionClient
): Promise<{
  helperReq: { skillCategoryId: string | null; requiredCount: number } | null;
  alreadyAssigned: number;
  remainingNeeded: number;
}> {
  const client = tx || prisma;

  const project = await client.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: {
      resourceRequirements: {
        where: { skillCategory: { categoryType: 'blue_collar' } },
        include: { skillCategory: true },
      },
      workerAssignments: {
        where: { removedAt: null },
        select: { profileId: true },
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const helperReq = project.resourceRequirements.find((r) =>
    r.skillCategory?.name?.toLowerCase().includes('helper')
  );

  if (!helperReq) {
    return { helperReq: null, alreadyAssigned: 0, remainingNeeded: 0 };
  }

  const requiredCount = helperReq.requiredCount || 0;
  const alreadyAssigned = project.workerAssignments.length;
  const remainingNeeded = Math.max(0, requiredCount - alreadyAssigned);

  return {
    helperReq: {
      skillCategoryId: helperReq.skillCategoryId,
      requiredCount,
    },
    alreadyAssigned,
    remainingNeeded,
  };
}

/**
 * Get available workers for auto-matching
 */
export async function getAvailableWorkersForAutoMatch(
  skillCategoryId: string,
  excludeProfileIds: string[],
  limit: number,
  includeDetails = false,
  tx?: Prisma.TransactionClient
): Promise<any[]> {
  const client = tx || prisma;

  const where = buildEligibleWorkerWhereClause({
    skillCategoryId,
    excludeProfileIds,
  });

  const select = includeDetails
    ? {
        id: true,
        firstName: true,
        lastName: true,
        workerCode: true,
        currentStage: true,
        phone: true,
      }
    : { id: true };

  return client.profile.findMany({
    where,
    take: limit,
    select,
  });
}
