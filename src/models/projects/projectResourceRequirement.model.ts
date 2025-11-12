import type { project_resource_requirements, skill_categories, projects } from '@/generated/prisma';

// Project Resource Requirement model (formerly Project Skill Requirement)
export type ProjectResourceRequirement = project_resource_requirements;
export type ProjectSkillRequirement = project_resource_requirements; // Legacy alias

export interface CreateProjectResourceRequirementDto {
  project_id: string;
  skill_category_id: string;
  required_count: number;
  notes?: string;
}

export interface UpdateProjectResourceRequirementDto {
  skill_category_id?: string;
  required_count?: number;
  notes?: string;
}

export interface ProjectResourceRequirementWithDetails extends project_resource_requirements {
  skill_categories?: skill_categories | null;
  projects?: projects | null;
}

// Legacy aliases
export type CreateProjectSkillRequirementDto = CreateProjectResourceRequirementDto;
export type UpdateProjectSkillRequirementDto = UpdateProjectResourceRequirementDto;
export type ProjectSkillRequirementWithDetails = ProjectResourceRequirementWithDetails;

export interface SkillAllocationStatus {
  skill_category_id: string;
  skill_category_name: string;
  required_count: number;
  allocated_count: number;
  onboarded_count: number;
  deployed_count: number;
}
