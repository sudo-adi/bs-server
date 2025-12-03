import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { ProjectSkillRequirementWithDetails, SkillAllocationStatus } from '@/types';
import type { ProjectResourceRequirement } from '@/types/prisma.types';

export class ResourceRequirementQuery {
  static async getAllRequirements(filters?: {
    project_id?: string;
    skill_category_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ requirements: ProjectResourceRequirement[]; total: number }> {
    const where: Record<string, string> = {};

    if (filters?.project_id) {
      where.project_id = filters.project_id;
    }

    if (filters?.skill_category_id) {
      where.skill_category_id = filters.skill_category_id;
    }

    const total = await prisma.project_resource_requirements.count({ where });

    const results = await prisma.project_resource_requirements.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return { requirements: results, total };
  }

  static async getRequirementById(
    id: string,
    includeDetails = false
  ): Promise<ProjectSkillRequirementWithDetails> {
    if (includeDetails) {
      const requirement = await prisma.project_resource_requirements.findUnique({
        where: { id },
        include: {
          skill_categories: true,
          projects: true,
        },
      });

      if (!requirement) {
        throw new AppError('Project skill requirement not found', 404);
      }

      return requirement as ProjectSkillRequirementWithDetails;
    }

    const requirement = await prisma.project_resource_requirements.findUnique({
      where: { id },
    });

    if (!requirement) {
      throw new AppError('Project skill requirement not found', 404);
    }

    return requirement as ProjectSkillRequirementWithDetails;
  }

  static async getSkillAllocationStatus(projectId: string): Promise<SkillAllocationStatus[]> {
    const result = await prisma.$queryRaw<SkillAllocationStatus[]>`
      SELECT
        psr.skill_category_id,
        sc.name as skill_category_name,
        psr.required_count,
        COUNT(CASE WHEN pd.status = 'onboarded' THEN 1 END)::int as onboarded_count,
        COUNT(CASE WHEN pd.status = 'deployed' THEN 1 END)::int as deployed_count
      FROM project_resource_requirements psr
      LEFT JOIN skill_categories sc ON sc.id = psr.skill_category_id
      LEFT JOIN project_worker_assignments pd ON pd.project_id = psr.project_id
      LEFT JOIN profiles p ON p.id = pd.profile_id
      LEFT JOIN profile_skills ps ON ps.profile_id = p.id AND ps.skill_category_id = psr.skill_category_id
      WHERE psr.project_id = ${projectId}::uuid
      GROUP BY psr.id, psr.skill_category_id, sc.name, psr.required_count
      ORDER BY sc.name
    `;

    return result;
  }

  static async checkAllRequirementsMet(projectId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ unmet_count: bigint }]>`
      SELECT COUNT(*) as unmet_count
      FROM project_resource_requirements
      WHERE project_id = ${projectId}::uuid AND required_count > 0
    `;

    return Number(result[0].unmet_count) === 0;
  }
}
