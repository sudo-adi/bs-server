import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateProjectSkillRequirementDto,
  ProjectSkillRequirement,
  ProjectSkillRequirementWithDetails,
  SkillAllocationStatus,
  UpdateProjectSkillRequirementDto,
} from '@/models/projects/projectResourceRequirement.model';

export class ProjectResourceRequirementService {
  async getAllRequirements(filters?: {
    project_id?: number;
    skill_category_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: ProjectSkillRequirement[]; total: number }> {
    const where: any = {};

    if (filters?.project_id) {
      where.project_id = filters.project_id.toString();
    }

    if (filters?.skill_category_id) {
      where.skill_category_id = filters.skill_category_id.toString();
    }

    // Get total count
    const total = await prisma.project_resource_requirements.count({ where });

    // Get paginated results
    const results = await prisma.project_resource_requirements.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return {
      requirements: results as any[],
      total,
    };
  }

  async getRequirementById(
    id: number,
    includeDetails = false
  ): Promise<ProjectSkillRequirementWithDetails> {
    const requirement: any = await prisma.project_resource_requirements.findUnique({
      where: { id: id.toString() },
      include: includeDetails
        ? {
            skill_categories: true,
            projects: true,
          }
        : undefined,
    });

    if (!requirement) {
      throw new AppError('Project skill requirement not found', 404);
    }

    if (includeDetails) {
      return {
        ...requirement,
        skill_category: requirement.skill_categories,
        project: requirement.projects,
      };
    }

    return requirement;
  }

  async createRequirement(
    data: CreateProjectSkillRequirementDto
  ): Promise<ProjectSkillRequirement> {
    const requirement = await prisma.project_resource_requirements.create({
      data: {
        project_id: data.project_id.toString(),
        skill_category_id: data.skill_category_id.toString(),
        required_count: data.required_count,
        notes: data.notes,
      },
    });

    return requirement as any;
  }

  async updateRequirement(
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

  async deleteRequirement(id: number): Promise<void> {
    try {
      await prisma.project_resource_requirements.delete({
        where: { id: id.toString() },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Project skill requirement not found', 404);
      }
      throw error;
    }
  }

  async getSkillAllocationStatus(projectId: string): Promise<SkillAllocationStatus[]> {
    // Use raw SQL for complex aggregation query with UUID type casting
    const result = await prisma.$queryRaw<SkillAllocationStatus[]>`
      SELECT
        psr.skill_category_id,
        sc.name as skill_category_name,
        psr.required_count,
        COUNT(CASE WHEN pd.status = 'onboarded' THEN 1 END)::int as onboarded_count,
        COUNT(CASE WHEN pd.status = 'deployed' THEN 1 END)::int as deployed_count
      FROM project_resource_requirements psr
      LEFT JOIN skill_categories sc ON sc.id = psr.skill_category_id
      LEFT JOIN project_assignments pd ON pd.project_id = psr.project_id
      LEFT JOIN profiles p ON p.id = pd.profile_id
      LEFT JOIN profile_skills ps ON ps.profile_id = p.id AND ps.skill_category_id = psr.skill_category_id
      WHERE psr.project_id = ${projectId}::uuid
      GROUP BY psr.id, psr.skill_category_id, sc.name, psr.required_count
      ORDER BY sc.name
    `;

    return result;
  }

  async incrementAllocatedCount(projectId: string, skillCategoryId: string): Promise<void> {
    // Note: Prisma doesn't support increment with where conditions on multiple fields easily
    // Using raw SQL for atomic increment with UUID type casting
    await prisma.$executeRaw`
      UPDATE project_resource_requirements
      SET required_count = required_count + 1
      WHERE project_id = ${projectId}::uuid AND skill_category_id = ${skillCategoryId}::uuid
    `;
  }

  async decrementAllocatedCount(projectId: string, skillCategoryId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE project_resource_requirements
      SET required_count = GREATEST(0, required_count - 1)
      WHERE project_id = ${projectId}::uuid AND skill_category_id = ${skillCategoryId}::uuid
    `;
  }

  async checkAllRequirementsMet(projectId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ unmet_count: bigint }]>`
      SELECT COUNT(*) as unmet_count
      FROM project_resource_requirements
      WHERE project_id = ${projectId}::uuid AND required_count > 0
    `;

    return Number(result[0].unmet_count) === 0;
  }
}

export default new ProjectResourceRequirementService();
