import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Prisma } from '@/generated/prisma';

export class BatchEnrollmentDeleteOperation {
  static async delete(id: string): Promise<void> {
    try {
      await prisma.batch_enrollments.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Enrollment not found', 404);
      }
      throw error;
    }
  }
}
