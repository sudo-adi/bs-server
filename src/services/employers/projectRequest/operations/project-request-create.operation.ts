import prisma from '@/config/prisma';
import type { project_requests } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateProjectRequestDto } from '@/types';

export class ProjectRequestCreateOperation {
  static async create(data: CreateProjectRequestDto): Promise<project_requests> {
    // Validate required fields
    if (!data.employer_id) {
      throw new AppError('Employer ID is required', 400);
    }

    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: data.employer_id },
    });

    if (!employer || employer.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    const projectRequest = await prisma.project_requests.create({
      data: {
        employer_id: data.employer_id,
        project_title: data.project_title,
        project_description: data.project_description,
        location: data.location,
        estimated_start_date: data.estimated_start_date,
        estimated_duration_days: data.estimated_duration_days,
        estimated_budget: data.estimated_budget,
        additional_notes: data.additional_notes,
        status: 'pending',
      },
    });

    return projectRequest;
  }
}
