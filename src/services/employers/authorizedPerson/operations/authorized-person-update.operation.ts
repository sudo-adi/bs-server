import prisma from '@/config/prisma';
import type { employer_authorized_persons } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { UpdateEmployerAuthorizedPersonDto } from '@/types';

export class AuthorizedPersonUpdateOperation {
  static async update(
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
}
