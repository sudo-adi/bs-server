import {
  CreateProjectRequest,
  ProjectDetailDto,
  ProjectListDto,
  ProjectListQuery,
  ProjectResponseDto,
  UpdateProjectRequest,
  UpdateProjectStageRequest,
} from '@/dtos/project';
import {
  assignWorkerToProject as assignWorkerToProjectOp,
  createProjectFromRequest as createProjectFromRequestOp,
  createProject as createProjectOp,
  deleteProject as deleteProjectOp,
  removeWorkerFromProject as removeWorkerFromProjectOp,
  updateProject as updateProjectOp,
  updateProjectStage as updateProjectStageOp,
} from './operations';
import {
  getAllProjects as getAllProjectsQuery,
  getMatchableWorkers,
  getProjectById as getProjectByIdQuery,
} from './queries';

export class ProjectService {
  /**
   * Get all projects with filters and pagination
   */
  async getAllProjects(query: ProjectListQuery): Promise<{
    data: ProjectListDto[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return getAllProjectsQuery(query);
  }

  /**
   * Get project by ID with full details
   */
  async getProjectById(id: string): Promise<ProjectDetailDto | null> {
    return getProjectByIdQuery(id);
  }

  /**
   * Create a new project with resource requirements and financials
   */
  async createProject(
    data: CreateProjectRequest,
    createdByProfileId?: string
  ): Promise<ProjectResponseDto> {
    return createProjectOp(data, createdByProfileId);
  }

  /**
   * Create a project from an employer project request
   */
  async createProjectFromRequest(
    projectRequestId: string,
    userId?: string
  ): Promise<ProjectResponseDto> {
    return createProjectFromRequestOp(projectRequestId, userId);
  }

  /**
   * Update a project
   */
  async updateProject(
    id: string,
    data: UpdateProjectRequest,
    updatedByProfileId?: string
  ): Promise<ProjectDetailDto> {
    return updateProjectOp(id, data, updatedByProfileId);
  }

  /**
   * Soft delete a project
   */
  async deleteProject(id: string, deletedByProfileId: string): Promise<void> {
    return deleteProjectOp(id, deletedByProfileId);
  }

  /**
   * Update project stage (generic stage update)
   */
  async updateProjectStage(
    id: string,
    data: UpdateProjectStageRequest,
    changedByProfileId?: string
  ): Promise<ProjectResponseDto> {
    return updateProjectStageOp(id, data, changedByProfileId);
  }

  /**
   * Put project on hold (deprecated - use projectStatusService.holdProject)
   */
  async holdProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'on_hold', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Terminate project (deprecated - use projectStatusService.terminateProject)
   */
  async terminateProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'terminated', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Short close project (deprecated - use projectStatusService.shortCloseProject)
   */
  async shortCloseProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'short_closed', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Complete project (deprecated - use projectStatusService.completeProject)
   */
  async completeProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'completed', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Cancel project (deprecated - use projectStatusService.cancelProject)
   */
  async cancelProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'cancelled', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Resume project (deprecated - use projectStatusService.resumeProject)
   */
  async resumeProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'ongoing', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Start project (deprecated - use projectStatusService.startProject)
   */
  async startProject(id: string, data: any, changedByProfileId: string): Promise<any> {
    return this.updateProjectStage(
      id,
      { stage: 'ongoing', userId: changedByProfileId, ...data },
      changedByProfileId
    );
  }

  /**
   * Share project to employer
   */
  async shareProjectToEmployer(
    projectId: string,
    data: any,
    _changedByProfileId: string
  ): Promise<any> {
    // Placeholder - implement sharing logic when needed
    const employerId = data.employerId || data.employer_id;
    return { projectId, employerId, shared: true };
  }

  /**
   * Assign worker to project
   */
  async assignWorkerToProject(
    projectId: string,
    data: any,
    assignedByProfileId: string
  ): Promise<any> {
    return assignWorkerToProjectOp(projectId, data, assignedByProfileId);
  }

  /**
   * Remove worker from project
   */
  async removeWorkerFromProject(
    projectId: string,
    assignmentId: string,
    data: any,
    removedByProfileId: string
  ): Promise<any> {
    return removeWorkerFromProjectOp(projectId, assignmentId, data, removedByProfileId);
  }

  /**
   * Get available workers for project
   */
  async getAvailableWorkersForProject(projectId: string, filters?: any): Promise<any> {
    return getMatchableWorkers(projectId, filters);
  }

  /**
   * Get unavailable workers
   */
  async getUnavailableWorkers(_startDate: Date, _endDate: Date, _options?: any): Promise<any> {
    // Placeholder - implement when needed
    return { workers: [], total: 0 };
  }

  /**
   * Check worker availability for dates
   */
  async checkWorkerAvailabilityForDates(
    _projectId: string,
    _startDate: Date,
    _endDate: Date,
    _filters?: any
  ): Promise<any> {
    // Placeholder - implement when needed
    return { available: true, conflicts: [] };
  }
}

export default new ProjectService();
