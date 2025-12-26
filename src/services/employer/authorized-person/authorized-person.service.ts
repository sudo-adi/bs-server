import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  CreateAuthorizedPersonRequest,
  UpdateAuthorizedPersonRequest,
} from '@/dtos/employer/employer.dto';
import { ensureSinglePrimary, getEmployerOrThrow } from '../helpers/employer-lookup.helper';

/**
 * Get authorized persons for an employer
 */
export async function getAuthorizedPersons(employerId: string): Promise<any[]> {
  try {
    await getEmployerOrThrow(employerId);

    return await prisma.employerAuthorizedPerson.findMany({
      where: { employerId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: any) {
    logger.error('Error fetching authorized persons', { error, employerId });
    throw new Error(error.message || 'Failed to fetch authorized persons');
  }
}

/**
 * Get authorized person by ID
 */
export async function getAuthorizedPersonById(id: string): Promise<any> {
  try {
    const authorizedPerson = await prisma.employerAuthorizedPerson.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            employerCode: true,
            companyName: true,
            clientName: true,
            email: true,
          },
        },
      },
    });

    if (!authorizedPerson) {
      throw new Error('Authorized person not found');
    }

    return authorizedPerson;
  } catch (error: any) {
    logger.error('Error fetching authorized person by ID', { error, id });
    throw new Error(error.message || 'Failed to fetch authorized person');
  }
}

/**
 * Create authorized person
 */
export async function createAuthorizedPerson(
  employerId: string,
  data: CreateAuthorizedPersonRequest
): Promise<any> {
  try {
    await getEmployerOrThrow(employerId);

    if (data.isPrimary) {
      await ensureSinglePrimary(employerId);
    }

    const authorizedPerson = await prisma.employerAuthorizedPerson.create({
      data: {
        ...data,
        employerId,
      },
    });

    logger.info('Authorized person created', {
      id: authorizedPerson.id,
      employerId,
    });

    return authorizedPerson;
  } catch (error: any) {
    logger.error('Error creating authorized person', { error, employerId });
    throw new Error(error.message || 'Failed to create authorized person');
  }
}

/**
 * Update authorized person
 */
export async function updateAuthorizedPerson(
  employerId: string,
  personId: string,
  data: UpdateAuthorizedPersonRequest
): Promise<any> {
  try {
    const person = await prisma.employerAuthorizedPerson.findFirst({
      where: { id: personId, employerId },
    });

    if (!person) {
      throw new Error('Authorized person not found');
    }

    if (data.isPrimary) {
      await ensureSinglePrimary(employerId, personId);
    }

    const updatedPerson = await prisma.employerAuthorizedPerson.update({
      where: { id: personId },
      data,
    });

    logger.info('Authorized person updated', { id: personId, employerId });

    return updatedPerson;
  } catch (error: any) {
    logger.error('Error updating authorized person', { error, personId });
    throw new Error(error.message || 'Failed to update authorized person');
  }
}

/**
 * Delete authorized person
 */
export async function deleteAuthorizedPerson(employerId: string, personId: string): Promise<void> {
  try {
    const person = await prisma.employerAuthorizedPerson.findFirst({
      where: { id: personId, employerId },
    });

    if (!person) {
      throw new Error('Authorized person not found');
    }

    await prisma.employerAuthorizedPerson.delete({
      where: { id: personId },
    });

    logger.info('Authorized person deleted', { id: personId, employerId });
  } catch (error: any) {
    logger.error('Error deleting authorized person', { error, personId });
    throw new Error(error.message || 'Failed to delete authorized person');
  }
}
