import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class TrainerDeleteOperation {
  async delete(id: string): Promise<void> {
    // Check if trainer exists
    const trainer = await prisma.trainers.findUnique({
      where: { id },
      include: {
        training_batches: {
          select: { id: true },
        },
      },
    });

    if (!trainer) {
      throw new AppError('Trainer not found', 404);
    }

    // Check if trainer has associated batches
    if (trainer.training_batches && trainer.training_batches.length > 0) {
      throw new AppError(
        `Cannot delete trainer. They are assigned to ${trainer.training_batches.length} training batch(es)`,
        409
      );
    }

    // Delete trainer
    await prisma.trainers.delete({
      where: { id },
    });
  }
}
