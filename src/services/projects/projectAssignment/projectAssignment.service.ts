import {
  CreateProjectAssignmentDto,
  ProjectAssignment,
  ProjectAssignmentWithDetails,
  UpdateProjectAssignmentDto,
} from '@/models/projects/projectAssignment.model';
import { AssignmentActivateOperation } from './operations/assignment-activate.operation';
import { AssignmentCancelOperation } from './operations/assignment-cancel.operation';
import { AssignmentCompleteOperation } from './operations/assignment-complete.operation';
import { AssignmentCreateOperation } from './operations/assignment-create.operation';
import { AssignmentDeleteOperation } from './operations/assignment-delete.operation';
import { AssignmentTerminateOperation } from './operations/assignment-terminate.operation';
import { AssignmentUpdateOperation } from './operations/assignment-update.operation';
import { ProjectAssignmentQuery } from './queries/project-assignment.query';

export class ProjectAssignmentService {
  async getAllAssignments(filters?: {
    project_id?: string;
    profile_id?: string;
    limit?: number;
    offset?: number;
    include_details?: boolean;
  }): Promise<{ assignments: ProjectAssignmentWithDetails[]; total: number }> {
    return await ProjectAssignmentQuery.getAllAssignments(filters);
  }

  async getAssignmentById(
    id: string,
    includeDetails = false
  ): Promise<ProjectAssignmentWithDetails> {
    return await ProjectAssignmentQuery.getAssignmentById(id, includeDetails);
  }

  async createAssignment(data: CreateProjectAssignmentDto): Promise<ProjectAssignment> {
    return await AssignmentCreateOperation.create(data);
  }

  async updateAssignment(id: string, data: UpdateProjectAssignmentDto): Promise<ProjectAssignment> {
    return await AssignmentUpdateOperation.update(id, data);
  }

  async deleteAssignment(id: string): Promise<void> {
    return await AssignmentDeleteOperation.delete(id);
  }

  async activateAssignment(id: string): Promise<ProjectAssignment> {
    return await AssignmentActivateOperation.activate(id);
  }

  async completeAssignment(id: string, actualEndDate?: Date): Promise<ProjectAssignment> {
    return await AssignmentCompleteOperation.complete(id, actualEndDate);
  }

  async terminateAssignment(id: string, reason?: string): Promise<ProjectAssignment> {
    return await AssignmentTerminateOperation.terminate(id, reason);
  }

  async cancelAssignment(id: string, reason?: string): Promise<ProjectAssignment> {
    return await AssignmentCancelOperation.cancel(id, reason);
  }
}

export default new ProjectAssignmentService();
