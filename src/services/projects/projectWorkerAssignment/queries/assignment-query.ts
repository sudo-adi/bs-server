import prisma from '@/config/prisma';
import { ProjectWorkerAssignmentFilters, ProjectWorkerAssignmentWithRelations } from '@/types';

/**
 * Helper function to map Prisma result to expected type structure
 */
function mapToAssignmentWithRelations(
  assignment: Record<string, unknown>
): ProjectWorkerAssignmentWithRelations {
  const assign = assignment as Record<string, unknown>;
  return {
    ...assign,
    projects: (assign.projects as Record<string, unknown>)
      ? {
          id: (assign.projects as Record<string, unknown>).id as string,
          project_name: (assign.projects as Record<string, unknown>).name as string,
          project_code: (assign.projects as Record<string, unknown>).code as string | null,
        }
      : undefined,
    skill_categories: (assign.skill_categories as Record<string, unknown>)
      ? {
          id: (assign.skill_categories as Record<string, unknown>).id as string,
          category_name: (assign.skill_categories as Record<string, unknown>).name as string,
        }
      : undefined,
  } as ProjectWorkerAssignmentWithRelations;
}

/**
 * Query Layer for Project Worker Assignments
 * Handles all read operations
 */
export class AssignmentQuery {
  /**
   * Get all assignments with filters
   */
  async getAllAssignments(filters: ProjectWorkerAssignmentFilters = {}): Promise<{
    data: ProjectWorkerAssignmentWithRelations[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  }> {
    const {
      project_id,
      profile_id,
      skill_category_id,
      status = 'active',
      from_date,
      to_date,
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (project_id) {
      where.project_id = project_id;
    }

    if (profile_id) {
      where.profile_id = profile_id;
    }

    if (skill_category_id) {
      where.skill_category_id = skill_category_id;
    }

    // Filter by status
    if (status === 'active') {
      where.removed_at = null;
    } else if (status === 'removed') {
      where.removed_at = { not: null };
    }
    // 'all' - no filter on removed_at

    // Filter by deployment date range
    if (from_date || to_date) {
      const dateFilter: Record<string, Date> = {};
      if (from_date) {
        dateFilter.gte = from_date;
      }
      if (to_date) {
        dateFilter.lte = to_date;
      }
      where.deployed_date = dateFilter;
    }

    // Get total count
    const total = await prisma.project_worker_assignments.count({ where });

    // Get paginated data
    const data = await prisma.project_worker_assignments.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        profiles: {
          select: {
            id: true,
            candidate_code: true,
            first_name: true,
            last_name: true,
            current_stage: true,
            phone: true,
          },
        },
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
            employer_id: true,
            employers: {
              select: {
                id: true,
                company_name: true,
              },
            },
          },
        },
        skill_categories: {
          select: {
            id: true,
            name: true,
          },
        },
        users_assigned_by: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        users_removed_by: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return {
      data: data.map(mapToAssignmentWithRelations),
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(
    assignmentId: string
  ): Promise<ProjectWorkerAssignmentWithRelations | null> {
    const assignment = await prisma.project_worker_assignments.findUnique({
      where: { id: assignmentId },
      include: {
        profiles: {
          select: {
            id: true,
            candidate_code: true,
            first_name: true,
            last_name: true,
            current_stage: true,
            phone: true,
            email: true,
          },
        },
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
            location: true,
            employers: {
              select: {
                id: true,
                company_name: true,
              },
            },
          },
        },
        skill_categories: {
          select: {
            id: true,
            name: true,
          },
        },
        users_assigned_by: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
        users_removed_by: {
          select: {
            id: true,
            username: true,
            full_name: true,
          },
        },
      },
    });

    return assignment ? mapToAssignmentWithRelations(assignment) : null;
  }

  /**
   * Get all assignments for a specific project
   */
  async getProjectAssignments(
    projectId: string,
    includeRemoved: boolean = false
  ): Promise<ProjectWorkerAssignmentWithRelations[]> {
    const where: Record<string, unknown> = {
      project_id: projectId,
    };

    if (!includeRemoved) {
      where.removed_at = null;
    }

    const assignments = await prisma.project_worker_assignments.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      include: {
        profiles: {
          select: {
            id: true,
            candidate_code: true,
            first_name: true,
            last_name: true,
            current_stage: true,
            phone: true,
          },
        },
        skill_categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return assignments.map(mapToAssignmentWithRelations);
  }

  /**
   * Get all assignments for a specific worker
   */
  async getWorkerAssignments(
    profileId: string,
    includeRemoved: boolean = false
  ): Promise<ProjectWorkerAssignmentWithRelations[]> {
    const where: Record<string, unknown> = {
      profile_id: profileId,
    };

    if (!includeRemoved) {
      where.removed_at = null;
    }

    const assignments = await prisma.project_worker_assignments.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        projects: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            start_date: true,
            end_date: true,
            location: true,
            employers: {
              select: {
                id: true,
                company_name: true,
              },
            },
          },
        },
        skill_categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return assignments.map(mapToAssignmentWithRelations);
  }

  /**
   * Get assignment statistics for a project
   */
  async getProjectAssignmentStats(projectId: string): Promise<{
    total_assigned: number;
    currently_active: number;
    removed: number;
    by_skill: {
      skill_id: string;
      skill_name: string;
      count: number;
    }[];
  }> {
    const [totalAssigned, currentlyActive, removed, bySkill] = await Promise.all([
      // Total assigned (including removed)
      prisma.project_worker_assignments.count({
        where: { project_id: projectId },
      }),

      // Currently active
      prisma.project_worker_assignments.count({
        where: {
          project_id: projectId,
          removed_at: null,
        },
      }),

      // Removed
      prisma.project_worker_assignments.count({
        where: {
          project_id: projectId,
          removed_at: { not: null },
        },
      }),

      // By skill
      prisma.project_worker_assignments.groupBy({
        by: ['skill_category_id'],
        where: {
          project_id: projectId,
          removed_at: null,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get skill names
    const skillIds = bySkill.map((s) => s.skill_category_id);
    const skills = await prisma.skill_categories.findMany({
      where: {
        id: { in: skillIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const skillMap = new Map(skills.map((s) => [s.id, s.name]));

    const bySkillWithNames = bySkill.map((s) => ({
      skill_id: s.skill_category_id,
      skill_name: skillMap.get(s.skill_category_id) || 'Unknown',
      count: s._count.id,
    }));

    return {
      total_assigned: totalAssigned,
      currently_active: currentlyActive,
      removed,
      by_skill: bySkillWithNames,
    };
  }
}

export default AssignmentQuery;
