import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

// Types
export interface CreateResourceRequirementDto {
  projectId: string;
  skillCategoryId: string;
  requiredCount: number;
  notes?: string;
}

export interface UpdateResourceRequirementDto {
  requiredCount?: number;
}

export interface ResourceRequirementFilters {
  projectId?: string;
  skillCategoryId?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectAllocationSummary {
  requirements: any[];
  totalAssigned: number;
  totalRequired: number;
}

export class ProjectResourceRequirementService {
  /**
   * Get all resource requirements with filters
   */
  async getAllRequirements(
    filters?: ResourceRequirementFilters
  ): Promise<{ requirements: any[]; total: number }> {
    try {
      const where: Record<string, any> = {};

      if (filters?.projectId) {
        where.projectId = filters.projectId;
      }

      if (filters?.skillCategoryId) {
        where.skillCategoryId = filters.skillCategoryId;
      }

      const total = await prisma.projectResourceRequirement.count({ where });

      const results = await prisma.projectResourceRequirement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          skillCategory: {
            select: {
              id: true,
              name: true,
              categoryType: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
        },
      });

      return { requirements: results, total };
    } catch (error) {
      logger.error('Error fetching resource requirements', { error });
      throw new AppError('Failed to fetch resource requirements', 500);
    }
  }

  /**
   * Get a resource requirement by ID
   */
  async getRequirementById(id: string, includeDetails = false): Promise<any> {
    try {
      const requirement = await prisma.projectResourceRequirement.findUnique({
        where: { id },
        include: includeDetails
          ? {
              skillCategory: true,
              project: true,
            }
          : undefined,
      });

      if (!requirement) {
        throw new AppError('Resource requirement not found', 404);
      }

      return requirement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching resource requirement', { error, id });
      throw new AppError('Failed to fetch resource requirement', 500);
    }
  }

  /**
   * Get requirements for a project
   */
  async getProjectRequirements(projectId: string): Promise<any[]> {
    try {
      const requirements = await prisma.projectResourceRequirement.findMany({
        where: { projectId },
        include: {
          skillCategory: {
            select: {
              id: true,
              name: true,
              categoryType: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return requirements;
    } catch (error) {
      logger.error('Error fetching project requirements', { error, projectId });
      throw new AppError('Failed to fetch project requirements', 500);
    }
  }

  /**
   * Create a new resource requirement
   */
  async createRequirement(data: CreateResourceRequirementDto): Promise<any> {
    try {
      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: data.projectId, deletedAt: null },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Check if skill category exists
      const skillCategory = await prisma.skillCategory.findUnique({
        where: { id: data.skillCategoryId },
      });

      if (!skillCategory) {
        throw new AppError('Skill category not found', 404);
      }

      // Check if requirement already exists for this project and skill
      const existingRequirement = await prisma.projectResourceRequirement.findFirst({
        where: {
          projectId: data.projectId,
          skillCategoryId: data.skillCategoryId,
        },
      });

      if (existingRequirement) {
        throw new AppError(
          'A requirement for this skill already exists on this project. Update the existing requirement instead.',
          400
        );
      }

      const requirement = await prisma.projectResourceRequirement.create({
        data: {
          projectId: data.projectId,
          skillCategoryId: data.skillCategoryId,
          requiredCount: data.requiredCount,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          skillCategory: true,
        },
      });

      logger.info('Resource requirement created', {
        id: requirement.id,
        projectId: data.projectId,
        skillCategoryId: data.skillCategoryId,
      });

      return requirement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating resource requirement', { error });
      throw new AppError('Failed to create resource requirement', 500);
    }
  }

  /**
   * Update a resource requirement
   */
  async updateRequirement(id: string, data: UpdateResourceRequirementDto): Promise<any> {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.requiredCount !== undefined) updateData.requiredCount = data.requiredCount;

      if (Object.keys(updateData).length === 1) {
        throw new AppError('No fields to update', 400);
      }

      const requirement = await prisma.projectResourceRequirement.update({
        where: { id },
        data: updateData,
        include: {
          skillCategory: true,
        },
      });

      logger.info('Resource requirement updated', { id });
      return requirement;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Resource requirement not found', 404);
      }
      if (error instanceof AppError) throw error;
      logger.error('Error updating resource requirement', { error, id });
      throw new AppError('Failed to update resource requirement', 500);
    }
  }

  /**
   * Delete a resource requirement
   */
  async deleteRequirement(id: string): Promise<void> {
    try {
      await prisma.projectResourceRequirement.delete({
        where: { id },
      });

      logger.info('Resource requirement deleted', { id });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Resource requirement not found', 404);
      }
      logger.error('Error deleting resource requirement', { error, id });
      throw new AppError('Failed to delete resource requirement', 500);
    }
  }

  /**
   * Get allocation summary for a project
   * Note: ProjectWorkerAssignment doesn't have skillCategoryId, so we can only get total counts
   */
  async getProjectAllocationSummary(projectId: string): Promise<ProjectAllocationSummary> {
    try {
      const requirements = await prisma.projectResourceRequirement.findMany({
        where: { projectId },
        include: {
          skillCategory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Count total active assignments for this project
      const totalAssigned = await prisma.projectWorkerAssignment.count({
        where: {
          projectId,
          removedAt: null,
        },
      });

      const totalRequired = requirements.reduce((sum, req) => sum + (req.requiredCount || 0), 0);

      return {
        requirements,
        totalAssigned,
        totalRequired,
      };
    } catch (error) {
      logger.error('Error getting allocation summary', { error, projectId });
      throw new AppError('Failed to get allocation summary', 500);
    }
  }

  /**
   * Check if total assignments meet total requirements
   */
  async checkRequirementsMet(projectId: string): Promise<boolean> {
    try {
      const summary = await this.getProjectAllocationSummary(projectId);
      return summary.totalAssigned >= summary.totalRequired;
    } catch (error) {
      logger.error('Error checking requirements', { error, projectId });
      throw new AppError('Failed to check requirements', 500);
    }
  }

  /**
   * Bulk create requirements for a project
   */
  async bulkCreateRequirements(
    projectId: string,
    requirements: { skillCategoryId: string; requiredCount: number }[]
  ): Promise<any[]> {
    try {
      const createdRequirements = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const req of requirements) {
          // Check if already exists
          const existing = await tx.projectResourceRequirement.findFirst({
            where: {
              projectId,
              skillCategoryId: req.skillCategoryId,
            },
          });

          if (existing) {
            // Update existing
            const updated = await tx.projectResourceRequirement.update({
              where: { id: existing.id },
              data: {
                requiredCount: req.requiredCount,
                updatedAt: new Date(),
              },
              include: { skillCategory: true },
            });
            results.push(updated);
          } else {
            // Create new
            const created = await tx.projectResourceRequirement.create({
              data: {
                projectId,
                skillCategoryId: req.skillCategoryId,
                requiredCount: req.requiredCount,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              include: { skillCategory: true },
            });
            results.push(created);
          }
        }

        return results;
      });

      logger.info('Bulk requirements created/updated', {
        projectId,
        count: createdRequirements.length,
      });

      return createdRequirements;
    } catch (error) {
      logger.error('Error bulk creating requirements', { error, projectId });
      throw new AppError('Failed to create requirements', 500);
    }
  }
}

export default new ProjectResourceRequirementService();
