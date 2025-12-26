import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ProjectListDto, ProjectListQuery, SkillRequirementWithCount } from '@/dtos/project';
import { Prisma } from '@/generated/prisma';

/**
 * Get all projects with filters and pagination
 * Includes skill requirements with assigned worker counts
 */
export async function getAllProjects(query: ProjectListQuery): Promise<{
  data: ProjectListDto[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  try {
    const { page = 1, limit = 10, search, status, isActive, employerId, projectManagerProfileId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { projectCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { poCoNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.stage = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (employerId) where.employerId = employerId;
    if (projectManagerProfileId) where.projectManagerProfileId = projectManagerProfileId;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          projectCode: true,
          name: true,
          location: true,
          stage: true,
          startDate: true,
          endDate: true,
          isActive: true,
          employerId: true,
          createdAt: true,
          resourceRequirements: {
            select: {
              id: true,
              skillCategoryId: true,
              requiredCount: true,
              skillCategory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          workerAssignments: {
            where: {
              removedAt: null, // Only count active assignments
            },
            select: {
              id: true,
              profileId: true,
              stage: true,
              profile: {
                select: {
                  skills: {
                    select: {
                      skillCategoryId: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Transform projects to include skill requirements with counts
    const transformedProjects: ProjectListDto[] = projects.map((project) => {
      // Calculate assigned count per skill category
      const skillRequirements: SkillRequirementWithCount[] = project.resourceRequirements.map((req) => {
        // Count workers assigned to this project who have this skill
        const assignedCount = project.workerAssignments.filter((assignment) => {
          const workerSkillIds = assignment.profile?.skills?.map((s) => s.skillCategoryId) || [];
          return workerSkillIds.includes(req.skillCategoryId);
        }).length;

        return {
          skillCategoryId: req.skillCategoryId || '',
          skillCategoryName: req.skillCategory?.name || 'Unknown',
          requiredCount: req.requiredCount || 0,
          assignedCount,
        };
      });

      return {
        id: project.id,
        projectCode: project.projectCode,
        name: project.name,
        location: project.location,
        stage: project.stage,
        startDate: project.startDate,
        endDate: project.endDate,
        isActive: project.isActive,
        employerId: project.employerId,
        createdAt: project.createdAt,
        skillRequirements,
      };
    });

    return {
      data: transformedProjects,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    logger.error('Error fetching projects', { error });
    throw new Error('Failed to fetch projects');
  }
}
