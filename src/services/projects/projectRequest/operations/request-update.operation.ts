import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { UpdateProjectRequestDto } from '@/types';
import { PROJECT_REQUEST_STATUSES, ProjectRequestStatus } from '@/types/enums';
import type { ProjectRequest } from '@/types/prisma.types';

export class ProjectRequestUpdateOperation {
  static async update(id: string, data: UpdateProjectRequestDto): Promise<ProjectRequest> {
    const updateData: Record<string, unknown> = {};

    if (data.project_title !== undefined) updateData.project_title = data.project_title;
    if (data.project_description !== undefined)
      updateData.project_description = data.project_description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.estimated_start_date !== undefined)
      updateData.estimated_start_date = new Date(data.estimated_start_date!);
    if (data.estimated_duration_days !== undefined)
      updateData.estimated_duration_days = data.estimated_duration_days;
    if (data.estimated_budget !== undefined) updateData.estimated_budget = data.estimated_budget;
    if (data.additional_notes !== undefined) updateData.additional_notes = data.additional_notes;
    if (data.status !== undefined) {
      if (!PROJECT_REQUEST_STATUSES.includes(data.status as ProjectRequestStatus)) {
        throw new AppError(
          `Invalid status: ${data.status}. Must be one of: ${PROJECT_REQUEST_STATUSES.join(', ')}`,
          400
        );
      }
      updateData.status = data.status;
    }
    if (data.reviewed_by_user_id !== undefined)
      updateData.reviewed_by_user_id = data.reviewed_by_user_id;
    if (data.project_id !== undefined) updateData.project_id = data.project_id;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const requirement = await prisma.project_requests.update({
        where: { id },
        data: updateData,
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
