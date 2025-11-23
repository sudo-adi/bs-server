import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { TrainingBatch, UpdateTrainingBatchDto } from '@/models/training/trainingBatch.model';

export class TrainingBatchUpdateOperation {
  async updateTrainingBatch(id: string, data: UpdateTrainingBatchDto): Promise<TrainingBatch> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const batch = await prisma.training_batches.update({
        where: { id },
        data,
      });

      return batch;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Training batch not found', 404);
      }
      throw error;
    }
  }
}
