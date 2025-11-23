import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class InteractionDeleteOperation {
  static async delete(id: string): Promise<void> {
    const existingInteraction = await prisma.interactions.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      throw new AppError('Interaction not found', 404);
    }

    await prisma.interactions.delete({
      where: { id },
    });
  }
}
