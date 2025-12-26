import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class BatchEnrollmentUpdateOperation {
  static async update(id: string, data: Record<string, any>): Promise<any> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const currentEnrollment = await tx.trainingBatchEnrollment.findUnique({
          where: { id },
        });

        if (!currentEnrollment) {
          throw new AppError('Enrollment not found', 404);
        }

        const enrollment = await tx.trainingBatchEnrollment.update({
          where: { id },
          data,
        });

        return enrollment;
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Enrollment not found', 404);
      }
      throw error;
    }
  }
}
