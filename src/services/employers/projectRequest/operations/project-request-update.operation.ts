import prisma from '@/config/prisma';
import type { project_requests } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { UpdateProjectRequestDto } from '@/models/employers/employer.model';

export class ProjectRequestUpdateOperation {
  static async update(id: string, data: UpdateProjectRequestDto): Promise<project_requests> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const existing = await prisma.project_requests.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Project request not found', 404);
    }

    // Only allow updates if status is pending
    if (existing.status !== 'pending') {
      throw new AppError('Can only update pending project requests', 400);
    }

    const projectRequest = await prisma.project_requests.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return projectRequest;
  }
}
