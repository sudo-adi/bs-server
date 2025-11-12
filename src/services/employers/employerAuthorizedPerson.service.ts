import prisma from '@/config/prisma';
import type { employer_authorized_persons } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateEmployerAuthorizedPersonDto,
  UpdateEmployerAuthorizedPersonDto,
} from '@/models/employers/employer.model';

export class EmployerAuthorizedPersonService {
  async getAllByEmployerId(employerId: string): Promise<employer_authorized_persons[]> {
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: employerId },
    });

    if (!employer || employer.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    const authorizedPersons = await prisma.employer_authorized_persons.findMany({
      where: { employer_id: employerId },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
    });

    return authorizedPersons;
  }

  async getById(id: string): Promise<employer_authorized_persons> {
    const authorizedPerson = await prisma.employer_authorized_persons.findUnique({
      where: { id },
      include: {
        employers: {
          select: {
            id: true,
            employer_code: true,
            company_name: true,
            client_name: true,
            email: true,
          },
        },
      },
    });

    if (!authorizedPerson) {
      throw new AppError('Authorized person not found', 404);
    }

    return authorizedPerson;
  }

  async create(data: CreateEmployerAuthorizedPersonDto): Promise<employer_authorized_persons> {
    // Verify employer exists
    const employer = await prisma.employers.findUnique({
      where: { id: data.employer_id },
    });

    if (!employer || employer.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    // If this is set as primary, unset other primary contacts
    if (data.is_primary) {
      await prisma.employer_authorized_persons.updateMany({
        where: {
          employer_id: data.employer_id,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    const authorizedPerson = await prisma.employer_authorized_persons.create({
      data: {
        employer_id: data.employer_id,
        name: data.name,
        designation: data.designation,
        email: data.email,
        phone: data.phone,
        address: data.address,
        is_primary: data.is_primary ?? false,
      },
    });

    return authorizedPerson;
  }

  async update(
    id: string,
    data: UpdateEmployerAuthorizedPersonDto
  ): Promise<employer_authorized_persons> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const existing = await prisma.employer_authorized_persons.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Authorized person not found', 404);
    }

    // If this is set as primary, unset other primary contacts for this employer
    if (data.is_primary) {
      await prisma.employer_authorized_persons.updateMany({
        where: {
          employer_id: existing.employer_id,
          is_primary: true,
          id: { not: id },
        },
        data: {
          is_primary: false,
        },
      });
    }

    const authorizedPerson = await prisma.employer_authorized_persons.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return authorizedPerson;
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.employer_authorized_persons.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Authorized person not found', 404);
    }

    // Don't allow deletion if this is the only authorized person
    const count = await prisma.employer_authorized_persons.count({
      where: { employer_id: existing.employer_id },
    });

    if (count === 1) {
      throw new AppError(
        'Cannot delete the only authorized person. Add another authorized person first.',
        400
      );
    }

    await prisma.employer_authorized_persons.delete({
      where: { id },
    });
  }
}

export default new EmployerAuthorizedPersonService();
