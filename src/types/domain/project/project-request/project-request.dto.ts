import type { ProjectRequest, ProjectRequestRequirement } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// CreateProjectRequestDto with required employer_id and project_title
export type CreateProjectRequestDto = Pick<ProjectRequest, 'project_title' | 'employer_id'> &
  Partial<
    Omit<
      ProjectRequest,
      | 'id' // Auto-generated
      | 'project_title' // Already required above
      | 'employer_id' // Already required above
      | 'status' // Has default
      | 'created_at' // Auto-set
      | 'updated_at' // Auto-set
      | 'reviewed_at' // Set on review
      | 'reviewed_by_user_id' // Set on review
      | 'project_id' // Set on approval
      // Relations
      | 'project_request_requirements'
      | 'employers'
      | 'projects'
      | 'users'
    >
  >;

export type UpdateProjectRequestDto = UpdateDTO<ProjectRequest>;

export interface ReviewProjectRequestDto {
  reviewed_by_user_id: string;
  status: 'approved' | 'rejected';
  project_id?: string;
}

// CreateProjectRequestRequirementDto: project_request_id, skill_category_id, required_count are required
export type CreateProjectRequestRequirementDto = Pick<
  ProjectRequestRequirement,
  'project_request_id' | 'skill_category_id' | 'required_count'
> &
  Partial<
    Omit<
      ProjectRequestRequirement,
      | 'id'
      | 'project_request_id'
      | 'skill_category_id'
      | 'required_count'
      | 'created_at'
      | 'updated_at'
    >
  >;

export type UpdateProjectRequestRequirementDto = UpdateDTO<
  ProjectRequestRequirement,
  'project_request_id' | 'skill_category_id' // Cannot change these after creation
>;

// Legacy aliases - keeping for backward compatibility
export type EmployerProjectRequirement = ProjectRequest;
export type CreateEmployerProjectRequirementDto = CreateProjectRequestDto;
export type UpdateEmployerProjectRequirementDto = UpdateProjectRequestDto;
export type EmployerProjectRequirementWithDetails = ProjectRequest;
