import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectRequestStatus } from '@/types/enums';
import type { ProjectRequest } from '@/types/prisma.types';

export class ProjectRequestReviewOperation {
  static async markAsReviewed(id: string, reviewedByUserId: string): Promise<ProjectRequest> {
    try {
      const requirement = await prisma.project_requests.update({
        where: { id },
        data: {
          status: ProjectRequestStatus.REVIEWED,
          reviewed_by_user_id: reviewedByUserId,
          reviewed_at: new Date(),
        },
      });

      return requirement;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }

  static async approve(id: string, reviewedByUserId: string): Promise<ProjectRequest> {
    try {
      const requirement = await prisma.project_requests.update({
        where: { id },
        data: {
          status: ProjectRequestStatus.REVIEWED,
          reviewed_by_user_id: reviewedByUserId,
          reviewed_at: new Date(),
        },
      });

      return requirement;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      throw error;
    }
  }

  static async reject(
    id: string,
    reviewedByUserId: string,
    rejectionReason?: string
  ): Promise<ProjectRequest> {
    try {
      const currentRequest = await prisma.project_requests.findUnique({
        where: { id },
      });

      const requirement = await prisma.project_requests.update({
        where: { id },
        data: {
          status: ProjectRequestStatus.REJECTED,
          reviewed_by_user_id: reviewedByUserId,
          reviewed_at: new Date(),
          additional_notes: rejectionReason
            ? `REJECTED: ${rejectionReason}`
            : currentRequest?.additional_notes,
        },
      });

      return requirement;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      throw error;
    }
  }

  static async linkToProject(id: string, projectId: string): Promise<ProjectRequest> {
    try {
      const requirement = await prisma.project_requests.update({
        where: { id },
        data: {
          status: ProjectRequestStatus.PROJECT_CREATED,
          project_id: projectId,
        },
      });

      return requirement;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }
}
