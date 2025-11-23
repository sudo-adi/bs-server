import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { EmployerProjectRequirement } from '@/models/projects/projectRequest.model';
import { ProjectRequestStatus } from '@/types/enums';

export class ProjectRequestReviewOperation {
  static async markAsReviewed(
    id: number,
    reviewedByUserId: number
  ): Promise<EmployerProjectRequirement> {
    try {
      const requirement = await prisma.project_requests.update({
        where: { id: id.toString() },
        data: {
          status: ProjectRequestStatus.REVIEWED,
          reviewed_by_user_id: reviewedByUserId.toString(),
          reviewed_at: new Date(),
        },
      });

      return requirement as any;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }

  static async approve(id: string, reviewedByUserId: string): Promise<EmployerProjectRequirement> {
    try {
      const requirement = await prisma.project_requests.update({
        where: { id },
        data: {
          status: ProjectRequestStatus.REVIEWED,
          reviewed_by_user_id: reviewedByUserId,
          reviewed_at: new Date(),
        },
      });

      return requirement as any;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      throw error;
    }
  }

  static async reject(
    id: string,
    reviewedByUserId: string,
    rejectionReason?: string
  ): Promise<EmployerProjectRequirement> {
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

      return requirement as any;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Project request not found', 404);
      }
      throw error;
    }
  }

  static async linkToProject(id: number, projectId: number): Promise<EmployerProjectRequirement> {
    try {
      const requirement = await prisma.project_requests.update({
        where: { id: id.toString() },
        data: {
          status: ProjectRequestStatus.PROJECT_CREATED,
          project_id: projectId.toString(),
        },
      });

      return requirement as any;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }
}
