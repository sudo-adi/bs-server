import {
  CreateProjectSkillRequirementDto,
  ProjectSkillRequirement,
  ProjectSkillRequirementWithDetails,
  SkillAllocationStatus,
  UpdateProjectSkillRequirementDto,
} from '@/types';
import { ResourceRequirementCreateOperation } from './operations/requirement-create.operation';
import { ResourceRequirementDeleteOperation } from './operations/requirement-delete.operation';
import { ResourceRequirementUpdateOperation } from './operations/requirement-update.operation';
import { ResourceRequirementQuery } from './queries/resource-requirement.query';

export class ProjectResourceRequirementService {
  async getAllRequirements(filters?: {
    project_id?: string;
    skill_category_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: ProjectSkillRequirement[]; total: number }> {
    return await ResourceRequirementQuery.getAllRequirements(filters);
  }

  async getRequirementById(
    id: string,
    includeDetails = false
  ): Promise<ProjectSkillRequirementWithDetails> {
    return await ResourceRequirementQuery.getRequirementById(id, includeDetails);
  }

  async createRequirement(
    data: CreateProjectSkillRequirementDto
  ): Promise<ProjectSkillRequirement> {
    return await ResourceRequirementCreateOperation.create(data);
  }

  async updateRequirement(
    id: string,
    data: UpdateProjectSkillRequirementDto
  ): Promise<ProjectSkillRequirement> {
    return await ResourceRequirementUpdateOperation.update(id, data);
  }

  async deleteRequirement(id: string): Promise<void> {
    return await ResourceRequirementDeleteOperation.delete(id);
  }

  async getSkillAllocationStatus(projectId: string): Promise<SkillAllocationStatus[]> {
    return await ResourceRequirementQuery.getSkillAllocationStatus(projectId);
  }

  async incrementAllocatedCount(projectId: string, skillCategoryId: string): Promise<void> {
    return await ResourceRequirementUpdateOperation.incrementAllocatedCount(
      projectId,
      skillCategoryId
    );
  }

  async decrementAllocatedCount(projectId: string, skillCategoryId: string): Promise<void> {
    return await ResourceRequirementUpdateOperation.decrementAllocatedCount(
      projectId,
      skillCategoryId
    );
  }

  async checkAllRequirementsMet(projectId: string): Promise<boolean> {
    return await ResourceRequirementQuery.checkAllRequirementsMet(projectId);
  }
}

export default new ProjectResourceRequirementService();
