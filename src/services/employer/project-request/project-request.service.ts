import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  CreateProjectRequestRequest,
  ReviewProjectRequestRequest,
  UpdateProjectRequestRequest,
} from '@/dtos/employer/employer.dto';
import { Prisma } from '@/generated/prisma';
import { getEmployerOrThrow } from '../helpers/employer-lookup.helper';

/**
 * Get project requests for an employer
 */
export async function getProjectRequests(employerId: string): Promise<any[]> {
  try {
    await getEmployerOrThrow(employerId);

    return await prisma.projectRequest.findMany({
      where: { employerId },
      include: {
        requirements: {
          include: {
            skillCategory: true,
          },
        },
        reviewedByProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: any) {
    logger.error('Error fetching project requests', { error, employerId });
    throw new Error(error.message || 'Failed to fetch project requests');
  }
}

/**
 * Create project request
 */
export async function createProjectRequest(
  employerId: string,
  data: CreateProjectRequestRequest
): Promise<any> {
  try {
    await getEmployerOrThrow(employerId);

    const { requirements, ...requestData } = data;

    const projectRequest = await prisma.projectRequest.create({
      data: {
        ...requestData,
        employerId,
        status: 'pending',
        estimatedBudget: requestData.estimatedBudget
          ? new Prisma.Decimal(requestData.estimatedBudget)
          : null,
        requirements: requirements
          ? {
              create: requirements.map((req) => ({
                skillCategoryId: req.skillCategoryId,
                requiredCount: req.requiredCount,
              })),
            }
          : undefined,
      },
      include: {
        requirements: {
          include: {
            skillCategory: true,
          },
        },
      },
    });

    logger.info('Project request created', {
      id: projectRequest.id,
      employerId,
    });

    return projectRequest;
  } catch (error: any) {
    logger.error('Error creating project request', { error, employerId });
    throw new Error(error.message || 'Failed to create project request');
  }
}

/**
 * Reject project request
 */
export async function rejectProjectRequest(
  projectRequestId: string,
  reason?: string,
  reviewedByProfileId?: string
): Promise<any> {
  try {
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: projectRequestId },
    });

    if (!projectRequest) {
      throw new Error('Project request not found');
    }

    if (projectRequest.status === 'project_created') {
      throw new Error('Cannot reject a project request that has already been approved');
    }

    if (projectRequest.status === 'rejected') {
      throw new Error('Project request is already rejected');
    }

    const updated = await prisma.projectRequest.update({
      where: { id: projectRequestId },
      data: {
        status: 'rejected',
        additionalNotes: reason
          ? `${projectRequest.additionalNotes || ''}\nRejection reason: ${reason}`.trim()
          : projectRequest.additionalNotes,
        reviewedByProfileId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        employer: {
          select: { id: true, companyName: true },
        },
        requirements: {
          include: { skillCategory: true },
        },
      },
    });

    logger.info('Project request rejected', {
      id: projectRequestId,
      employerId: projectRequest.employerId,
      reason,
    });

    return updated;
  } catch (error: any) {
    logger.error('Error rejecting project request', { error, projectRequestId });
    throw new Error(error.message || 'Failed to reject project request');
  }
}

/**
 * Get all project requests (admin - across all employers)
 */
export async function getAllProjectRequests(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ projectRequests: any[]; total: number }> {
  try {
    const where: Prisma.ProjectRequestWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    const [projectRequests, total] = await Promise.all([
      prisma.projectRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          employer: {
            select: {
              id: true,
              employerCode: true,
              companyName: true,
              clientName: true,
              email: true,
              phone: true,
            },
          },
          reviewedByProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          requirements: {
            include: {
              skillCategory: true,
            },
          },
        },
      }),
      prisma.projectRequest.count({ where }),
    ]);

    return { projectRequests, total };
  } catch (error: any) {
    logger.error('Error fetching all project requests', { error });
    throw new Error(error.message || 'Failed to fetch project requests');
  }
}

/**
 * Get project request by ID
 */
export async function getProjectRequestById(id: string): Promise<any> {
  try {
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            employerCode: true,
            companyName: true,
            clientName: true,
            email: true,
            phone: true,
            registeredAddress: true,
          },
        },
        reviewedByProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        requirements: {
          include: {
            skillCategory: true,
          },
        },
      },
    });

    if (!projectRequest) {
      throw new Error('Project request not found');
    }

    return projectRequest;
  } catch (error: any) {
    logger.error('Error fetching project request by ID', { error, id });
    throw new Error(error.message || 'Failed to fetch project request');
  }
}

/**
 * Update project request (only pending requests can be updated)
 */
export async function updateProjectRequest(
  id: string,
  data: UpdateProjectRequestRequest
): Promise<any> {
  try {
    if (Object.keys(data).length === 0) {
      throw new Error('No fields to update');
    }

    const existing = await prisma.projectRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Project request not found');
    }

    if (existing.status !== 'pending') {
      throw new Error('Can only update pending project requests');
    }

    const projectRequest = await prisma.projectRequest.update({
      where: { id },
      data: {
        ...data,
        estimatedBudget: data.estimatedBudget
          ? new Prisma.Decimal(data.estimatedBudget)
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        requirements: {
          include: {
            skillCategory: true,
          },
        },
      },
    });

    logger.info('Project request updated', { id });

    return projectRequest;
  } catch (error: any) {
    logger.error('Error updating project request', { error, id });
    throw new Error(error.message || 'Failed to update project request');
  }
}

/**
 * Review (approve) project request
 */
export async function reviewProjectRequest(
  id: string,
  data: ReviewProjectRequestRequest
): Promise<any> {
  try {
    const existing = await prisma.projectRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Project request not found');
    }

    if (existing.status !== 'pending') {
      throw new Error('Project request has already been reviewed');
    }

    const projectRequest = await prisma.projectRequest.update({
      where: { id },
      data: {
        status: data.status,
        reviewedByProfileId: data.reviewedByProfileId,
        reviewedAt: new Date(),
        projectId: data.projectId,
        updatedAt: new Date(),
      },
      include: {
        employer: {
          select: { id: true, companyName: true },
        },
        requirements: {
          include: { skillCategory: true },
        },
      },
    });

    logger.info('Project request reviewed', { id, status: data.status });

    return projectRequest;
  } catch (error: any) {
    logger.error('Error reviewing project request', { error, id });
    throw new Error(error.message || 'Failed to review project request');
  }
}

/**
 * Delete project request (only pending requests can be deleted)
 */
export async function deleteProjectRequest(id: string): Promise<void> {
  try {
    const existing = await prisma.projectRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Project request not found');
    }

    if (existing.status !== 'pending') {
      throw new Error('Can only delete pending project requests');
    }

    // Delete requirements first
    await prisma.projectRequestRequirement.deleteMany({
      where: { projectRequestId: id },
    });

    await prisma.projectRequest.delete({
      where: { id },
    });

    logger.info('Project request deleted', { id });
  } catch (error: any) {
    logger.error('Error deleting project request', { error, id });
    throw new Error(error.message || 'Failed to delete project request');
  }
}
