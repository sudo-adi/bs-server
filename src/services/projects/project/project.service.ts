import prisma from '@/config/prisma';
import type { CreateProjectDto, ProjectWithDetails, UpdateProjectDto } from '@/types';
// COMMENTED OUT - Will implement project status transitions later
// import type {
//   CompleteProjectDto,
//   HoldProjectDto,
//   ResumeProjectDto,
//   ShortCloseProjectDto,
//   StartProjectDto,
//   StatusTransitionRequestDto,
//   TerminateProjectDto,
// } from '@/dtos/project-status.dto';
import type { ProjectStatusHistoryWithDocuments } from '@/types';
import { ProjectApproveOperation } from './operations/project-approve.operation';
import { ProjectCreateFromRequestOperation } from './operations/project-create-from-request.operation';
import { ProjectCreateOperation } from './operations/project-create.operation';
import { ProjectDeleteOperation } from './operations/project-delete.operation';
import { ProjectUpdateOperation } from './operations/project-update.operation';
// COMMENTED OUT - Will implement project matching later with different approach
// import { ProjectMatchingOperation } from './operations/project-matching.operation';
// import { ProjectStatusTransitionOperation } from './operations/project-status-transition.operation';
// import { ProjectMatchingQuery } from './queries/project-matching.query';
import { ProjectAutoMatchHelpersOperation } from './operations/project-auto-match-helpers.operation';
import { ProjectMatchableWorkersQuery } from './queries/project-matchable-workers.query';
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
    // Get currently assigned workers to the project
    const assignments = await prisma.project_worker_assignments.findMany({
      where: {
        project_id: projectId,
        removed_at: null, // Only active assignments
      },
      include: {
        profiles: {
          include: {
            profile_skills: {
              include: {
                skill_categories: true,
              },
            },
          },
        },
        skill_categories: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Return array directly to match frontend expectations
    return assignments.map((assignment) => ({
      id: assignment.id,
      profile_id: assignment.profile_id,
      skill_category_id: assignment.skill_category_id,
      assigned_by_user_id: assignment.assigned_by_user_id,
      onboarded_date: assignment.onboarded_date,
      deployed_date: assignment.deployed_date,
      created_at: assignment.created_at,
      profile: {
        id: assignment.profiles.id,
        candidate_code: assignment.profiles.candidate_code,
        first_name: assignment.profiles.first_name,
        middle_name: assignment.profiles.middle_name,
        last_name: assignment.profiles.last_name,
        phone: assignment.profiles.phone,
        email: assignment.profiles.email,
        current_stage: assignment.profiles.current_stage,
        gender: assignment.profiles.gender,
        date_of_birth: assignment.profiles.date_of_birth,
        profile_photo_url: assignment.profiles.profile_photo_url,
        skills: assignment.profiles.profile_skills,
      },
      skill_category: assignment.skill_categories,
    }));
  }

  async saveMatchedProfiles(
    projectId: string,
    matchedProfiles: Array<{ profile_id: string; skill_category_id: string }>
  ): Promise<any> {
    // Use upsert to handle duplicate assignments (unique constraint on project_id, profile_id, skill_category_id)
    const assignments = await Promise.all(
      matchedProfiles.map((match) =>
        prisma.project_worker_assignments.upsert({
          where: {
            project_id_profile_id_skill_category_id: {
              project_id: projectId,
              profile_id: match.profile_id,
              skill_category_id: match.skill_category_id,
            },
          },
          update: {
            updated_at: new Date(),
          },
          create: {
            project_id: projectId,
            profile_id: match.profile_id,
            skill_category_id: match.skill_category_id,
          },
        })
      )
    );

    return {
      count: assignments.length,
      assignments,
    };
  }

  async shareMatchedProfilesWithEmployer(projectId: string): Promise<any> {
    // Get the project to check its status
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { id: true, status: true, start_date: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get all matched profiles for this project that haven't been shared yet
    const assignments = await prisma.project_worker_assignments.findMany({
      where: {
        project_id: projectId,
        removed_at: null,
        onboarded_date: null, // Only share profiles that haven't been onboarded yet
      },
      include: {
        profiles: true,
      },
    });

    if (assignments.length === 0) {
      return {
        message: 'No new profiles to share',
        shared_count: 0,
      };
    }

    const now = new Date();

    // Determine worker stage based on project start date
    // - If project.start_date <= current date → worker stage = 'onboarded'
    // - If project.start_date > current date → worker stage = 'allocated'
    const workerStage = project.start_date && project.start_date <= now ? 'onboarded' : 'allocated';

    // Update all matched profiles to set onboarded_date and update worker stages
    const updatePromises = assignments.map(async (assignment) => {
      // Update the assignment with onboarded_date
      const updatedAssignment = await prisma.project_worker_assignments.update({
        where: { id: assignment.id },
        data: {
          onboarded_date: now,
        },
      });

      // Update the worker's current_stage
      await prisma.profiles.update({
        where: { id: assignment.profile_id },
        data: {
          current_stage: workerStage,
        },
      });

      return updatedAssignment;
    });

    await Promise.all(updatePromises);

    // Update project status to 'workers_shared' if it's currently 'planning' or 'approved'
    if (project.status === 'planning' || project.status === 'approved') {
      await prisma.projects.update({
        where: { id: projectId },
        data: {
          status: 'workers_shared',
        },
      });
    }

    return {
      message: 'Profiles shared with employer successfully',
      shared_count: assignments.length,
      project_status: 'workers_shared',
      worker_stage: workerStage,
      profiles: assignments.map((a) => ({
        profile_id: a.profile_id,
        skill_category_id: a.skill_category_id,
        name: `${a.profiles.first_name} ${a.profiles.last_name || ''}`.trim(),
      })),
    };
  }

  async getSharedProfiles(projectId: string): Promise<any> {
    // Get profiles that have been shared with employer (onboarded_date is set)
    const sharedAssignments = await prisma.project_worker_assignments.findMany({
      where: {
        project_id: projectId,
        removed_at: null,
        onboarded_date: { not: null }, // Only profiles that have been shared/onboarded
      },
      include: {
        profiles: {
          include: {
            profile_skills: {
              include: {
                skill_categories: true,
              },
            },
          },
        },
        skill_categories: true,
      },
      orderBy: {
        onboarded_date: 'desc',
      },
    });

    return {
      count: sharedAssignments.length,
      profiles: sharedAssignments.map((assignment) => ({
        id: assignment.id,
        profile_id: assignment.profile_id,
        skill_category_id: assignment.skill_category_id,
        onboarded_date: assignment.onboarded_date,
        deployed_date: assignment.deployed_date,
        profile: {
          id: assignment.profiles.id,
          candidate_code: assignment.profiles.candidate_code,
          first_name: assignment.profiles.first_name,
          middle_name: assignment.profiles.middle_name,
          last_name: assignment.profiles.last_name,
          phone: assignment.profiles.phone,
          email: assignment.profiles.email,
          current_stage: assignment.profiles.current_stage,
          skills: assignment.profiles.profile_skills,
        },
        skill_category: assignment.skill_categories,
      })),
    };
  }

  async createProjectFromRequest(
    projectRequestId: string,
    userId: string
  ): Promise<ProjectWithDetails> {
    return await ProjectCreateFromRequestOperation.createFromRequest(projectRequestId, userId);
  }

  // ==================== Project Status Lifecycle Methods ====================

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

  // ==================== Worker Matching Methods ====================

  /**
   * Get workers available for matching to a project
   */
  async getMatchableWorkers(
    projectId: string,
    filters?: {
      skill_category_id?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ workers: any[]; total: number }> {
    return await ProjectMatchableWorkersQuery.getMatchableWorkers(projectId, filters);
  }

  /**
   * Get matchable workers count by skill category
   */
  async getMatchableWorkersCountBySkill(projectId: string): Promise<
    {
      skill_category_id: string;
      skill_name: string;
      available_count: number;
      required_count: number;
    }[]
  > {
    return await ProjectMatchableWorkersQuery.getMatchableWorkersCountBySkill(projectId);
  }

  /**
   * Auto-match helpers to a project
   */
  async autoMatchHelpers(projectId: string, userId: string): Promise<any> {
    const operation = new ProjectAutoMatchHelpersOperation();
    return await operation.autoMatchHelpers(projectId, userId);
  }

  /**
   * Get auto-match preview for helpers
   */
  async getAutoMatchPreview(projectId: string): Promise<any> {
    const operation = new ProjectAutoMatchHelpersOperation();
    return await operation.getAutoMatchPreview(projectId);
  }
}

export default new ProjectService();
