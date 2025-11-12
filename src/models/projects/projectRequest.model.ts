import type { project_requests, employers, projects, users, project_request_requirements } from '@/generated/prisma';

// Project Request model (formerly Employer Project Requirement)
export type ProjectRequest = project_requests;
export type EmployerProjectRequirement = project_requests; // Legacy alias

export interface CreateProjectRequestDto {
  employer_id: string;
  project_title: string;
  project_description?: string;
  location?: string;
  estimated_start_date?: Date;
  estimated_duration_days?: number;
  estimated_budget?: number | string;
  additional_notes?: string;
  requirements?: Array<{
    skill_category_id: string;
    required_count: number;
    notes?: string;
  }>;
}

export interface UpdateProjectRequestDto {
  project_title?: string;
  project_description?: string;
  location?: string;
  estimated_start_date?: Date;
  estimated_duration_days?: number;
  estimated_budget?: number | string;
  additional_notes?: string;
  status?: string;
  reviewed_by_user_id?: string;
  project_id?: string;
  reviewed_at?: Date;
}

export interface ProjectRequestWithDetails extends project_requests {
  employers?: employers | null;
  projects?: projects | null;
  users?: users | null;
  project_request_requirements?: project_request_requirements[];
}

// Legacy aliases
export type CreateEmployerProjectRequirementDto = CreateProjectRequestDto;
export type UpdateEmployerProjectRequirementDto = UpdateProjectRequestDto;
export type EmployerProjectRequirementWithDetails = ProjectRequestWithDetails;
