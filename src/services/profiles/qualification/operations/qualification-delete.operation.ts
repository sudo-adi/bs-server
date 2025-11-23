import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class QualificationDeleteOperation {
  static async delete(id: string): Promise<void> {
    const existingQualification = await prisma.qualifications.findUnique({
      where: { id },
    });

    if (!existingQualification) {
      throw new AppError('Qualification not found', 404);
    }

    await prisma.qualifications.delete({
      where: { id },
    });
  }
}
