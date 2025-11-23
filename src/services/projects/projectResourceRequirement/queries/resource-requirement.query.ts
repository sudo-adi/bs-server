import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  ProjectSkillRequirement,
  ProjectSkillRequirementWithDetails,
  SkillAllocationStatus,
} from '@/models/projects/projectResourceRequirement.model';

export class ResourceRequirementQuery {
  static async getAllRequirements(filters?: {
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

    const total = await prisma.project_resource_requirements.count({ where });

    const results = await prisma.project_resource_requirements.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return { requirements: results as any[], total };
  }

  static async getRequirementById(
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
      LEFT JOIN project_assignments pd ON pd.project_id = psr.project_id
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
