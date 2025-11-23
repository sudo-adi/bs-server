import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  ProjectSkillRequirement,
  UpdateProjectSkillRequirementDto,
} from '@/models/projects/projectResourceRequirement.model';

export class ResourceRequirementUpdateOperation {
  static async update(
    id: number,
    data: UpdateProjectSkillRequirementDto
  ): Promise<ProjectSkillRequirement> {
    const updateData: any = {};

    if (data.required_count !== undefined) updateData.required_count = data.required_count;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const requirement = await prisma.project_resource_requirements.update({
        where: { id: id.toString() },
        data: updateData,
      });

      return requirement as any;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Project skill requirement not found', 404);
      }
      throw error;
    }
  }

  static async incrementAllocatedCount(projectId: string, skillCategoryId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE project_resource_requirements
      SET required_count = required_count + 1
      WHERE project_id = ${projectId}::uuid AND skill_category_id = ${skillCategoryId}::uuid
    `;
  }

  static async decrementAllocatedCount(projectId: string, skillCategoryId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE project_resource_requirements
      SET required_count = GREATEST(0, required_count - 1)
      WHERE project_id = ${projectId}::uuid AND skill_category_id = ${skillCategoryId}::uuid
    `;
  }
}
