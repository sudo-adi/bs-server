import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares';

export class TrainingBatchDeleteOperation {
  async delete(id: string): Promise<void> {
    try {
      await prisma.trainingBatch.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Training batch not found', 404);
      }
      throw error;
    }
  }
}
