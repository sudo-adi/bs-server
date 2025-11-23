import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class AuthorizedPersonDeleteOperation {
  static async delete(id: string): Promise<void> {
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
