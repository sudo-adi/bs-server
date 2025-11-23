import prisma from '@/config/prisma';
import {
  CreateEmployerProjectRequirementDto,
  EmployerProjectRequirement,
} from '@/models/projects/projectRequest.model';
import { ProjectRequestStatus } from '@/types/enums';

export class ProjectRequestCreateOperation {
  static async create(
    data: CreateEmployerProjectRequirementDto
  ): Promise<EmployerProjectRequirement> {
    const requirement = await prisma.project_requests.create({
      data: {
        employer_id: data.employer_id.toString(),
        project_title: data.project_title,
        project_description: data.project_description,
        location: data.location,
        estimated_start_date: data.estimated_start_date
          ? new Date(data.estimated_start_date)
          : null,
        estimated_duration_days: data.estimated_duration_days,
        estimated_budget: data.estimated_budget,
        additional_notes: data.additional_notes,
        status: ProjectRequestStatus.PENDING,
      },
    });

    return requirement as any;
  }
}
