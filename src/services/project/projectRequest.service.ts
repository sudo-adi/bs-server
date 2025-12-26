import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

// Types
export interface CreateProjectRequestDto {
  employerId: string;
  projectTitle?: string;
  projectDescription?: string;
  location?: string;
  estimatedStartDate?: string | Date;
  estimatedDurationDays?: number;
  estimatedBudget?: string;
  additionalNotes?: string;
}

export interface UpdateProjectRequestDto {
  projectTitle?: string;
  projectDescription?: string;
  location?: string;
  estimatedStartDate?: string | Date;
  estimatedDurationDays?: number;
  estimatedBudget?: string;
  additionalNotes?: string;
  status?: string;
  reviewedByProfileId?: string;
  projectId?: string;
}

export interface ProjectRequestFilters {
  employerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

const PROJECT_REQUEST_STATUSES = ['pending', 'reviewed', 'approved', 'rejected', 'project_created'];

export class ProjectRequestService {
  /**
   * Get all project requests with filters
   */
  async getAllRequests(
    filters?: ProjectRequestFilters
  ): Promise<{ requests: any[]; total: number }> {
    try {
      const where: Record<string, any> = {};

      if (filters?.employerId) {
        where.employerId = filters.employerId;
      }

      if (filters?.status) {
        if (!PROJECT_REQUEST_STATUSES.includes(filters.status)) {
          throw new AppError(
            `Invalid status: ${filters.status}. Must be one of: ${PROJECT_REQUEST_STATUSES.join(', ')}`,
            400
          );
        }
        where.status = filters.status;
      }

      const total = await prisma.projectRequest.count({ where });

      const results = await prisma.projectRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              employerCode: true,
            },
          },
        },
      });

      return { requests: results, total };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching project requests', { error });
      throw new AppError('Failed to fetch project requests', 500);
    }
  }

  /**
   * Get a project request by ID
   */
  async getRequestById(id: string, includeDetails = false): Promise<any> {
    try {
      const request = await prisma.projectRequest.findUnique({
        where: { id },
        include: includeDetails
          ? {
              employer: true,
              requirements: {
                include: {
                  skillCategory: true,
                },
              },
            }
          : undefined,
      });

      if (!request) {
        throw new AppError('Project request not found', 404);
      }

      return request;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching project request', { error, id });
      throw new AppError('Failed to fetch project request', 500);
    }
  }

  /**
   * Create a new project request
   */
  async createRequest(data: CreateProjectRequestDto): Promise<any> {
    try {
      const request = await prisma.projectRequest.create({
        data: {
          employerId: data.employerId,
          projectTitle: data.projectTitle,
          projectDescription: data.projectDescription,
          location: data.location,
          estimatedStartDate: data.estimatedStartDate ? new Date(data.estimatedStartDate) : null,
          estimatedDurationDays: data.estimatedDurationDays,
          estimatedBudget: data.estimatedBudget,
          additionalNotes: data.additionalNotes,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Project request created', { id: request.id, employerId: data.employerId });
      return request;
    } catch (error) {
      logger.error('Error creating project request', { error });
      throw new AppError('Failed to create project request', 500);
    }
  }

  /**
   * Update a project request
   */
  async updateRequest(id: string, data: UpdateProjectRequestDto): Promise<any> {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.projectTitle !== undefined) updateData.projectTitle = data.projectTitle;
      if (data.projectDescription !== undefined)
        updateData.projectDescription = data.projectDescription;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.estimatedStartDate !== undefined)
        updateData.estimatedStartDate = new Date(data.estimatedStartDate);
      if (data.estimatedDurationDays !== undefined)
        updateData.estimatedDurationDays = data.estimatedDurationDays;
      if (data.estimatedBudget !== undefined) updateData.estimatedBudget = data.estimatedBudget;
      if (data.additionalNotes !== undefined) updateData.additionalNotes = data.additionalNotes;
      if (data.status !== undefined) {
        if (!PROJECT_REQUEST_STATUSES.includes(data.status)) {
          throw new AppError(
            `Invalid status: ${data.status}. Must be one of: ${PROJECT_REQUEST_STATUSES.join(', ')}`,
            400
          );
        }
        updateData.status = data.status;
      }
      if (data.reviewedByProfileId !== undefined)
        updateData.reviewedByProfileId = data.reviewedByProfileId;
      if (data.projectId !== undefined) updateData.projectId = data.projectId;

      const request = await prisma.projectRequest.update({
        where: { id },
        data: updateData,
      });

      logger.info('Project request updated', { id });
      return request;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      if (error instanceof AppError) throw error;
      logger.error('Error updating project request', { error, id });
      throw new AppError('Failed to update project request', 500);
    }
  }

  /**
   * Delete a project request
   */
  async deleteRequest(id: string): Promise<void> {
    try {
      await prisma.projectRequest.delete({
        where: { id },
      });

      logger.info('Project request deleted', { id });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      logger.error('Error deleting project request', { error, id });
      throw new AppError('Failed to delete project request', 500);
    }
  }

  /**
   * Mark a request as reviewed
   */
  async markAsReviewed(id: string, reviewedByProfileId: string): Promise<any> {
    try {
      const request = await prisma.projectRequest.update({
        where: { id },
        data: {
          status: 'reviewed',
          reviewedByProfileId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Project request marked as reviewed', { id, reviewedByProfileId });
      return request;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      logger.error('Error marking project request as reviewed', { error, id });
      throw new AppError('Failed to mark project request as reviewed', 500);
    }
  }

  /**
   * Approve a project request
   */
  async approveRequest(id: string, reviewedByProfileId: string): Promise<any> {
    try {
      const request = await prisma.projectRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedByProfileId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Project request approved', { id, reviewedByProfileId });
      return request;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      logger.error('Error approving project request', { error, id });
      throw new AppError('Failed to approve project request', 500);
    }
  }

  /**
   * Reject a project request
   */
  async rejectRequest(
    id: string,
    reviewedByProfileId: string,
    rejectionReason?: string
  ): Promise<any> {
    try {
      const currentRequest = await prisma.projectRequest.findUnique({
        where: { id },
      });

      if (!currentRequest) {
        throw new AppError('Project request not found', 404);
      }

      const request = await prisma.projectRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedByProfileId,
          reviewedAt: new Date(),
          additionalNotes: rejectionReason
            ? `REJECTED: ${rejectionReason}`
            : currentRequest.additionalNotes,
          updatedAt: new Date(),
        },
      });

      logger.info('Project request rejected', { id, reviewedByProfileId, rejectionReason });
      return request;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      if (error?.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      logger.error('Error rejecting project request', { error, id });
      throw new AppError('Failed to reject project request', 500);
    }
  }

  /**
   * Link a request to a project
   */
  async linkToProject(id: string, projectId: string): Promise<any> {
    try {
      const request = await prisma.projectRequest.update({
        where: { id },
        data: {
          status: 'project_created',
          projectId,
          updatedAt: new Date(),
        },
      });

      logger.info('Project request linked to project', { id, projectId });
      return request;
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      logger.error('Error linking project request to project', { error, id, projectId });
      throw new AppError('Failed to link project request to project', 500);
    }
  }
}

export default new ProjectRequestService();
