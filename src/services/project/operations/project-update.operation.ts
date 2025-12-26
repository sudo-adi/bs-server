import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ProjectDetailDto, UpdateProjectRequest, UpdateProjectStageRequest, ProjectResponseDto } from '@/dtos/project';
import { Prisma } from '@/generated/prisma';
import {
  getProjectOrThrow,
  logProjectStageChange,
  normalizeProjectDateFields,
} from '../helpers';
import { upsertProjectFinancials } from '../helpers/financial.helpers';
import { getProjectById } from '../queries/project-detail.query';

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  data: UpdateProjectRequest,
  updatedByProfileId?: string
): Promise<ProjectDetailDto> {
  try {
    await getProjectOrThrow(id);

    const dateFields = normalizeProjectDateFields(data);
    const poCoNumber = data.poCoNumber;
    const isAccommodationProvided = data.isAccommodationProvided ?? data.is_accommodation_provided;
    const employerId = data.employerId;
    const terminationReason = data.terminationReason || data.termination_reason;

    const updateData: Prisma.ProjectUpdateInput = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.location !== undefined) updateData.location = data.location;
    if (dateFields.contactPhone !== undefined) updateData.contactPhone = dateFields.contactPhone;
    if (data.description !== undefined) updateData.description = data.description;
    if (poCoNumber !== undefined) updateData.poCoNumber = poCoNumber;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (isAccommodationProvided !== undefined) updateData.isAccommodationProvided = isAccommodationProvided;
    if (data.currentAttributableTo !== undefined) updateData.onHoldAttributableTo = data.currentAttributableTo;
    if (data.onHoldReason !== undefined) updateData.stageChangeReason = data.onHoldReason;
    if (terminationReason !== undefined) updateData.stageChangeReason = terminationReason;
    if (data.status !== undefined) updateData.stage = data.status;

    if (dateFields.deploymentDate !== undefined) updateData.deploymentDate = dateFields.deploymentDate;
    if (dateFields.awardDate !== undefined) updateData.awardDate = dateFields.awardDate;
    if (dateFields.startDate !== undefined) updateData.startDate = dateFields.startDate;
    if (dateFields.endDate !== undefined) updateData.endDate = dateFields.endDate;
    if (dateFields.revisedCompletionDate !== undefined) updateData.revisedCompletionDate = dateFields.revisedCompletionDate;
    if (dateFields.actualStartDate !== undefined) updateData.actualStartDate = dateFields.actualStartDate;
    if (dateFields.actualEndDate !== undefined) updateData.actualEndDate = dateFields.actualEndDate;
    if (dateFields.terminationDate !== undefined) updateData.terminationDate = dateFields.terminationDate;

    if (data.projectManagerProfileId !== undefined) {
      updateData.projectManager = data.projectManagerProfileId ? { connect: { id: data.projectManagerProfileId } } : { disconnect: true };
    }
    if (employerId !== undefined) {
      updateData.employer = employerId ? { connect: { id: employerId } } : { disconnect: true };
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({ where: { id }, data: updateData });
      await upsertProjectFinancials(tx, id, data);
    });

    logger.info('Project updated', { id });
    const updatedProject = await getProjectById(id);
    return updatedProject as ProjectDetailDto;
  } catch (error: any) {
    logger.error('Error updating project', { error, id });
    throw new Error(error.message || 'Failed to update project');
  }
}

/**
 * Update project stage (simple stage change without business logic)
 */
export async function updateProjectStage(
  id: string,
  data: UpdateProjectStageRequest,
  changedByProfileId?: string
): Promise<ProjectResponseDto> {
  try {
    const existingProject = await getProjectOrThrow(id);
    const previousStage = existingProject.stage;

    const project = await prisma.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: { id },
        data: { stage: data.stage, stageChangedAt: new Date(), stageChangeReason: data.changeReason, updatedAt: new Date() },
      });

      await logProjectStageChange(tx, id, previousStage, data.stage, changedByProfileId, data.changeReason);
      return updatedProject;
    });

    logger.info('Project stage updated', { id, previousStage, newStage: data.stage });
    return project as ProjectResponseDto;
  } catch (error: any) {
    logger.error('Error updating project stage', { error, id });
    throw new Error(error.message || 'Failed to update project stage');
  }
}
