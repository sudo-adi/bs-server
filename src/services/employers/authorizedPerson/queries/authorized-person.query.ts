import prisma from '@/config/prisma';
import type { employer_authorized_persons } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class AuthorizedPersonQuery {
  /**
   * Get all authorized persons by employer ID
   */
  static async getAllByEmployerId(employerId: string): Promise<employer_authorized_persons[]> {
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

  /**
   * Get authorized person by ID
   */
  static async getById(id: string): Promise<employer_authorized_persons> {
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
}
