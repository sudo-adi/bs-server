import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ASSIGNMENT_STATUSES } from '@/constants/stages';
import { WORKER_PROFILE_SELECT, WORKER_PROFILE_WITH_SKILLS_SELECT, PROJECT_SELECT } from '../helpers/worker.helpers';

/**
 * Get all worker assignments with filters
 */
export async function getAllAssignments(
  filters: { projectId?: string; profileId?: string; status?: 'active' | 'removed' | 'all'; page?: number; limit?: number } = {}
): Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  try {
    const { projectId, profileId, status = 'active', page = 1, limit = 20 } = filters;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (profileId) where.profileId = profileId;
    if (status === 'active') where.removedAt = null;
    else if (status === 'removed') where.removedAt = { not: null };

    const [assignments, total] = await Promise.all([
      prisma.projectWorkerAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          profile: { select: { ...WORKER_PROFILE_SELECT, phone: true } },
          project: { select: PROJECT_SELECT },
        },
      }),
      prisma.projectWorkerAssignment.count({ where }),
    ]);

    return { data: assignments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  } catch (error) {
    logger.error('Error fetching all assignments', { error, filters });
    throw new Error('Failed to fetch assignments');
  }
}

/**
 * Get a single assignment by ID
 */
export async function getAssignmentById(assignmentId: string): Promise<any | null> {
  try {
    return await prisma.projectWorkerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        profile: { select: { ...WORKER_PROFILE_SELECT, email: true } },
        project: { select: PROJECT_SELECT },
      },
    });
  } catch (error) {
    logger.error('Error fetching assignment by ID', { error, assignmentId });
    throw new Error('Failed to fetch assignment');
  }
}

/**
 * Get all assignments for a project
 */
export async function getProjectAssignments(projectId: string, includeRemoved = false): Promise<any[]> {
  try {
    const where: any = { projectId };
    if (!includeRemoved) where.removedAt = null;

    return await prisma.projectWorkerAssignment.findMany({
      where,
      orderBy: { assignedAt: 'asc' },
      include: { profile: { select: WORKER_PROFILE_SELECT } },
    });
  } catch (error) {
    logger.error('Error fetching project assignments', { error, projectId });
    throw new Error('Failed to fetch project assignments');
  }
}

/**
 * Get all assignments for a worker
 */
export async function getWorkerAssignments(profileId: string, includeRemoved = false): Promise<any[]> {
  try {
    const where: any = { profileId };
    if (!includeRemoved) where.removedAt = null;

    return await prisma.projectWorkerAssignment.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      include: { project: { select: PROJECT_SELECT } },
    });
  } catch (error) {
    logger.error('Error fetching worker assignments', { error, profileId });
    throw new Error('Failed to fetch worker assignments');
  }
}

/**
 * Get matched profiles for a project (workers already assigned)
 */
export async function getMatchedProfiles(projectId: string): Promise<any[]> {
  try {
    const assignments = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, removedAt: null },
      include: {
        profile: { select: WORKER_PROFILE_WITH_SKILLS_SELECT },
      },
      orderBy: { matchedAt: 'desc' },
    });

    return assignments.map((a) => ({
      assignmentId: a.id,
      stage: a.stage,
      matchedAt: a.matchedAt,
      assignedAt: a.assignedAt,
      ...a.profile,
    }));
  } catch (error) {
    logger.error('Error getting matched profiles', { error, projectId });
    throw new Error('Failed to get matched profiles');
  }
}

/**
 * Get shared profiles for a project (profiles visible to employer)
 */
export async function getSharedProfiles(projectId: string): Promise<any[]> {
  try {
    const assignments = await prisma.projectWorkerAssignment.findMany({
      where: {
        projectId,
        removedAt: null,
        stage: { in: [ASSIGNMENT_STATUSES.ASSIGNED, ASSIGNMENT_STATUSES.ON_SITE] },
      },
      include: {
        profile: { select: WORKER_PROFILE_WITH_SKILLS_SELECT },
      },
      orderBy: { sharedAt: 'desc' },
    });

    return assignments.map((a) => ({
      assignmentId: a.id,
      stage: a.stage,
      sharedAt: a.sharedAt,
      ...a.profile,
    }));
  } catch (error) {
    logger.error('Error getting shared profiles', { error, projectId });
    throw new Error('Failed to get shared profiles');
  }
}

/**
 * Get assignment statistics for a project
 */
export async function getProjectAssignmentStats(projectId: string): Promise<{
  totalAssigned: number;
  currentlyActive: number;
  removed: number;
  bySkill: { skillId: string; skillName: string; count: number }[];
  byStage: { stage: string; count: number }[];
}> {
  try {
    const [totalAssigned, currentlyActive, removed, byStage] = await Promise.all([
      prisma.projectWorkerAssignment.count({ where: { projectId } }),
      prisma.projectWorkerAssignment.count({ where: { projectId, removedAt: null } }),
      prisma.projectWorkerAssignment.count({ where: { projectId, removedAt: { not: null } } }),
      prisma.projectWorkerAssignment.groupBy({ by: ['stage'], where: { projectId, removedAt: null }, _count: { id: true } }),
    ]);

    const activeAssignments = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, removedAt: null },
      select: { profile: { select: { skills: { include: { skillCategory: { select: { id: true, name: true } } } } } } },
    });

    const skillCounts = new Map<string, { name: string; count: number }>();
    for (const assignment of activeAssignments) {
      for (const skill of assignment.profile?.skills || []) {
        if (skill.skillCategory) {
          const existing = skillCounts.get(skill.skillCategory.id);
          if (existing) existing.count++;
          else skillCounts.set(skill.skillCategory.id, { name: skill.skillCategory.name || 'Unknown', count: 1 });
        }
      }
    }

    return {
      totalAssigned,
      currentlyActive,
      removed,
      bySkill: Array.from(skillCounts.entries()).map(([id, data]) => ({ skillId: id, skillName: data.name, count: data.count })),
      byStage: byStage.map((s) => ({ stage: s.stage || 'unknown', count: s._count.id })),
    };
  } catch (error) {
    logger.error('Error getting project assignment stats', { error, projectId });
    throw new Error('Failed to get assignment statistics');
  }
}
