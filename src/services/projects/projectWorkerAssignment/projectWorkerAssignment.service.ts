import {
  CreateProjectWorkerAssignmentDto,
  ProjectWorkerAssignmentFilters,
  ProjectWorkerAssignmentWithRelations,
  RemoveAssignmentDto,
  BulkCreateAssignmentsDto,
} from '@/types';
import { AddWorkerOperation } from './operations/add-worker.operation';
import { RemoveWorkerOperation } from './operations/remove-worker.operation';
import { ValidateAssignmentOperation } from './operations/validate-assignment.operation';
import { AssignmentQuery } from './queries/assignment-query';

/**
 * Project Worker Assignment Service
 * Main service coordinating all worker assignment operations
 */
export class ProjectWorkerAssignmentService {
  private addWorkerOp: AddWorkerOperation;
  private removeWorkerOp: RemoveWorkerOperation;
  private validateOp: ValidateAssignmentOperation;
  private query: AssignmentQuery;

  constructor() {
    this.addWorkerOp = new AddWorkerOperation();
    this.removeWorkerOp = new RemoveWorkerOperation();
    this.validateOp = new ValidateAssignmentOperation();
    this.query = new AssignmentQuery();
  }

  // ===================== Create Operations =====================

  /**
   * Add a single worker to a project
   */
  async createAssignment(
    dto: CreateProjectWorkerAssignmentDto
  ): Promise<ProjectWorkerAssignmentWithRelations> {
    return await this.addWorkerOp.addWorkerToProject(dto);
  }

  /**
   * Bulk add workers to a project
   */
  async bulkCreateAssignments(dto: BulkCreateAssignmentsDto): Promise<{
    success: number;
    failed: number;
    assignments: ProjectWorkerAssignmentWithRelations[];
    errors: { profile_id: string; error: string }[];
  }> {
    return await this.addWorkerOp.bulkAddWorkers(
      dto.project_id,
      dto.assigned_by_user_id,
      dto.assignments
    );
  }

  // ===================== Read Operations =====================

  /**
   * Get all assignments with filters and pagination
   */
  async getAllAssignments(filters: ProjectWorkerAssignmentFilters = {}): Promise<{
    data: ProjectWorkerAssignmentWithRelations[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  }> {
    return await this.query.getAllAssignments(filters);
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(
    assignmentId: string
  ): Promise<ProjectWorkerAssignmentWithRelations | null> {
    return await this.query.getAssignmentById(assignmentId);
  }

  /**
   * Get all assignments for a project
   */
  async getProjectAssignments(
    projectId: string,
    includeRemoved: boolean = false
  ): Promise<ProjectWorkerAssignmentWithRelations[]> {
    return await this.query.getProjectAssignments(projectId, includeRemoved);
  }

  /**
   * Get all assignments for a worker
   */
  async getWorkerAssignments(
    profileId: string,
    includeRemoved: boolean = false
  ): Promise<ProjectWorkerAssignmentWithRelations[]> {
    return await this.query.getWorkerAssignments(profileId, includeRemoved);
  }

  /**
   * Get assignment statistics for a project
   */
  async getProjectAssignmentStats(projectId: string): Promise<{
    total_assigned: number;
    currently_active: number;
    removed: number;
    by_skill: {
      skill_id: string;
      skill_name: string;
      count: number;
    }[];
  }> {
    return await this.query.getProjectAssignmentStats(projectId);
  }

  // ===================== Delete Operations =====================

  /**
   * Remove a worker from a project
   */
  async removeAssignment(
    assignmentId: string,
    dto: RemoveAssignmentDto
  ): Promise<{ success: boolean; message: string }> {
    return await this.removeWorkerOp.removeWorkerFromProject(assignmentId, dto);
  }

  /**
   * Bulk remove workers from project
   */
  async bulkRemoveAssignments(
    assignmentIds: string[],
    dto: RemoveAssignmentDto
  ): Promise<{
    success: number;
    failed: number;
    errors: { assignment_id: string; error: string }[];
  }> {
    return await this.removeWorkerOp.bulkRemoveWorkers(assignmentIds, dto);
  }

  // ===================== Validation Operations =====================

  /**
   * Validate if a worker can be assigned to a project
   */
  async validateAssignment(profileId: string, projectId: string) {
    return await this.validateOp.validateWorkerAssignment(profileId, projectId);
  }

  /**
   * Validate bulk assignments
   */
  async validateBulkAssignments(profileIds: string[], projectId: string) {
    return await this.validateOp.validateBulkAssignments(profileIds, projectId);
  }
}

// Export singleton instance
export default new ProjectWorkerAssignmentService();
