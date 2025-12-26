import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  EmployerDetailDto,
  UpdateEmployerRequest,
  UpdateEmployerWithAuthorizedPersonsRequest,
  UpdateEmployerWithAuthorizedPersonsResponse,
} from '@/dtos/employer/employer.dto';
import { validateEmailUniqueness } from '../helpers/email-validator.helper';
import { ensureSinglePrimary, getEmployerOrThrow } from '../helpers/employer-lookup.helper';
import { toEmployerResponse } from '../helpers/response-mapper.helper';
import { getEmployerById } from '../queries/employer-detail.query';

/**
 * Update employer
 */
export async function updateEmployer(
  id: string,
  data: UpdateEmployerRequest
): Promise<EmployerDetailDto> {
  try {
    const existingEmployer = await getEmployerOrThrow(id);

    if (data.email && data.email !== existingEmployer.email) {
      await validateEmailUniqueness(data.email, id);
    }

    await prisma.employer.update({
      where: { id },
      data,
    });

    logger.info('Employer updated', { id });

    const updatedEmployer = await getEmployerById(id);
    return updatedEmployer as EmployerDetailDto;
  } catch (error: any) {
    logger.error('Error updating employer', { error, id });
    throw new Error(error.message || 'Failed to update employer');
  }
}

/**
 * Update employer with authorized persons in a single transaction (unified API)
 */
export async function updateEmployerWithAuthorizedPersons(
  id: string,
  data: UpdateEmployerWithAuthorizedPersonsRequest
): Promise<UpdateEmployerWithAuthorizedPersonsResponse> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingEmployer = await tx.employer.findUnique({
        where: { id, deletedAt: null },
        include: { authorizedPersons: true },
      });

      if (!existingEmployer) {
        throw new Error('Employer not found');
      }

      if (data.email && data.email !== existingEmployer.email) {
        await validateEmailUniqueness(data.email, id, tx);
      }

      const { authorizedPersons, ...employerData } = data;

      // Update employer
      await tx.employer.update({
        where: { id },
        data: employerData,
      });

      // Handle authorized persons if provided
      const updatedAuthorizedPersons: any[] = [];

      if (authorizedPersons && authorizedPersons.length > 0) {
        const existingPersonIds = existingEmployer.authorizedPersons.map((p) => p.id);

        const toDelete: string[] = [];
        const toUpdate: { id: string; data: any }[] = [];
        const toCreate: any[] = [];

        for (const person of authorizedPersons) {
          if (person._delete && person.id) {
            toDelete.push(person.id);
          } else if (person.id && existingPersonIds.includes(person.id)) {
            const { id: personId, _delete, ...personData } = person;
            toUpdate.push({ id: personId, data: personData });
          } else if (!person.id && person.name?.trim()) {
            const { id: _, _delete, ...personData } = person;
            toCreate.push(personData);
          }
        }

        // Delete marked persons
        if (toDelete.length > 0) {
          await tx.employerAuthorizedPerson.deleteMany({
            where: { id: { in: toDelete }, employerId: id },
          });
        }

        // Update existing persons
        for (const { id: personId, data: personData } of toUpdate) {
          if (personData.isPrimary) {
            await ensureSinglePrimary(id, personId, tx);
          }

          const updated = await tx.employerAuthorizedPerson.update({
            where: { id: personId },
            data: personData,
          });
          updatedAuthorizedPersons.push(updated);
        }

        // Create new persons
        for (const personData of toCreate) {
          if (personData.isPrimary) {
            await ensureSinglePrimary(id, undefined, tx);
          }

          const created = await tx.employerAuthorizedPerson.create({
            data: {
              ...personData,
              employerId: id,
            },
          });
          updatedAuthorizedPersons.push(created);
        }

        // Ensure at least one primary if none exists
        const remainingPersons = await tx.employerAuthorizedPerson.findMany({
          where: { employerId: id },
        });

        if (remainingPersons.length > 0 && !remainingPersons.some((p) => p.isPrimary)) {
          await tx.employerAuthorizedPerson.update({
            where: { id: remainingPersons[0].id },
            data: { isPrimary: true },
          });
        }
      }

      // Fetch the updated employer with all relations
      const updatedEmployer = await tx.employer.findUnique({
        where: { id },
        include: {
          authorizedPersons: {
            orderBy: { createdAt: 'desc' },
          },
          projectRequests: {
            include: {
              requirements: {
                include: {
                  skillCategory: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          projects: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
          statusHistory: {
            include: {
              changedByProfile: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { changedAt: 'desc' },
          },
          verifiedByProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        employer: updatedEmployer,
        authorizedPersons: updatedEmployer?.authorizedPersons || [],
      };
    });

    logger.info('Employer with authorized persons updated', {
      employerId: id,
      authorizedPersonsCount: result.authorizedPersons.length,
    });

    return {
      employer: toEmployerResponse(result.employer!) as EmployerDetailDto,
      authorizedPersons: result.authorizedPersons,
    };
  } catch (error: any) {
    logger.error('Error updating employer with authorized persons', { error, id });
    throw new Error(error.message || 'Failed to update employer with authorized persons');
  }
}
