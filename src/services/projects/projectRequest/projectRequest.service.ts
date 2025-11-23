import {
  CreateEmployerProjectRequirementDto,
  EmployerProjectRequirement,
  EmployerProjectRequirementWithDetails,
  UpdateEmployerProjectRequirementDto,
} from '@/models/projects/projectRequest.model';
import { ProjectRequestCreateOperation } from './operations/request-create.operation';
import { ProjectRequestDeleteOperation } from './operations/request-delete.operation';
import { ProjectRequestReviewOperation } from './operations/request-review.operation';
import { ProjectRequestUpdateOperation } from './operations/request-update.operation';
import { ProjectRequestQuery } from './queries/project-request.query';

export class ProjectRequestService {
  async getAllRequirements(filters?: {
    employer_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: EmployerProjectRequirement[]; total: number }> {
    return await ProjectRequestQuery.getAllRequirements(filters);
  }

  async getRequirementById(
    id: number,
    includeDetails = false
  ): Promise<EmployerProjectRequirementWithDetails> {
    return await ProjectRequestQuery.getRequirementById(id, includeDetails);
  }

  async createRequirement(
    data: CreateEmployerProjectRequirementDto
  ): Promise<EmployerProjectRequirement> {
    return await ProjectRequestCreateOperation.create(data);
  }

  async updateRequirement(
    id: number,
    data: UpdateEmployerProjectRequirementDto
  ): Promise<EmployerProjectRequirement> {
    return await ProjectRequestUpdateOperation.update(id, data);
  }

  async deleteRequirement(id: number): Promise<void> {
    return await ProjectRequestDeleteOperation.delete(id);
  }

  async markAsReviewed(id: number, reviewedByUserId: number): Promise<EmployerProjectRequirement> {
    return await ProjectRequestReviewOperation.markAsReviewed(id, reviewedByUserId);
  }

  async linkToProject(id: number, projectId: number): Promise<EmployerProjectRequirement> {
    return await ProjectRequestReviewOperation.linkToProject(id, projectId);
  }

  async approveRequest(id: string, reviewedByUserId: string): Promise<EmployerProjectRequirement> {
    return await ProjectRequestReviewOperation.approve(id, reviewedByUserId);
  }

  async rejectRequest(
    id: string,
    reviewedByUserId: string,
    rejectionReason?: string
  ): Promise<EmployerProjectRequirement> {
    return await ProjectRequestReviewOperation.reject(id, reviewedByUserId, rejectionReason);
  }
}

export default new ProjectRequestService();
