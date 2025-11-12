import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateEmployerProjectRequirementDto,
  EmployerProjectRequirement,
  EmployerProjectRequirementWithDetails,
  UpdateEmployerProjectRequirementDto,
} from '@/models/projects/projectRequest.model';
import { PROJECT_REQUEST_STATUSES, ProjectRequestStatus } from '@/types/enums';

export class ProjectRequestService {
  async getAllRequirements(filters?: {
    employer_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: EmployerProjectRequirement[]; total: number }> {
    const where: any = {};

    if (filters?.employer_id) {
      where.employer_id = filters.employer_id.toString();
    }

    if (filters?.status) {
      // Validate status
      if (!PROJECT_REQUEST_STATUSES.includes(filters.status as ProjectRequestStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${PROJECT_REQUEST_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    // Get total count
    const total = await prisma.project_requests.count({ where });

    // Get paginated results
    const results = await prisma.project_requests.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return {
      requirements: results as any[],
      total,
    };
  }

  async getRequirementById(
    id: number,
    includeDetails = false
  ): Promise<EmployerProjectRequirementWithDetails> {
    const requirement: any = await prisma.project_requests.findUnique({
      where: { id: id.toString() },
      include: includeDetails
        ? {
            employers: true,
            projects: true,
          }
        : undefined,
    });

    if (!requirement) {
      throw new AppError('Employer project requirement not found', 404);
    }

    if (includeDetails) {
      return {
        ...requirement,
        employer: requirement.employers,
        project: requirement.projects,
      };
    }

    return requirement;
  }

  async createRequirement(
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

  async updateRequirement(
    id: number,
    data: UpdateEmployerProjectRequirementDto
  ): Promise<EmployerProjectRequirement> {
    const updateData: any = {};

    if (data.project_title !== undefined) updateData.project_title = data.project_title;
    if (data.project_description !== undefined)
      updateData.project_description = data.project_description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.estimated_start_date !== undefined)
      updateData.estimated_start_date = new Date(data.estimated_start_date);
    if (data.estimated_duration_days !== undefined)
      updateData.estimated_duration_days = data.estimated_duration_days;
    if (data.estimated_budget !== undefined) updateData.estimated_budget = data.estimated_budget;
    if (data.additional_notes !== undefined) updateData.additional_notes = data.additional_notes;
    if (data.status !== undefined) {
      // Validate status
      if (!PROJECT_REQUEST_STATUSES.includes(data.status as ProjectRequestStatus)) {
        throw new AppError(
          `Invalid status: ${data.status}. Must be one of: ${PROJECT_REQUEST_STATUSES.join(', ')}`,
          400
        );
      }
      updateData.status = data.status;
    }
    if (data.reviewed_by_user_id !== undefined)
      updateData.reviewed_by_user_id = data.reviewed_by_user_id.toString();
    if (data.project_id !== undefined) updateData.project_id = data.project_id.toString();

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const requirement = await prisma.project_requests.update({
        where: { id: id.toString() },
        data: updateData,
      });

      return requirement as any;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }

  async deleteRequirement(id: number): Promise<void> {
    try {
      await prisma.project_requests.delete({
        where: { id: id.toString() },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Employer project requirement not found', 404);
      }
      throw error;
    }
  }

  async markAsReviewed(id: number, reviewedByUserId: number): Promise<EmployerProjectRequirement> {
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

  async linkToProject(id: number, projectId: number): Promise<EmployerProjectRequirement> {
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

  async approveRequest(id: string, reviewedByUserId: string): Promise<EmployerProjectRequirement> {
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

  async rejectRequest(
    id: string,
    reviewedByUserId: string,
    rejectionReason?: string
  ): Promise<EmployerProjectRequirement> {
    try {
      // Get current request first to preserve notes
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
}

export default new ProjectRequestService();
