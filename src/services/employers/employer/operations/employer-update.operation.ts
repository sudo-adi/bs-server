import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Employer, UpdateEmployerDto } from '@/models/employers/employer.model';

export class EmployerUpdateOperation {
  static async update(id: string, data: UpdateEmployerDto): Promise<Employer> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Check if employer exists and is not deleted
    const existing = await prisma.employers.findUnique({
      where: { id },
    });

    if (!existing || existing.deleted_at) {
      throw new AppError('Employer not found', 404);
    }

    const employer = await prisma.employers.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return employer;
  }
}
