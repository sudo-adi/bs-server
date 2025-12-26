import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { canAllocateToProject } from '@/constants/stages';
import { checkWorkerAvailability } from '@/utils/workerAvailability';
import {
  buildEligibleWorkerWhereClause,
  getAssignedProfileIds,
  WORKER_PROFILE_WITH_SKILLS_SELECT,
} from '../helpers/worker.helpers';

/**
 * Get matchable workers for a project (available workers that can be matched)
 */
export async function getMatchableWorkers(
  projectId: string,
  filters: { skillCategoryId?: string; search?: string; limit?: number; offset?: number } = {}
): Promise<{ workers: any[]; total: number }> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!project) throw new Error('Project not found');

    const { skillCategoryId, search, limit = 50, offset = 0 } = filters;

    const where = buildEligibleWorkerWhereClause({
      skillCategoryId,
      search,
    });

    const [workers, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip: offset,
        take: limit,
        select: WORKER_PROFILE_WITH_SKILLS_SELECT,
        orderBy: [{ currentStage: 'asc' }, { firstName: 'asc' }],
      }),
      prisma.profile.count({ where }),
    ]);

    // Filter out already assigned workers
    const assignedIds = new Set(await getAssignedProfileIds(projectId));
    const availableWorkers = workers.filter((w) => !assignedIds.has(w.id));

    return { workers: availableWorkers, total: availableWorkers.length };
  } catch (error) {
    logger.error('Error getting matchable workers', { error, projectId });
    throw new Error('Failed to get matchable workers');
  }
}

/**
 * Get matchable workers count grouped by skill category
 */
export async function getMatchableWorkersCountBySkill(projectId: string): Promise<Array<{ skillCategoryId: string; skillName: string; count: number }>> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        resourceRequirements: { include: { skillCategory: true } },
      },
    });

    if (!project) throw new Error('Project not found');

    const assignedIds = new Set(await getAssignedProfileIds(projectId));

    const result: Array<{ skillCategoryId: string; skillName: string; count: number }> = [];

    for (const req of project.resourceRequirements) {
      if (!req.skillCategoryId) continue;

      const where = buildEligibleWorkerWhereClause({ skillCategoryId: req.skillCategoryId });
      const workers = await prisma.profile.findMany({
        where,
        select: { id: true },
      });

      const availableCount = workers.filter((w) => !assignedIds.has(w.id)).length;

      result.push({
        skillCategoryId: req.skillCategoryId,
        skillName: req.skillCategory?.name || 'Unknown',
        count: availableCount,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error getting matchable workers count by skill', { error, projectId });
    throw new Error('Failed to get matchable workers count');
  }
}

/**
 * Validate if a worker can be assigned to a project
 */
export async function validateWorkerAssignment(
  profileId: string,
  projectId: string
): Promise<{ valid: boolean; error?: string; conflicts?: Array<{ type: 'project' | 'training'; id: string; name: string; startDate: Date; endDate: Date; overlapDays: number }> }> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId, deletedAt: null },
      select: { id: true, currentStage: true, firstName: true, lastName: true },
    });

    if (!profile) return { valid: false, error: 'Worker profile not found' };

    if (!canAllocateToProject(profile.currentStage)) {
      return { valid: false, error: `Worker must be in 'trained' or 'benched' stage. Current: ${profile.currentStage || 'unknown'}` };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { id: true, projectCode: true, name: true, stage: true, startDate: true, endDate: true },
    });

    if (!project) return { valid: false, error: 'Project not found' };

    if (['completed', 'terminated', 'short_closed', 'cancelled'].includes(project.stage || '')) {
      return { valid: false, error: `Cannot add workers to ${project.stage} projects` };
    }

    const existingAssignment = await prisma.projectWorkerAssignment.findFirst({
      where: { projectId, profileId, removedAt: null },
    });

    if (existingAssignment) return { valid: false, error: 'Worker is already assigned to this project' };

    if (project.startDate && project.endDate) {
      const availability = await checkWorkerAvailability(profileId, project.startDate, project.endDate, projectId);

      if (!availability.isAvailable) {
        return {
          valid: false,
          error: 'Worker has overlapping commitments',
          conflicts: availability.blockingEvents.map((event: any) => ({
            type: event.type.toLowerCase() as 'project' | 'training',
            id: event.entityId,
            name: event.entityName,
            startDate: event.startDate,
            endDate: event.endDate,
            overlapDays: Math.ceil(
              (Math.min(event.endDate.getTime(), project.endDate!.getTime()) - Math.max(event.startDate.getTime(), project.startDate!.getTime())) / (1000 * 60 * 60 * 24)
            ),
          })),
        };
      }
    }

    return { valid: true };
  } catch (error) {
    logger.error('Error validating worker assignment', { error, profileId, projectId });
    throw new Error('Failed to validate assignment');
  }
}

/**
 * Validate multiple workers for assignment
 */
export async function validateBulkAssignments(profileIds: string[], projectId: string): Promise<Map<string, { valid: boolean; error?: string }>> {
  const results = new Map<string, { valid: boolean; error?: string }>();
  for (const profileId of profileIds) {
    const result = await validateWorkerAssignment(profileId, projectId);
    results.set(profileId, { valid: result.valid, error: result.error });
  }
  return results;
}
