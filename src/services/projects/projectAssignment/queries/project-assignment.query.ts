import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ProjectAssignmentWithDetails } from '@/models/projects/projectAssignment.model';

export class ProjectAssignmentQuery {
  /**
   * Get all assignments with filters
   */
  static async getAllAssignments(filters?: {
    project_id?: string;
    profile_id?: string;
    limit?: number;
    offset?: number;
    include_details?: boolean;
  }): Promise<{ assignments: ProjectAssignmentWithDetails[]; total: number }> {
    const where: any = {};

    if (filters?.project_id) where.project_id = filters.project_id;
    if (filters?.profile_id) where.profile_id = filters.profile_id;

    const total = await prisma.project_assignments.count({ where });

    const include = filters?.include_details
      ? {
          profiles: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              phone: true,
              profile_skills: {
                where: { is_primary: true },
                take: 1,
                include: { skill_categories: { select: { name: true } } },
              },
            },
          },
          projects: true,
        }
      : undefined;

    const assignments = await prisma.project_assignments.findMany({
      where,
      include,
      orderBy: { deployment_date: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    const transformedAssignments = assignments.map((assignment: any) => {
      if (filters?.include_details && assignment.profiles) {
        const profile = assignment.profiles;
        if (profile.profile_skills && profile.profile_skills.length > 0) {
          profile.primary_skill = profile.profile_skills[0].skill_categories?.name;
        }
        delete profile.profile_skills;

        return {
          ...assignment,
          profile: profile,
          project: assignment.projects,
          profiles: undefined,
          projects: undefined,
        };
      }
      return assignment;
    });

    return { assignments: transformedAssignments, total };
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(
    id: string,
    includeDetails = false
  ): Promise<ProjectAssignmentWithDetails> {
    const assignment = await prisma.project_assignments.findUnique({
      where: { id },
      include: includeDetails ? { profiles: true, projects: true } : undefined,
    });

    if (!assignment) {
      throw new AppError('Assignment not found', 404);
    }

    if (includeDetails) {
      return {
        ...assignment,
        profile: (assignment as any).profiles,
        project: (assignment as any).projects,
        profiles: undefined,
        projects: undefined,
      } as any;
    }

    return assignment;
  }
}
