import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerProjectDto, WorkerProjectsQueryDto, WorkerProjectsResponseDto } from '@/dtos/worker/worker.dto';

export class WorkerProjectsQuery {
  /**
   * Get worker's assigned projects
   */
  static async execute(
    profileId: string,
    query: WorkerProjectsQueryDto = {}
  ): Promise<WorkerProjectsResponseDto> {
    try {
      const { status = 'active' } = query;

      // Build where clause based on status filter
      const whereClause: any = {
        profileId,
        removedAt: null, // Only show non-removed assignments
      };

      // Filter by project stage based on status
      if (status === 'active') {
        whereClause.project = {
          stage: { in: ['approved', 'in_progress', 'on_hold'] },
        };
      } else if (status === 'completed') {
        whereClause.project = {
          stage: { in: ['completed', 'short_closed', 'terminated'] },
        };
      }
      // 'all' doesn't add any filter

      const assignments = await prisma.projectWorkerAssignment.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              projectCode: true,
              name: true,
              location: true,
              stage: true,
              startDate: true,
              endDate: true,
              employer: {
                select: {
                  id: true,
                  companyName: true,
                },
              },
              projectManager: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: [{ deployedAt: 'desc' }, { assignedAt: 'desc' }],
      });

      const projects: WorkerProjectDto[] = assignments
        .filter((assignment) => assignment.project !== null)
        .map((assignment) => ({
          assignmentId: assignment.id,
          project: {
            id: assignment.project!.id,
            projectCode: assignment.project!.projectCode,
            name: assignment.project!.name,
            location: assignment.project!.location,
            stage: assignment.project!.stage,
            startDate: assignment.project!.startDate,
            endDate: assignment.project!.endDate,
          },
          employer: assignment.project!.employer
            ? {
                id: assignment.project!.employer.id,
                companyName: assignment.project!.employer.companyName,
              }
            : null,
          assignment: {
            stage: assignment.stage,
            assignedAt: assignment.assignedAt,
            deployedAt: assignment.deployedAt,
          },
          projectManager: assignment.project!.projectManager
            ? {
                firstName: assignment.project!.projectManager.firstName,
                lastName: assignment.project!.projectManager.lastName,
                phone: assignment.project!.projectManager.phone,
              }
            : null,
        }));

      return {
        projects,
        total: projects.length,
      };
    } catch (error) {
      logger.error('Error fetching worker projects', { error, profileId });
      throw new Error('Failed to fetch worker projects');
    }
  }
}
