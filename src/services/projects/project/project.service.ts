import type { CreateProjectDto, ProjectWithDetails, UpdateProjectDto } from '@/types/prisma.types';
import type {
  CompleteProjectDto,
  HoldProjectDto,
  ResumeProjectDto,
  ShortCloseProjectDto,
  StartProjectDto,
  StatusTransitionRequestDto,
  TerminateProjectDto,
} from '@/dtos/project-status.dto';
import type {
  ProjectStatusHistoryWithDocuments,
  ProjectStatusTransitionResult,
} from '@/types/project-status.types';
import { ProjectApproveOperation } from './operations/project-approve.operation';
import { ProjectCreateFromRequestOperation } from './operations/project-create-from-request.operation';
import { ProjectCreateOperation } from './operations/project-create.operation';
import { ProjectDeleteOperation } from './operations/project-delete.operation';
import { ProjectMatchingOperation } from './operations/project-matching.operation';
import { ProjectStatusTransitionOperation } from './operations/project-status-transition.operation';
import { ProjectUpdateOperation } from './operations/project-update.operation';
import { ProjectMatchingQuery } from './queries/project-matching.query';
import { ProjectStatusDocumentQuery } from './queries/project-status-document.query';
import { ProjectStatusHistoryQuery } from './queries/project-status-history.query';
import { ProjectQuery } from './queries/project.query';

export class ProjectService {
  async getAllProjects(filters?: {
    employer_id?: string;
    status?: string;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ projects: ProjectWithDetails[]; total: number }> {
    return await ProjectQuery.getAllProjects(filters);
  }

  async getProjectById(id: string, includeDetails = false): Promise<ProjectWithDetails> {
    return await ProjectQuery.getProjectById(id, includeDetails);
  }

  async createProject(data: CreateProjectDto): Promise<ProjectWithDetails> {
    return await ProjectCreateOperation.create(data);
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectWithDetails> {
    return await ProjectUpdateOperation.update(id, data);
  }

  async deleteProject(id: string, deleted_by_user_id?: string): Promise<void> {
    return await ProjectDeleteOperation.delete(id, deleted_by_user_id);
  }

  async approveProject(
    id: string,
    data: {
      approved_by_user_id: string;
      approve: boolean;
      approval_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<ProjectWithDetails> {
    return await ProjectApproveOperation.approve(id, data);
  }

  async getMatchedProfiles(projectId: string): Promise<any> {
    return await ProjectMatchingQuery.getMatchedProfiles(projectId);
  }

  async saveMatchedProfiles(
    projectId: string,
    matchedProfiles: Array<{ profile_id: string; skill_category_id: string }>
  ): Promise<any> {
    return await ProjectMatchingOperation.saveMatchedProfiles(projectId, matchedProfiles);
  }

  async shareMatchedProfilesWithEmployer(projectId: string, userId?: string): Promise<any> {
    return await ProjectMatchingOperation.shareMatchedProfiles(projectId, userId);
  }

  async getSharedProfiles(projectId: string): Promise<any> {
    return await ProjectMatchingQuery.getSharedProfiles(projectId);
  }

  async onboardMatchedProfile(
    projectId: string,
    profileId: string,
    skillCategoryId: string
  ): Promise<any> {
    return await ProjectMatchingOperation.onboardMatchedProfile(
      projectId,
      profileId,
      skillCategoryId
    );
  }

  async createProjectFromRequest(
    projectRequestId: string,
    userId: string
  ): Promise<ProjectWithDetails> {
    return await ProjectCreateFromRequestOperation.createFromRequest(projectRequestId, userId);
  }

  // ==================== Project Status Lifecycle Methods ====================

  /**
   * Transition project status with validation and side effects
   */
  async transitionProjectStatus(
    projectId: string,
    data: StatusTransitionRequestDto
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.transitionStatus(projectId, data);
  }

  /**
   * Put project on hold with documents and attributable party
   */
  async holdProject(
    projectId: string,
    data: HoldProjectDto,
    changedByUserId: string
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.holdProject(projectId, {
      ...data,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Resume project from on hold status
   */
  async resumeProject(
    projectId: string,
    data: ResumeProjectDto,
    changedByUserId: string
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.resumeProject(projectId, {
      ...data,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Start project (transition to ONGOING)
   */
  async startProject(
    projectId: string,
    data: StartProjectDto,
    changedByUserId: string
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.startProject(projectId, {
      ...data,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Complete project with documents
   */
  async completeProject(
    projectId: string,
    data: CompleteProjectDto,
    changedByUserId: string
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.completeProject(projectId, {
      ...data,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Short close project (early completion)
   */
  async shortCloseProject(
    projectId: string,
    data: ShortCloseProjectDto,
    changedByUserId: string
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.shortCloseProject(projectId, {
      ...data,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Terminate project with worker rollback
   */
  async terminateProject(
    projectId: string,
    data: TerminateProjectDto,
    changedByUserId: string
  ): Promise<ProjectStatusTransitionResult> {
    return await ProjectStatusTransitionOperation.terminateProject(projectId, {
      ...data,
      changed_by_user_id: changedByUserId,
    });
  }

  /**
   * Get project status history
   */
  async getProjectStatusHistory(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      from_status?: string;
      to_status?: string;
    }
  ): Promise<{
    history: ProjectStatusHistoryWithDocuments[];
    total: number;
  }> {
    return await ProjectStatusHistoryQuery.getProjectStatusHistory({
      project_id: projectId,
      ...options,
    });
  }

  /**
   * Get status history by ID
   */
  async getStatusHistoryById(historyId: string): Promise<ProjectStatusHistoryWithDocuments> {
    return await ProjectStatusHistoryQuery.getStatusHistoryById(historyId);
  }

  /**
   * Get all status documents for a project
   */
  async getProjectStatusDocuments(
    projectId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<any> {
    return await ProjectStatusDocumentQuery.getProjectStatusDocuments({
      project_id: projectId,
      ...options,
    });
  }

  /**
   * Get documents for a specific status change
   */
  async getDocumentsByHistoryId(historyId: string): Promise<any> {
    return await ProjectStatusDocumentQuery.getDocumentsByHistoryId(historyId);
  }
}

export default new ProjectService();
