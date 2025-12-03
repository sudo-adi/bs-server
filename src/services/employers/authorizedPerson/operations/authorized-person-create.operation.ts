import prisma from '@/config/prisma';
import type { employer_authorized_persons } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { CreateEmployerAuthorizedPersonDto } from '@/types';

export class AuthorizedPersonCreateOperation {
  static async create(
    data: CreateEmployerAuthorizedPersonDto
  ): Promise<employer_authorized_persons> {
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
}
