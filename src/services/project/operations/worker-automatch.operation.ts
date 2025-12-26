import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  getAssignedProfileIds,
  getHelperRequirement,
  getAvailableWorkersForAutoMatch,
} from '../helpers/worker.helpers';
import { bulkAssignWorkersToProject } from './worker-assign.operation';

/**
 * Auto-match helpers/workers to a project based on requirements
 */
export async function autoMatchHelpers(
  projectId: string,
  assignedByProfileId: string
): Promise<{
  message: string;
  success: number;
  failed: number;
  required_count: number;
  available_count: number;
  assignments: any[];
  errors: any[];
}> {
  try {
    const { helperReq, alreadyAssigned, remainingNeeded } = await getHelperRequirement(projectId);

    if (!helperReq) {
      return {
        message: 'No helper requirement found for this project',
        success: 0,
        failed: 0,
        required_count: 0,
        available_count: 0,
        assignments: [],
        errors: [],
      };
    }

    if (remainingNeeded === 0) {
      return {
        message: 'Project already has required number of workers',
        success: 0,
        failed: 0,
        required_count: helperReq.requiredCount,
        available_count: 0,
        assignments: [],
        errors: [],
      };
    }

    const assignedIds = await getAssignedProfileIds(projectId);

    const availableWorkers = await getAvailableWorkersForAutoMatch(
      helperReq.skillCategoryId!,
      assignedIds,
      remainingNeeded,
      false
    );

    const workersToAssign = availableWorkers.map((w) => ({ profileId: w.id }));
    const result = await bulkAssignWorkersToProject(projectId, workersToAssign, assignedByProfileId);

    return {
      message: `Auto-matched ${result.success} workers to project`,
      success: result.success,
      failed: result.failed,
      required_count: helperReq.requiredCount,
      available_count: availableWorkers.length,
      assignments: result.assignments,
      errors: result.errors,
    };
  } catch (error) {
    logger.error('Error auto-matching helpers', { error, projectId });
    throw new Error('Failed to auto-match helpers');
  }
}

/**
 * Get preview of auto-match (what would happen if auto-match is run)
 */
export async function getAutoMatchPreview(projectId: string): Promise<{
  message: string;
  can_auto_match: boolean;
  required_count: number;
  already_assigned: number;
  remaining_needed: number;
  available_count: number;
  workers_to_match: any[];
}> {
  try {
    const { helperReq, alreadyAssigned, remainingNeeded } = await getHelperRequirement(projectId);

    if (!helperReq) {
      return {
        message: 'No helper requirement found for this project',
        can_auto_match: false,
        required_count: 0,
        already_assigned: alreadyAssigned,
        remaining_needed: 0,
        available_count: 0,
        workers_to_match: [],
      };
    }

    if (remainingNeeded === 0) {
      return {
        message: 'Project already has required number of workers',
        can_auto_match: false,
        required_count: helperReq.requiredCount,
        already_assigned: alreadyAssigned,
        remaining_needed: 0,
        available_count: 0,
        workers_to_match: [],
      };
    }

    const assignedIds = await getAssignedProfileIds(projectId);

    const availableWorkers = await getAvailableWorkersForAutoMatch(
      helperReq.skillCategoryId!,
      assignedIds,
      remainingNeeded,
      true // include details for preview
    );

    return {
      message: availableWorkers.length >= remainingNeeded
        ? `Can auto-match ${remainingNeeded} workers`
        : `Only ${availableWorkers.length} workers available, need ${remainingNeeded}`,
      can_auto_match: availableWorkers.length > 0,
      required_count: helperReq.requiredCount,
      already_assigned: alreadyAssigned,
      remaining_needed: remainingNeeded,
      available_count: availableWorkers.length,
      workers_to_match: availableWorkers,
    };
  } catch (error) {
    logger.error('Error getting auto-match preview', { error, projectId });
    throw new Error('Failed to get auto-match preview');
  }
}
