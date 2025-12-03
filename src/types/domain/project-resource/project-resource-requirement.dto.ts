import type { Project, ProjectResourceRequirement, SkillCategory } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// Create DTO: project_id and skill_category_id are required, notes is optional
export type CreateProjectResourceRequirementDto = Pick<
  ProjectResourceRequirement,
  'project_id' | 'skill_category_id' | 'required_count'
> &
  Partial<
    Omit<
      ProjectResourceRequirement,
      'id' | 'project_id' | 'skill_category_id' | 'required_count' | 'created_at' | 'updated_at'
    >
  >;

export type UpdateProjectResourceRequirementDto = UpdateDTO<
  ProjectResourceRequirement,
  'project_id' | 'skill_category_id' // Cannot change project or skill after creation
>;

export interface ProjectResourceRequirementWithDetails extends ProjectResourceRequirement {
  skill_categories?: SkillCategory | null;
  projects?: Project | null;
}

// Legacy aliases
export type ProjectSkillRequirement = ProjectResourceRequirement;
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
