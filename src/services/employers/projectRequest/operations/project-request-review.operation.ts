import prisma from '@/config/prisma';
import type { project_requests } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ReviewProjectRequestDto } from '@/models/employers/employer.model';

export class ProjectRequestReviewOperation {
  static async review(id: string, data: ReviewProjectRequestDto): Promise<project_requests> {
    const existing = await prisma.project_requests.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Project request not found', 404);
    }

    if (existing.status !== 'pending') {
      throw new AppError('Project request has already been reviewed', 400);
    }

    const projectRequest = await prisma.project_requests.update({
      where: { id },
      data: {
        status: data.status,
        reviewed_by_user_id: data.reviewed_by_user_id,
        reviewed_at: new Date(),
        project_id: data.project_id,
        updated_at: new Date(),
      },
    });

    return projectRequest;
  }
}
