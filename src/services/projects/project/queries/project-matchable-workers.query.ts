import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

/**
 * Query to get workers that can be matched/assigned to a project
 * Only includes workers in 'trained' or 'benched' stages
 * Excludes workers already assigned to the project
 * Excludes workers with timeline conflicts
 */
export class ProjectMatchableWorkersQuery {
  /**
   * Get matchable workers for a project
   * @param projectId - Project ID to match workers for
   * @param filters - Optional filters
   */
  static async getMatchableWorkers(
    projectId: string,
    filters?: {
      skill_category_id?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ workers: any[]; total: number }> {
    // Get project details
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        code: true,
        name: true,
        start_date: true,
        end_date: true,
        status: true,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (!project.start_date || !project.end_date) {
      throw new AppError('Project must have start and end dates to match workers', 400);
    }

    // Build WHERE conditions - use latest stage from stage_transitions
    let whereConditions = `p.deleted_at IS NULL
      AND p.is_active = true
      AND EXISTS (
        SELECT 1 FROM stage_transitions st
        WHERE st.profile_id = p.id
          AND st.to_stage IN ('trained', 'benched')
          AND st.transitioned_at = (
            SELECT MAX(transitioned_at)
            FROM stage_transitions
            WHERE profile_id = p.id
          )
      )`;

    // Exclude blacklisted workers
    whereConditions += ` AND NOT EXISTS (
      SELECT 1 FROM profile_blacklist pb
      WHERE pb.profile_id = p.id AND pb.is_active = true
    )`;

    // Exclude workers already assigned to this project
    whereConditions += ` AND NOT EXISTS (
      SELECT 1 FROM project_worker_assignments pwa
      WHERE pwa.profile_id = p.id
        AND pwa.project_id = '${projectId}'::uuid
        AND pwa.removed_at IS NULL
    )`;

    // Exclude workers with overlapping project assignments
    whereConditions += ` AND NOT EXISTS (
      SELECT 1
      FROM project_worker_assignments pwa
      JOIN projects proj ON pwa.project_id = proj.id
      WHERE pwa.profile_id = p.id
        AND pwa.removed_at IS NULL
        AND proj.start_date <= '${project.end_date.toISOString()}'::date
        AND proj.end_date >= '${project.start_date.toISOString()}'::date
    )`;

    // Exclude workers in training during project dates
    whereConditions += ` AND NOT EXISTS (
      SELECT 1
      FROM batch_enrollments be
      JOIN training_batches tb ON be.batch_id = tb.id
      WHERE be.profile_id = p.id
        AND be.status IN ('enrolled', 'ongoing')
        AND tb.start_date <= '${project.end_date.toISOString()}'::date
        AND tb.end_date >= '${project.start_date.toISOString()}'::date
    )`;

    // Filter by skill category if provided
    if (filters?.skill_category_id) {
      whereConditions += ` AND EXISTS (
        SELECT 1 FROM profile_skills ps
        WHERE ps.profile_id = p.id
          AND ps.skill_category_id = '${filters.skill_category_id}'::uuid
      )`;
    }

    // Search filter
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      whereConditions += ` AND (
        LOWER(p.first_name) LIKE '%${searchTerm}%'
        OR LOWER(p.last_name) LIKE '%${searchTerm}%'
        OR LOWER(p.phone) LIKE '%${searchTerm}%'
        OR LOWER(p.candidate_code) LIKE '%${searchTerm}%'
        OR LOWER(p.email) LIKE '%${searchTerm}%'
      )`;
    }

    const limitClause = filters?.limit ? ` LIMIT ${filters.limit}` : '';
    const offsetClause = filters?.offset ? ` OFFSET ${filters.offset}` : '';

    // Get matchable workers with their skills
    const workers: any = await prisma.$queryRawUnsafe(`
      SELECT
        p.id,
        p.candidate_code,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.phone,
        p.email,
        p.current_stage,
        p.gender,
        p.date_of_birth,
        p.profile_photo_url,
        p.created_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ps.id,
              'skill_category_id', ps.skill_category_id,
              'skill_name', sc.name,
              'years_of_experience', ps.years_of_experience,
              'is_primary', ps.is_primary
            )
          ) FILTER (WHERE ps.id IS NOT NULL),
          '[]'
        ) as skills
      FROM profiles p
      LEFT JOIN profile_skills ps ON ps.profile_id = p.id
      LEFT JOIN skill_categories sc ON sc.id = ps.skill_category_id
      WHERE ${whereConditions}
      GROUP BY p.id
      ORDER BY p.created_at DESC${limitClause}${offsetClause}
    `);

    // Get total count
    const countResult: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count
      FROM profiles p
      WHERE ${whereConditions}
    `);

    return {
      workers,
      total: countResult[0]?.count || 0,
    };
  }

  /**
   * Get matchable workers for a specific skill requirement
   */
  static async getMatchableWorkersForSkill(
    projectId: string,
    skillCategoryId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ workers: any[]; total: number }> {
    return this.getMatchableWorkers(projectId, {
      skill_category_id: skillCategoryId,
      ...options,
    });
  }

  /**
   * Get matchable workers count by skill for a project
   */
  static async getMatchableWorkersCountBySkill(projectId: string): Promise<
    {
      skill_category_id: string;
      skill_name: string;
      available_count: number;
      required_count: number;
    }[]
  > {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        project_resource_requirements: {
          include: {
            skill_categories: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const skillCounts = await Promise.all(
      project.project_resource_requirements.map(async (requirement) => {
        const result = await this.getMatchableWorkers(projectId, {
          skill_category_id: requirement.skill_category_id || undefined,
        });

        return {
          skill_category_id: requirement.skill_category_id || '',
          skill_name: requirement.skill_categories?.name || 'Unknown',
          available_count: result.total,
          required_count: requirement.required_count,
        };
      })
    );

    return skillCounts;
  }
}
