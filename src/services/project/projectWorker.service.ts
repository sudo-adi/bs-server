import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ASSIGNMENT_STATUSES, PROFILE_STAGES } from '@/constants/stages';
import { AssignWorkerToProjectRequest, RemoveWorkerFromProjectRequest } from '@/dtos/project';
import {
  checkWorkerAvailability,
  getAvailableWorkersForProject as getAvailableWorkersUtil,
  getUnavailableWorkers as getUnavailableWorkersUtil,
  type BlockingEvent,
  type UnavailableWorkerInfo,
} from '@/utils/workerAvailability';
import { buildEligibleWorkerWhereClause } from './helpers/worker.helpers';
import {
  assignWorkerToProject as assignWorkerOp,
  autoMatchHelpers as autoMatchOp,
  bulkAssignWorkersToProject as bulkAssignOp,
  bulkRemoveWorkersFromProject as bulkRemoveOp,
  getAutoMatchPreview as getAutoMatchPreviewOp,
  removeWorkerFromProject as removeWorkerOp,
} from './operations';
import {
  getAllAssignments,
  getAssignmentById,
  getMatchableWorkers,
  getMatchableWorkersCountBySkill,
  getMatchedProfiles,
  getProjectAssignments,
  getProjectAssignmentStats,
  getSharedProfiles,
  getWorkerAssignments,
  validateBulkAssignments,
  validateWorkerAssignment,
} from './queries';

export class ProjectWorkerService {
  // ==================== Assignment Operations ====================

  async assignWorkerToProject(
    projectId: string,
    data: AssignWorkerToProjectRequest,
    assignedByProfileId: string
  ): Promise<any> {
    return assignWorkerOp(projectId, data, assignedByProfileId);
  }

  async removeWorkerFromProject(
    projectId: string,
    assignmentId: string,
    data: RemoveWorkerFromProjectRequest,
    removedByProfileId: string
  ): Promise<void> {
    return removeWorkerOp(projectId, assignmentId, data, removedByProfileId);
  }

  async bulkAssignWorkersToProject(
    projectId: string,
    workers: { profileId: string; skillCategoryId?: string }[],
    assignedByProfileId: string
  ): Promise<{
    success: number;
    failed: number;
    assignments: any[];
    errors: { profileId: string; error: string }[];
  }> {
    return bulkAssignOp(projectId, workers, assignedByProfileId);
  }

  async bulkRemoveWorkersFromProject(
    projectId: string,
    assignmentIds: string[],
    reason: string,
    removedByProfileId: string
  ): Promise<{
    success: number;
    failed: number;
    errors: { assignmentId: string; error: string }[];
  }> {
    return bulkRemoveOp(projectId, assignmentIds, reason, removedByProfileId);
  }

  // ==================== Assignment Queries ====================

  async getAllAssignments(
    filters: {
      projectId?: string;
      profileId?: string;
      status?: 'active' | 'removed' | 'all';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return getAllAssignments(filters);
  }

  async getAssignmentById(assignmentId: string): Promise<any | null> {
    return getAssignmentById(assignmentId);
  }

  async getProjectAssignments(projectId: string, includeRemoved = false): Promise<any[]> {
    return getProjectAssignments(projectId, includeRemoved);
  }

  async getWorkerAssignments(profileId: string, includeRemoved = false): Promise<any[]> {
    return getWorkerAssignments(profileId, includeRemoved);
  }

  async getProjectAssignmentStats(projectId: string): Promise<{
    totalAssigned: number;
    currentlyActive: number;
    removed: number;
    bySkill: { skillId: string; skillName: string; count: number }[];
    byStage: { stage: string; count: number }[];
  }> {
    return getProjectAssignmentStats(projectId);
  }

  // ==================== Validation ====================

  async validateWorkerAssignment(
    profileId: string,
    projectId: string
  ): Promise<{
    valid: boolean;
    error?: string;
    conflicts?: Array<{
      type: 'project' | 'training';
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      overlapDays: number;
    }>;
  }> {
    return validateWorkerAssignment(profileId, projectId);
  }

  async validateBulkAssignments(
    profileIds: string[],
    projectId: string
  ): Promise<Map<string, { valid: boolean; error?: string }>> {
    return validateBulkAssignments(profileIds, projectId);
  }

  // ==================== Matching Methods ====================

  async getMatchedProfiles(projectId: string): Promise<any[]> {
    return getMatchedProfiles(projectId);
  }

  async saveMatchedProfiles(
    projectId: string,
    matchedProfiles: Array<{ profileId: string; skillCategoryId?: string }>,
    assignedByProfileId?: string
  ): Promise<{ success: number; failed: number; assignments: any[]; errors: any[] }> {
    return bulkAssignOp(projectId, matchedProfiles, assignedByProfileId || 'system');
  }

  async shareMatchedProfilesWithEmployer(projectId: string): Promise<{ sharedCount: number }> {
    try {
      const result = await prisma.projectWorkerAssignment.updateMany({
        where: {
          projectId,
          removedAt: null,
          stage: ASSIGNMENT_STATUSES.MATCHED,
        },
        data: {
          stage: ASSIGNMENT_STATUSES.ASSIGNED,
          sharedAt: new Date(),
        },
      });

      logger.info('Profiles shared with employer', { projectId, count: result.count });
      return { sharedCount: result.count };
    } catch (error) {
      logger.error('Error sharing profiles with employer', { error, projectId });
      throw new Error('Failed to share profiles with employer');
    }
  }

  async getSharedProfiles(projectId: string): Promise<any[]> {
    return getSharedProfiles(projectId);
  }

  async getMatchableWorkers(
    projectId: string,
    filters: { skillCategoryId?: string; search?: string; limit?: number; offset?: number } = {}
  ): Promise<{ workers: any[]; total: number }> {
    return getMatchableWorkers(projectId, filters);
  }

  async getMatchableWorkersCountBySkill(
    projectId: string
  ): Promise<Array<{ skillCategoryId: string; skillName: string; count: number }>> {
    return getMatchableWorkersCountBySkill(projectId);
  }

  // ==================== Auto-Match ====================

  async autoMatchHelpers(
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
    return autoMatchOp(projectId, assignedByProfileId);
  }

  async getAutoMatchPreview(projectId: string): Promise<{
    message: string;
    can_auto_match: boolean;
    required_count: number;
    already_assigned: number;
    remaining_needed: number;
    available_count: number;
    workers_to_match: any[];
  }> {
    return getAutoMatchPreviewOp(projectId);
  }

  // ==================== Availability Methods ====================

  /**
   * Get available workers for a project based on date availability
   */
  async getAvailableWorkersForProject(
    projectId: string,
    options: { requireBlueWorker?: boolean; page?: number; limit?: number; search?: string } = {}
  ): Promise<{
    data: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      workerCode: string | null;
      candidateCode: string | null;
      currentStage: string | null;
      workerType: string | null;
      skills: Array<{ skillCategory: { id: string; name: string | null } | null }>;
    }>;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    try {
      return await getAvailableWorkersUtil(projectId, options);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting available workers for project', { error, projectId });
      throw new Error(message || 'Failed to get available workers');
    }
  }

