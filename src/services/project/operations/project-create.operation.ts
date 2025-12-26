import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { PROJECT_STAGES } from '@/constants/stages';
import { CreateProjectRequest, ProjectResponseDto } from '@/dtos/project';
import {
  generateProjectCode,
  logProjectStageChange,
  normalizeProjectDateFields,
} from '../helpers';
import { createProjectFinancials } from '../helpers/financial.helpers';

/**
 * Create a new project with resource requirements and financials
 */
export async function createProject(
  data: CreateProjectRequest,
  createdByProfileId?: string
): Promise<ProjectResponseDto> {
  try {
    const dateFields = normalizeProjectDateFields(data);
    const poCoNumber = data.poCoNumber;
    const isAccommodationProvided = data.isAccommodationProvided ?? data.is_accommodation_provided;
    const employerId = data.employerId;
    const resourceRequirements = data.resourceRequirements || data.resource_requirements || [];

    const result = await prisma.$transaction(async (tx) => {
      const projectCode = await generateProjectCode(tx);

      const project = await tx.project.create({
        data: {
          projectCode,
          name: data.name,
          location: data.location,
          contactPhone: dateFields.contactPhone,
          deploymentDate: dateFields.deploymentDate,
          awardDate: dateFields.awardDate,
          startDate: dateFields.startDate,
          endDate: dateFields.endDate,
          revisedCompletionDate: dateFields.revisedCompletionDate,
          stage: PROJECT_STAGES.APPROVED,
          projectManagerProfileId: data.projectManagerProfileId,
          description: data.description,
          poCoNumber,
          isActive: data.isActive ?? true,
          isAccommodationProvided,
          employerId,
          createdByProfileId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (resourceRequirements.length > 0) {
        await tx.projectResourceRequirement.createMany({
          data: resourceRequirements.map((req) => ({
            projectId: project.id,
            skillCategoryId: req.skillCategoryId || req.skill_category_id,
            requiredCount: req.requiredCount ?? req.required_count ?? 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      await createProjectFinancials(tx, project.id, data);

      await logProjectStageChange(tx, project.id, null, project.stage!, createdByProfileId, 'Project created');
      return project;
    });

    logger.info('Project created', { id: result.id, name: result.name });
    return result as ProjectResponseDto;
  } catch (error: any) {
    logger.error('Error creating project', { error });
    throw new Error(error.message || 'Failed to create project');
  }
}

/**
 * Create a project from an employer project request
 */
export async function createProjectFromRequest(
  projectRequestId: string,
  userId?: string
): Promise<ProjectResponseDto> {
  try {
    const projectRequest = await prisma.projectRequest.findUnique({
      where: { id: projectRequestId },
      include: { employer: true, requirements: { include: { skillCategory: true } } },
    });

    if (!projectRequest) throw new Error('Project request not found');
    if (projectRequest.status === 'project_created') throw new Error('Project has already been created from this request');
    if (projectRequest.status === 'rejected') throw new Error('Cannot create project from a rejected request');

    let endDate: Date | undefined;
    if (projectRequest.estimatedStartDate && projectRequest.estimatedDurationDays) {
      endDate = new Date(projectRequest.estimatedStartDate);
      endDate.setDate(endDate.getDate() + projectRequest.estimatedDurationDays);
    }

    const result = await prisma.$transaction(async (tx) => {
      const projectCode = await generateProjectCode(tx);

      const project = await tx.project.create({
        data: {
          projectCode,
          name: projectRequest.projectTitle || 'Untitled Project',
          description: projectRequest.projectDescription,
          location: projectRequest.location,
          startDate: projectRequest.estimatedStartDate,
          endDate,
          stage: PROJECT_STAGES.APPROVED,
          isActive: true,
          employerId: projectRequest.employerId,
          createdByProfileId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (projectRequest.requirements?.length > 0) {
        await tx.projectResourceRequirement.createMany({
          data: projectRequest.requirements.map((req) => ({
            projectId: project.id,
            skillCategoryId: req.skillCategoryId,
            requiredCount: req.requiredCount || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
        });
      }

      if (projectRequest.estimatedBudget) {
        await tx.projectFinancial.create({
          data: { projectId: project.id, budget: projectRequest.estimatedBudget, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      await logProjectStageChange(tx, project.id, null, PROJECT_STAGES.APPROVED, userId, 'Project created from employer request');

      await tx.projectRequest.update({
        where: { id: projectRequestId },
        data: { status: 'project_created', projectId: project.id, reviewedByProfileId: userId, reviewedAt: new Date(), updatedAt: new Date() },
      });

      return project;
    });

    logger.info('Project created from request', { projectId: result.id, projectRequestId });
    return result as ProjectResponseDto;
  } catch (error: any) {
    logger.error('Error creating project from request', { error, projectRequestId });
    throw new Error(error.message || 'Failed to create project from request');
  }
}
