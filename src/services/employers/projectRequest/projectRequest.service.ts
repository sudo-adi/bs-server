import type { project_requests } from '@/generated/prisma';
import {
  CreateProjectRequestDto,
  ReviewProjectRequestDto,
  UpdateProjectRequestDto,
} from '@/types';
import { ProjectRequestCreateOperation } from './operations/project-request-create.operation';
import { ProjectRequestDeleteOperation } from './operations/project-request-delete.operation';
import { ProjectRequestReviewOperation } from './operations/project-request-review.operation';
import { ProjectRequestUpdateOperation } from './operations/project-request-update.operation';
import { ProjectRequestQuery } from './queries/project-request.query';

export class ProjectRequestService {
  // ============================================================================
  // QUERIES
  // ============================================================================

  async getAllByEmployerId(
    employerId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ projectRequests: project_requests[]; total: number }> {
    return ProjectRequestQuery.getAllByEmployerId(employerId, filters);
  }

  async getAll(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projectRequests: project_requests[]; total: number }> {
    return ProjectRequestQuery.getAll(filters);
  }

  async getById(id: string): Promise<project_requests> {
    return ProjectRequestQuery.getById(id);
  }

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  async create(data: CreateProjectRequestDto): Promise<project_requests> {
    return ProjectRequestCreateOperation.create(data);
  }

  async update(id: string, data: UpdateProjectRequestDto): Promise<project_requests> {
    return ProjectRequestUpdateOperation.update(id, data);
  }

  async review(id: string, data: ReviewProjectRequestDto): Promise<project_requests> {
    return ProjectRequestReviewOperation.review(id, data);
  }

  async delete(id: string): Promise<void> {
    return ProjectRequestDeleteOperation.delete(id);
  }
}

export default new ProjectRequestService();