  /**
   * Get unavailable workers with their blocking reasons
   */
  async getUnavailableWorkers(
    startDate: Date,
    endDate: Date,
    options: { requireBlueWorker?: boolean; page?: number; limit?: number; search?: string } = {}
  ): Promise<{
    data: UnavailableWorkerInfo[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    try {
      return await getUnavailableWorkersUtil(startDate, endDate, options);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting unavailable workers', { error, startDate, endDate });
      throw new Error(message || 'Failed to get unavailable workers');
    }
  }

  /**
   * Check if a specific worker is available for a date range
   */
  async checkWorkerAvailabilityForDates(
    profileId: string,
    startDate: Date,
    endDate: Date,
    excludeProjectId?: string
  ): Promise<{ isAvailable: boolean; blockingEvents: BlockingEvent[] }> {
    try {
      return await checkWorkerAvailability(profileId, startDate, endDate, excludeProjectId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking worker availability', { error, profileId, startDate, endDate });
      throw new Error(message || 'Failed to check worker availability');
    }
  }

  /**
   * Get eligible workers for a project with availability check
   */
  async getEligibleWorkersForProject(
    projectId: string,
    options: { page?: number; limit?: number; search?: string; skillCategoryId?: string; requireBlueWorker?: boolean } = {}
  ): Promise<{
    data: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      workerCode: string | null;
      candidateCode: string | null;
      currentStage: string | null;
      workerType: string | null;
      phone: string | null;
      profilePhotoURL: string | null;
      skills: Array<{ skillCategory: { id: string; name: string | null } | null }>;
      isAvailable: boolean;
    }>;
    pagination: { total: number; page: number; limit: number; totalPages: number };
    projectDates: { startDate: Date | null; endDate: Date | null };
  }> {
    try {
      const { page = 1, limit = 50, search, skillCategoryId, requireBlueWorker = true } = options;

      const project = await prisma.project.findUnique({
        where: { id: projectId, deletedAt: null },
        select: { id: true, startDate: true, endDate: true, name: true },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.startDate || !project.endDate) {
        throw new Error('Project must have start and end dates to check worker availability');
      }

      const baseWhere = buildEligibleWorkerWhereClause({
        skillCategoryId,
        search,
        requireBlueWorker,
      });

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
          phone: true,
          profilePhotoURL: true,
          skills: { include: { skillCategory: { select: { id: true, name: true, categoryType: true } } } },
        },
        orderBy: [{ currentStage: 'asc' }, { workerCode: 'asc' }, { firstName: 'asc' }],
      });

      const availableWorkers: Array<(typeof allEligibleWorkers)[0] & { isAvailable: boolean }> = [];

      for (const worker of allEligibleWorkers) {
        const hasBlueCollarSkill = worker.skills.some((s) => s.skillCategory?.categoryType === 'blue_collar');
        if (!hasBlueCollarSkill) continue;

        if (skillCategoryId) {
          const hasSkill = worker.skills.some((s) => s.skillCategory?.id === skillCategoryId);
          if (!hasSkill) continue;
        }

        const availability = await checkWorkerAvailability(worker.id, project.startDate, project.endDate, projectId);

        if (availability.isAvailable) {
          availableWorkers.push({ ...worker, isAvailable: true });
        }
      }

      const total = availableWorkers.length;
      const skip = (page - 1) * limit;
      const paginatedWorkers = availableWorkers.slice(skip, skip + limit);

      logger.info('Fetched eligible workers for project', {
        projectId,
        projectName: project.name,
        totalEligible: total,
        returned: paginatedWorkers.length,
      });

      return {
        data: paginatedWorkers,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        projectDates: { startDate: project.startDate, endDate: project.endDate },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting eligible workers for project', { error, projectId });
      throw new Error(message || 'Failed to get eligible workers');
    }
  }
}

export default new ProjectWorkerService();
