import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  CreateEmployerRequest,
  CreateEmployerWithProjectRequest,
  CreateEmployerWithProjectResponse,
  EmployerResponseDto,
} from '@/dtos/employer/employer.dto';
import { validateEmailUniqueness } from '../helpers/email-validator.helper';
import { toEmployerResponse } from '../helpers/response-mapper.helper';

/**
 * Create a new employer
 * NOTE: Employer code (BSE-XXXXX) is NOT generated at creation
 * It will be assigned only after admin verification
 */
export async function createEmployer(data: CreateEmployerRequest): Promise<EmployerResponseDto> {
  try {
    await validateEmailUniqueness(data.email!);
    const employer = await prisma.employer.create({
      data: {
        ...data,
        employerCode: null,
        isActive: data.isActive ?? true,
        isVerified: false,
        status: data.status || 'pending',
      },
    });

    logger.info('Employer created (pending verification)', { id: employer.id });
    return toEmployerResponse(employer) as EmployerResponseDto;
  } catch (error: any) {
    logger.error('Error creating employer', { error });
    throw new Error(error.message || 'Failed to create employer');
  }
}

/**
 * Create employer with nested project and authorized persons in a single transaction
 */
export async function createEmployerWithProject(
  data: CreateEmployerWithProjectRequest,
  createdByProfileId?: string
): Promise<CreateEmployerWithProjectResponse> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      await validateEmailUniqueness(data.email!, undefined, tx);

      // Create employer
      const employer = await tx.employer.create({
        data: {
          companyName: data.companyName,
          clientName: data.clientName,
          email: data.email,
          phone: data.phone,
          altPhone: data.altPhone,
          registeredAddress: data.registeredAddress,
          companyRegistrationNumber: data.companyRegistrationNumber,
          gstNumber: data.gstNumber,
          logoUrl: data.logoUrl,
          city: data.city,
          district: data.district,
          state: data.state,
          landmark: data.landmark,
          postalCode: data.postalCode,
          employerCode: null,
          isActive: data.isActive ?? true,
          isVerified: false,
          status: data.status || 'pending',
        },
      });

      // Create authorized persons if provided
      const createdAuthorizedPersons: any[] = [];
      if (data.authorizedPersons && data.authorizedPersons.length > 0) {
        for (const person of data.authorizedPersons) {
          const shouldBePrimary: boolean =
            person.isPrimary ?? createdAuthorizedPersons.length === 0;

          const newAuthorizedPerson = await tx.employerAuthorizedPerson.create({
            data: {
              employerId: employer.id,
              name: person.name,
              designation: person.designation,
              email: person.email,
              phone: person.phone,
              address: person.address,
              isPrimary: shouldBePrimary,
            },
          });
          createdAuthorizedPersons.push(newAuthorizedPerson);
        }
      }

      // Create project if provided
      let createdProject = null;
      if (data.project) {
        createdProject = await tx.project.create({
          data: {
            name: data.project.name,
            location: data.project.location,
            contactPhone: data.project.contactPhone,
            description: data.project.description,
            poCoNumber: data.project.poCoNumber,
            deploymentDate: data.project.deploymentDate
              ? new Date(data.project.deploymentDate)
              : undefined,
            awardDate: data.project.awardDate ? new Date(data.project.awardDate) : undefined,
            startDate: data.project.startDate ? new Date(data.project.startDate) : undefined,
            endDate: data.project.endDate ? new Date(data.project.endDate) : undefined,
            revisedCompletionDate: data.project.revisedCompletionDate
              ? new Date(data.project.revisedCompletionDate)
              : undefined,
            stage: data.project.status || 'draft',
            projectManagerProfileId: data.project.projectManagerProfileId,
            isActive: data.project.isActive ?? true,
            isAccommodationProvided: data.project.isAccommodationProvided,
            employerId: employer.id,
            createdByProfileId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Create initial project stage history
        await tx.projectStageHistory.create({
          data: {
            projectId: createdProject.id,
            previousStage: null,
            newStage: createdProject.stage || 'draft',
            changedAt: new Date(),
            changedByProfileId: createdByProfileId,
            reason: 'Project created with employer',
          },
        });
      }

      return {
        employer,
        authorizedPersons: createdAuthorizedPersons,
        project: createdProject,
      };
    });

    logger.info('Employer with project created (pending verification)', {
      employerId: result.employer.id,
      authorizedPersonsCount: result.authorizedPersons.length,
      projectId: result.project?.id,
    });

    return {
      employer: toEmployerResponse(result.employer) as EmployerResponseDto,
      authorizedPersons: result.authorizedPersons,
      project: result.project,
    };
  } catch (error: any) {
    logger.error('Error creating employer with project', { error });
    throw new Error(error.message || 'Failed to create employer with project');
  }
}
