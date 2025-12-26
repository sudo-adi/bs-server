import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ProjectDetailDto, SkillRequirementWithCount, ResourceRequirementDto } from '@/dtos/project';

/**
 * Get project by ID with full details
 * Includes skill requirements with assigned worker counts
 */
export async function getProjectById(id: string): Promise<ProjectDetailDto | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id, deletedAt: null },
      include: {
        employer: { select: { id: true, companyName: true, employerCode: true } },
        projectManager: { select: { id: true, firstName: true, lastName: true } },
        createdByProfile: { select: { id: true, firstName: true, lastName: true } },
        resourceRequirements: {
          include: { skillCategory: true },
          orderBy: { createdAt: 'desc' },
        },
        workerAssignments: {
          where: { removedAt: null },
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                workerCode: true,
                candidateCode: true,
                skills: {
                  select: {
                    skillCategoryId: true,
                  },
                },
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        financials: { orderBy: { createdAt: 'desc' } },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
          take: 10,
          include: {
            changedByProfile: { select: { id: true, firstName: true, lastName: true } },
            documents: {
              select: {
                id: true,
                documentUrl: true,
                fileName: true,
                documentType: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!project) return null;

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

    // Transform resourceRequirements to include assignedCount
    const resourceRequirements: ResourceRequirementDto[] = project.resourceRequirements.map((req) => {
      const assignedCount = project.workerAssignments.filter((assignment) => {
        const workerSkillIds = assignment.profile?.skills?.map((s) => s.skillCategoryId) || [];
        return workerSkillIds.includes(req.skillCategoryId);
      }).length;

      return {
        id: req.id,
        skillCategoryId: req.skillCategoryId,
        requiredCount: req.requiredCount || 0,
        assignedCount,
        skillCategory: req.skillCategory
          ? {
              id: req.skillCategory.id,
              name: req.skillCategory.name,
            }
          : null,
      };
    });

    return {
      ...project,
      resourceRequirements,
      skillRequirements,
    } as ProjectDetailDto;
  } catch (error) {
    logger.error('Error fetching project by ID', { error, id });
    throw new Error('Failed to fetch project');
  }
}
