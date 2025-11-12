import type { project_assignments, projects, profiles, profile_skills, skill_categories } from '@/generated/prisma';

// Project Assignment model (formerly Project Deployment)
export type ProjectAssignment = project_assignments;
export type ProjectDeployment = project_assignments; // Legacy alias

export interface CreateProjectAssignmentDto {
  project_id: string;
  profile_id: string;
  status?: string;
  assignment_date?: Date; // Maps to deployment_date in DB
  expected_end_date?: Date;
  assigned_by_user_id?: string;
}

// Legacy alias
export type CreateProjectDeploymentDto = CreateProjectAssignmentDto;

export interface UpdateProjectAssignmentDto {
  status?: string;
  deployment_date?: Date;
  expected_end_date?: Date;
  actual_end_date?: Date;
}

// Legacy alias
export type UpdateProjectDeploymentDto = UpdateProjectAssignmentDto;

// Profile with primary skill
export interface ProfileWithPrimarySkill extends profiles {
  primary_skill?: string;
  profile_skills?: (profile_skills & {
    skill_categories: skill_categories | null;
  })[];
}

// Project Assignment with related data
export interface ProjectAssignmentWithDetails extends project_assignments {
  profile?: ProfileWithPrimarySkill | null;
  project?: projects | null;
}

// Legacy alias
export type ProjectDeploymentWithDetails = ProjectAssignmentWithDetails;
